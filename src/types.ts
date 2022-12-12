import { EventHandler } from '@create-figma-plugin/utilities'

export interface CloseHandler extends EventHandler {
  name: 'CLOSE'
  handler: () => void
}

export interface SetDataHandler extends EventHandler {
  name: 'SET_DATA'
  handler: (data: PathData & { nodeIds: readonly string[] }) => void
}

export interface PathSelection {
  kind: 'PATHS'
  nodes: readonly SerializedPath[]
  invalidNodes: readonly SerializedPath[]
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
  | 'on-line'
  | 'pocket'
  | 'guide'

export interface FrameData {}

export interface SerializedFrame extends FrameData {
  id: string
  name: string
}

export interface PathData {
  cutDepth?: string
  cutType?: CutType | ''
}

export interface SerializedPath extends PathData {
  id: string
  name: string
  type: NodeType
}

export interface SelectionChangeHandler extends EventHandler {
  name: 'SELECTION_CHANGE'
  handler: (data: Selection) => void
}