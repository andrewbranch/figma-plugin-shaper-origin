import {
  Button,
  Container,
  Inline,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { Gesture } from "@use-gesture/vanilla";
import { saveAs } from "file-saver";
import { h } from "preact";
import { useCallback, useEffect, useMemo, useRef } from "preact/hooks";
import { ExportReadySVG } from "../../types";
import { prepareEncodedSvg } from "../prepareEncodedSvg";
import { getCutSVG } from "./main";

export interface PreviewProps {
  preview: ExportReadySVG;
}

export function Preview(props: PreviewProps) {
  const encoded = useMemo(() => {
    return prepareEncodedSvg(props.preview);
  }, [props.preview]);

  const svgElement = useMemo(() => {
    const rendered = document.documentElement.appendChild(encoded);
    const outlinedString = getCutSVG(rendered);
    document.documentElement.removeChild(rendered);
    const parser = new DOMParser();
    const outlinedDoc = parser.parseFromString(outlinedString, "image/svg+xml");
    return outlinedDoc.documentElement as any as SVGSVGElement;
  }, [encoded]);

  const handleBackClick = useCallback(() => {
    emit("CLOSE_PREVIEW");
  }, []);

  const handleExportClick = useCallback(() => {
    const serialized = new XMLSerializer().serializeToString(encoded);
    saveAs(
      new Blob([serialized], { type: "image/svg+xml" }),
      props.preview.fileName
    );
  }, [props.preview]);

  const bodyRef = useRef<HTMLDivElement>(null);
  const eventTargetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let gesture: Gesture | undefined;
    let resizeListener: () => void;
    if (bodyRef.current && eventTargetRef.current && svgElement) {
      bodyRef.current.innerHTML = "";
      bodyRef.current.appendChild(svgElement);
      const { width: originalWidth, height: originalHeight } =
        svgElement.viewBox.baseVal;

      let box = svgElement.getBoundingClientRect();
      resizeListener = on(
        "WINDOW_RESIZED",
        () => (box = svgElement.getBoundingClientRect())
      );

      // handle zoom
      gesture = new Gesture(
        eventTargetRef.current,
        {
          onPinch: (state) => {
            const scale = 1 / state.offset[0];
            const [pointerX, pointerY] = state.origin;
            const pointerXRatio = pointerX / box.width;
            const pointerYRatio = pointerY / box.height;
            const { width: prevWidth, height: prevHeight } =
              svgElement.viewBox.baseVal;
            const newWidth = originalWidth * scale;
            const newHeight = originalHeight * scale;
            const dw = newWidth - prevWidth;
            const dh = newHeight - prevHeight;
            // If pointer is far left, viewBox x doesn't move
            // If pointer is far right, viewBox x moves left by dw to compensate
            // If pointer is center, viewBox x moves left by dw / 2
            const dx = -dw * pointerXRatio;
            const dy = -dh * pointerYRatio;
            svgElement.viewBox.baseVal.x += dx;
            svgElement.viewBox.baseVal.y += dy;
            svgElement.viewBox.baseVal.width = newWidth;
            svgElement.viewBox.baseVal.height = newHeight;
          },
          onWheel: (state) => {
            if (!state.pinching) {
              svgElement.viewBox.baseVal.x =
                svgElement.viewBox.baseVal.x +
                (0.4 * state.delta[0] * svgElement.viewBox.baseVal.width) /
                  originalWidth;

              svgElement.viewBox.baseVal.y =
                svgElement.viewBox.baseVal.y +
                (0.4 * state.delta[1] * svgElement.viewBox.baseVal.height) /
                  originalHeight;
            }
          },
        },
        {
          pinch: {
            scaleBounds: {
              min: 0.1,
              max: 10,
            },
          },
        }
      );
    }

    return () => {
      gesture?.destroy();
      resizeListener?.();
    };
  }, [svgElement, bodyRef.current, eventTargetRef.current]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        height: "100%",
        position: "relative",
      }}
    >
      <div
        style={{ flex: "1 1 auto", overflow: "hidden" }}
        ref={eventTargetRef}
      >
        {/* <Container space=""> */}
        {/* <VerticalSpace space="small" /> */}
        <div ref={bodyRef} />
        {/* <VerticalSpace space="small" /> */}
        {/* </Container> */}
      </div>
      <div>
        <Container
          space="small"
          style={{
            width: "100%",
            borderTop: "1px solid var(--figma-color-border)",
          }}
        >
          <VerticalSpace space="small" />
          <Inline space="small" style={{ textAlign: "right" }}>
            <Button secondary onClick={handleBackClick}>
              Back
            </Button>
            <Button onClick={handleExportClick}>Export</Button>
          </Inline>
          <VerticalSpace space="small" />
        </Container>
      </div>
    </div>
  );
}
