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
import { useCallback, useEffect, useState } from "preact/hooks";
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
import { CutControls } from "./CutControls";
import { DimensionTextbox } from "./DimensionTextbox";
import { Table } from "./Table";
import { prepareEncodedSvg } from "./prepareEncodedSvg";

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
  const ratio = selection.frame.pixelWidth / selection.frame.pixelHeight;
  const [width, setWidth] = useState<RealDimensionString | "" | undefined>(
    selection.frame.width
  );

  const computedHeight = width
    ? toRealDimensionString(div(parseRealDimensionString(width), scalar(ratio)))
    : undefined;

  const onPreviewClick = useCallback(() => {
    emit<ExportHandler>("EXPORT", {
      frameId: selection.frame.id,
      preview: true,
    });
  }, [selection.frame.id]);

  const onExportClick = useCallback(() => {
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
    const dispose = on<ExportDoneHandler>("EXPORT_DONE", (data) => {
      const svgElement = prepareEncodedSvg(data);
      saveAs(
        new Blob([new XMLSerializer().serializeToString(svgElement)], {
          type: "image/svg+xml",
        }),
        `${selection.frame.name}.svg`
      );
    });

    return () => dispose();
  }, []);

  return (
    <Fragment>
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
          style={{ flex: "0 1 100%", width: "100%", overflow: "auto" }}
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
            <Button secondary onClick={onPreviewClick}>
              Preview cut
            </Button>
            <Button onClick={onExportClick}>Export SVG</Button>
          </Inline>
          <VerticalSpace space="small" />
        </Container>
      </div>
    </Fragment>
  );
}
