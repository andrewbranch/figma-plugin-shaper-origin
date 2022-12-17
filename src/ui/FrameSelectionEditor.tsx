import {
  Bold,
  Button,
  Columns,
  Divider,
  Dropdown,
  DropdownOption,
  IconLayerFrame16,
  Inline,
  Text,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { Fragment, h, JSX } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Table } from "./Table";
import {
  FrameSelection,
  ExportDoneHandler,
  ExportHandler,
  RealUnit,
  SetFrameDataHandler,
  RealDimensionString,
} from "../types";
import { getCutSVG } from "./preview/main";
import { DimensionTextbox } from "./DimensionTextbox";
import {
  assertRealUnit,
  div,
  mul,
  parseRealDimensionString,
  scalar,
  toRealDimensionString,
} from "../dimensions";
import { CutControls } from "./CutControlsProps";

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
    on<ExportDoneHandler>("EXPORT_DONE", ({ pathData, svg }) => {
      setIsExporting(false);
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(
        new TextDecoder().decode(svg),
        "image/svg+xml"
      );
      for (const nodeId in pathData) {
        const data = pathData[nodeId];
        const path = svgDoc.getElementById(nodeId);
        if (data.cutDepth) {
          path!.setAttribute("shaper:cutDepth", data.cutDepth);
        }
        if (data.cutType) {
          path!.setAttribute("shaper:cutType", data.cutType);
        }
      }
      const elem = renderRef.current!.appendChild(
        svgDoc.documentElement
      ) as any as SVGSVGElement;
      console.log(getCutSVG(elem));
    });
  }, []);

  return (
    <Fragment>
      <div ref={renderRef} />
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
      <VerticalSpace space="medium" />
      <Button onClick={onExportClick} loading={isExporting}>
        Export
      </Button>
    </Fragment>
  );
}
