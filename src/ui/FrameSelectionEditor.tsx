import {
  Bold,
  Button,
  Columns,
  Container,
  Divider,
  Dropdown,
  DropdownOption,
  IconLayerFrame16,
  Inline,
  Text,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { saveAs } from "file-saver";
import { Fragment, JSX, h } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import {
  assertRealUnit,
  div,
  mul,
  parseRealDimensionString,
  scalar,
  toRealDimensionString,
} from "../dimensions";
import {
  ExportDoneHandler,
  ExportHandler,
  FrameSelection,
  RealDimensionString,
  RealUnit,
  SetFrameDataHandler,
} from "../types";
import { CutControls } from "./CutControlsProps";
import { DimensionTextbox } from "./DimensionTextbox";
import { Table } from "./Table";

const unitOptions: DropdownOption<RealUnit>[] = [
  { text: "Default units", value: "" as never, disabled: true },
  { separator: true },
  { text: "in", value: "in" },
  { text: "mm", value: "mm" },
];
interface FrameSelectionEditorProps {
  selection: FrameSelection;
}
export function FrameSelectionEditor(props: FrameSelectionEditorProps) {
  const { selection } = props;
  const [isExporting, setIsExporting] = useState(false);
  const ratio = selection.frame.pixelWidth / selection.frame.pixelHeight;
  const [width, setWidth] = useState<RealDimensionString | "" | undefined>(
    selection.frame.width
  );
  const computedHeight = width
    ? toRealDimensionString(div(parseRealDimensionString(width), scalar(ratio)))
    : undefined;

  const renderRef = useRef<HTMLDivElement>(null);
  const onExportClick = useCallback(() => {
    setIsExporting(true);
    emit<ExportHandler>("EXPORT", { frameId: selection.frame.id });
  }, [selection.frame.id]);

  const onChangeUnits = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      assertRealUnit(value);
      emit<SetFrameDataHandler>("SET_FRAME_DATA", {
        id: selection.frame.id,
        defaultUnits: value,
      });
    },
    [selection.frame.id]
  );

  const handleWidthChange = useCallback(
    (value: RealDimensionString | "") => {
      emit<SetFrameDataHandler>("SET_FRAME_DATA", {
        id: selection.frame.id,
        width: value,
      });
      setWidth(value);
    },
    [selection.frame.id]
  );

  const handleHeightChange = useCallback(
    (value: RealDimensionString | "") => {
      const computedWidth =
        value &&
        toRealDimensionString(
          mul(parseRealDimensionString(value), scalar(ratio))
        );
      emit<SetFrameDataHandler>("SET_FRAME_DATA", {
        id: selection.frame.id,
        width: computedWidth,
      });
    },
    [selection.frame.id, ratio]
  );

  useEffect(() => {
    on<ExportDoneHandler>(
      "EXPORT_DONE",
      ({ pathData, width, height, fileName, svg }) => {
        setIsExporting(false);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(
          new TextDecoder().decode(svg),
          "image/svg+xml"
        );
        svgDoc.documentElement.setAttribute("width", width.replace(" ", ""));
        svgDoc.documentElement.setAttribute("height", height.replace(" ", ""));
        svgDoc.documentElement.setAttribute(
          "xmlns:shaper",
          "http://www.shapertools.com/namespaces/shaper"
        );
        for (const nodeId in pathData) {
          const data = pathData[nodeId];
          const path = svgDoc.getElementById(nodeId);
          if (data.cutDepth) {
            path!.setAttribute(
              "shaper:cutDepth",
              data.cutDepth.replace(" ", "")
            );
          }
          if (data.cutType) {
            path!.setAttribute("shaper:cutType", data.cutType.replace(" ", ""));
          }
        }
        const elem = renderRef.current!.appendChild(
          svgDoc.documentElement
        ) as any as SVGSVGElement;
        const blob = new Blob([new XMLSerializer().serializeToString(elem)], {
          type: "image/svg+xml;charset=utf-8",
        });
        saveAs(blob, fileName);
      }
    );
  }, []);

  return (
    <Fragment>
      <div
        ref={renderRef}
        style={{
          visibility: "hidden",
          width: 0,
          height: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "flex-end",
          overflow: "hidden",
          height: "100%",
        }}
      >
        <Container
          space="small"
          style={{ flex: "0 1 auto", width: "100%", overflow: "auto" }}
        >
          <VerticalSpace space="small" />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Inline
              space="extraSmall"
              style={{ display: "flex", alignItems: "center" }}
            >
              <IconLayerFrame16 style={{ flex: "0 0 auto" }} />
              <Text>
                <Bold>{selection.frame.name}</Bold>
              </Text>
            </Inline>
            <Dropdown
              style={{ flex: "0 0 50px" }}
              options={unitOptions}
              value={selection.frame.defaultUnits}
              onChange={onChangeUnits}
            />
          </div>
          <VerticalSpace space="small" />
          <Divider />
          <VerticalSpace space="small" />
          <Columns space="small">
            <Text style={{ whiteSpace: "nowrap", lineHeight: "36px" }}>
              Real size
            </Text>
            <DimensionTextbox
              icon="W"
              ensurePositive
              defaultUnits={selection.frame.defaultUnits}
              initialValue={selection.frame.width}
              onValidInput={handleWidthChange}
            />
            <DimensionTextbox
              icon="H"
              ensurePositive
              defaultUnits={selection.frame.defaultUnits}
              initialValue={computedHeight}
              onValidInput={handleHeightChange}
            />
          </Columns>
          <VerticalSpace space="small" />
          <Divider />
          <VerticalSpace space="small" />
          <Table>
            {selection.paths.nodes.map((node) => (
              <CutControls
                key={node.id}
                shapeIsClosed={node.isClosed}
                nodeIds={[node.id]}
                label={node.name}
                cutDepth={node.cutDepth}
                cutType={node.cutType}
                defaultUnits={selection.frame.defaultUnits}
              />
            ))}
          </Table>
          <VerticalSpace space="small" />
        </Container>
        <Container
          space="small"
          style={{
            flex: "0 0 auto",
            width: "100%",
            borderTop: "1px solid var(--figma-color-border)",
          }}
        >
          <VerticalSpace space="small" />
          <Inline space="small" style={{ textAlign: "right" }}>
            <Button secondary>Preview cut</Button>
            <Button onClick={onExportClick} loading={isExporting}>
              Export SVG
            </Button>
          </Inline>
          <VerticalSpace space="small" />
        </Container>
      </div>
    </Fragment>
  );
}
