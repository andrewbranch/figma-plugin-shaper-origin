import {
  Bold,
  Divider,
  Muted,
  Text,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { Fragment, h } from "preact";
import { Table } from "./Table";
import { PathSelection } from "../types";
import { CutControls } from "./CutControlsProps";

interface PathSelectionEditorProps {
  selection: PathSelection;
}
export function PathSelectionEditor(props: PathSelectionEditorProps) {
  const { selection } = props;
  const cutDepth = selection.nodes.every(
    (node) => node.cutDepth === selection.nodes[0].cutDepth
  )
    ? selection.nodes[0]?.cutDepth
    : "Mixed";
  const cutType = selection.nodes.every(
    (node) => node.cutType === selection.nodes[0].cutType
  )
    ? selection.nodes[0]?.cutType
    : "Mixed";
  const shapeIsClosed = selection.nodes.every((node) => node.isClosed);
  const defaultUnits = selection.nodes[0]?.defaultUnits ?? "in";
  return (
    <Fragment>
      {selection.nodes.length ? (
        <Fragment>
          {selection.nodes.length === 1 ? (
            <Text>
              <Bold>{selection.nodes[0].name}</Bold>
            </Text>
          ) : (
            <Text>
              <Bold>{selection.nodes.length} paths</Bold>
            </Text>
          )}
          <VerticalSpace space="medium" />
          <Table>
            <CutControls
              shapeIsClosed={shapeIsClosed}
              nodeIds={selection.nodes.map((node) => node.id)}
              cutDepth={cutDepth}
              cutType={cutType}
              defaultUnits={defaultUnits}
            />
          </Table>
        </Fragment>
      ) : null}
      {selection.invalidNodes.length > 0 && (
        <Fragment>
          {selection.nodes.length ? (
            <Fragment>
              <VerticalSpace space="medium" />
              <Divider />
              <VerticalSpace space="medium" />
            </Fragment>
          ) : null}
          <Text>
            <Muted>
              Selection includes{" "}
              {selection.invalidNodes.length === 1
                ? "one object "
                : `${selection.invalidNodes.length} objects `}
              that cannot be exported with cut data and will be ignored.
            </Muted>
          </Text>
        </Fragment>
      )}
    </Fragment>
  );
}
