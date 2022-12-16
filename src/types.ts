import { EventHandler } from '@create-figma-plugin/utilities'

export interface CloseHandler extends EventHandler {
  name: 'CLOSE'
  handler: () => void
}

export interface SetDataHandler extends EventHandler {
  name: 'SET_DATA'
  handler: (data: SettablePathData & { nodeIds: readonly string[] }) => void
}

export interface PathSelection {
  kind: 'PATHS'
  nodes: readonly SerializedPath[]
  invalidNodes: readonly SerializedNode[]
}

export interface FrameSelection {
  kind: 'FRAME'
  frame: SerializedFrame
  paths: PathSelection
}

export type Selection = 
  | PathSelection
  | FrameSelection

export type CutType =
  | 'inside'
  | 'outside'
  | 'online'
  | 'pocket'
  | 'guide'

export type PathNode =
  | BooleanOperationNode
  | EllipseNode
  | LineNode
  | PolygonNode
  | RectangleNode
  | StarNode
  | TextNode
  | VectorNode

export interface FrameData {}

export interface SerializedFrame extends FrameData {
  id: string
  name: string
}

export interface PathData {
  cutDepth?: string
  cutType?: CutType
}

export type SettablePathData = { 
  [K in keyof PathData]: PathData[K] | ''
}

export interface SerializedNode {
  id: string
  name: string
  type: NodeType
}

export interface SerializedPath extends SerializedNode, PathData {
  id: string
  isClosed: boolean
}

export interface SelectionChangeHandler extends EventHandler {
  name: 'SELECTION_CHANGE'
  handler: (data: Selection) => void
}