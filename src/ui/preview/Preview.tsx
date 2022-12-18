import {
  Button,
  Container,
  Inline,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
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
    return outlinedDoc.documentElement;
  }, [props.preview]);

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

  useEffect(() => {
    if (bodyRef.current && svgElement) {
      // I forgot how to CSS
      svgElement.setAttribute(
        "style",
        "width: 100%; height: calc(100% - 2 * var(--space-small));"
      );
      bodyRef.current.innerHTML = "";
      bodyRef.current.appendChild(svgElement);
    }
  }, [svgElement, bodyRef.current]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div style={{ flex: "0 1 auto", overflow: "auto" }}>
        <Container space="small">
          <VerticalSpace space="small" />
          <div ref={bodyRef} />
          <VerticalSpace space="small" />
        </Container>
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
