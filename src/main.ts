import { emit, on, once, showUI } from '@create-figma-plugin/utilities'

import { CloseHandler, PathNode, PathData, PathSelection, SelectionChangeHandler, SerializedNode, SetDataHandler, SerializedPath } from './types'
import { assertCutType, not, shapeIsClosed } from './utils'

export default function () {
  figma.on('selectionchange', sendSelectionChange)
  figma.on('documentchange', changes => {
    if (changes.documentChanges.some(change =>
      change.type === 'PROPERTY_CHANGE' && figma.currentPage.selection.some(node => node.id === change.id)
    )) {
      sendSelectionChange()
    }
  })

  once<CloseHandler>('CLOSE', () => {
    figma.closePlugin()
  })

  on<SetDataHandler>('SET_DATA', data => {
    for (const nodeId of data.nodeIds) {
      const node = figma.getNodeById(nodeId)
      if (node === null) {
        throw new Error('Node not found')
      }
      if (data.cutDepth !== undefined) {
        node.setPluginData('cutDepth', data.cutDepth.toString())
      }
      if (data.cutType !== undefined) {
        if (data.cutType !== "") {
          assertCutType(data.cutType)
        }
        node.setPluginData('cutType', data.cutType)
      }
    }
  })

  showUI({
    height: 420,
    width: 320
  })

  sendSelectionChange()
}

function sendSelectionChange() {
  const selection = figma.currentPage.selection
  if (selection.length === 0) {
    emit<SelectionChangeHandler>('SELECTION_CHANGE', {
      kind: 'PATHS',
      nodes: [],
      invalidNodes: []
    })
  }
  else if (selection.length === 1 && selection[0].type === 'FRAME') {
    emit<SelectionChangeHandler>('SELECTION_CHANGE', {
      kind: 'FRAME',
      frame: {
        id: selection[0].id,
        name: selection[0].name
      },
      paths: getPathSelection(selection[0].children)
    })
  }
  else {
    const paths = getPathSelection(selection)
    emit<SelectionChangeHandler>('SELECTION_CHANGE', paths)
  }
}

function getPathData(node: BaseNode): PathData {
  const cutDepth = node.getPluginData('cutDepth')
  const cutType = node.getPluginData('cutType')
  if (cutType !== '') {
    assertCutType(cutType)
  }
  return {
    cutDepth: !cutDepth ? undefined : cutDepth,
    cutType: !cutType ? undefined : cutType
  }
}

function isGroupLikeNode(node: BaseNode): node is BaseNode & ChildrenMixin {
  return node.type === 'COMPONENT'
    || node.type === 'GROUP'
    || node.type === 'INSTANCE'
}

function isPathNode(node: BaseNode): node is PathNode {
  return node.type === 'BOOLEAN_OPERATION'
    || node.type === 'ELLIPSE'
    || node.type === 'LINE'
    || node.type === 'POLYGON'
    || node.type === 'RECTANGLE'
    || node.type === 'STAR'
    || node.type === 'TEXT'
    || node.type === 'VECTOR'
}

function getPathSelection(selection: readonly BaseNode[]): PathSelection {
  const nodes: SerializedPath[] = []
  const invalidNodes: SerializedNode[] = []
  for (const node of selection) {
    if (hasLeafNodeParent(node)) {
      invalidNodes.push(serializeNode(node))
    }
    else if (isPathNode(node)) {
      nodes.push(serializePath(node))
    }
    else if (isGroupLikeNode(node)) {
      const validChildren = node.findAll(isPathNode) as PathNode[]
      const invalidChildren = node.findAll(not(isPathNode))
      nodes.push(...validChildren.map(serializePath))
      invalidNodes.push(...invalidChildren.map(serializeNode))
    }
    else {
      invalidNodes.push({
        id: node.id,
        name: node.name,
        type: node.type
      })
    }
  }
  return {
    kind: 'PATHS',
    nodes,
    invalidNodes
  }
}

function hasLeafNodeParent(node: BaseNode) {
  let parent = node.parent
  while (parent !== null) {
    if (isPathNode(parent)) {
      return true
    }
    parent = parent.parent
  }
  return false
}

function serializePath(node: PathNode): SerializedPath {
  return {
    ...serializeNode(node),
    ...getPathData(node),
    isClosed: shapeIsClosed(node),
  }
}

function serializeNode(node: BaseNode): SerializedNode {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
  }
}
