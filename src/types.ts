import { EventHandler } from "@create-figma-plugin/utilities";

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}

export interface SetPathDataHandler extends EventHandler {
  name: "SET_PATH_DATA";
  handler: (data: SettablePathData & { nodeIds: readonly string[] }) => void;
}

export interface SetFrameDataHandler extends EventHandler {
  name: "SET_FRAME_DATA";
  handler: (data: SettableFrameData & { id: string }) => void;
}

export interface ExportHandler extends EventHandler {
  name: "EXPORT";
  handler: (data: { preview?: boolean; frameId: string }) => void;
}

export interface ExportDoneHandler extends EventHandler {
  name: "EXPORT_DONE";
  handler: (data: ExportReadySVG & { preview?: boolean }) => void;
}

export interface ExportReadySVG {
  svg: Uint8Array;
  pathData: Record<string, PathData>;
  width: string;
  height: string;
  fileName: string;
}

export interface PathSelection {
  kind: "PATHS";
  nodes: readonly SerializedPath[];
  invalidNodes: readonly SerializedNode[];
}

export interface FrameSelection {
  kind: "FRAME";
  frame: SerializedFrame;
  paths: PathSelection;
}

export type Selection = PathSelection | FrameSelection;

export type CutType = "inside" | "outside" | "online" | "pocket" | "guide";

export type PathNode =
  | BooleanOperationNode
  | EllipseNode
  | LineNode
  | PolygonNode
  | RectangleNode
  | StarNode
  | TextNode
  | VectorNode;

export type RealUnit = "in" | "mm";
export type Unit = RealUnit | "px";
export type RealDimensionString = `${number} ${RealUnit}`;

export interface FrameData {
  defaultUnits: RealUnit;
  width?: RealDimensionString;
}

export type SettableFrameData = {
  [K in keyof FrameData]?: undefined extends FrameData[K]
    ? FrameData[K] | ""
    : FrameData[K];
};

export interface SerializedFrame extends FrameData {
  id: string;
  name: string;
  pixelWidth: number;
  pixelHeight: number;
}

export interface PathData {
  cutDepth?: RealDimensionString;
  cutType?: CutType;
  bitDiameter?: RealDimensionString;
}

export type SettablePathData = {
  [K in keyof PathData]?: PathData[K] | "";
};

export interface SerializedNode {
  id: string;
  name: string;
  type: NodeType;
}

export interface ComponentData extends PathData {
  componentId: string;
}

export interface SerializedPath extends SerializedNode, PathData {
  id: string;
  isClosed: boolean;
  defaultUnits: RealUnit;
  componentData?: ComponentData;
}

export interface SelectionChangeHandler extends EventHandler {
  name: "SELECTION_CHANGE";
  handler: (data: Selection) => void;
}
