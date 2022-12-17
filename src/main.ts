import { emit, on, once, showUI } from '@create-figma-plugin/utilities'
import { CloseHandler, PathNode, SelectionChangeHandler, SetPathDataHandler, ExportDoneHandler, ExportHandler, PathData, SetFrameDataHandler } from './types'
import { assertCutType, formatVectorPath, getFrameData, getPathSelection, hasPathNodeParent, isPathNode } from './utils'

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

  on<SetPathDataHandler>('SET_PATH_DATA', data => {
    for (const nodeId of data.nodeIds) {
      const node = figma.getNodeById(nodeId)
      if (node === null) {
        throw new Error('Node not found')
      }
      if (data.cutDepth !== undefined) {
        node.setPluginData('cutDepth', data.cutDepth.toString())
      }
      if (data.cutType !== undefined) {
        node.setPluginData('cutType', data.cutType)
      }
    }
  })

  on<SetFrameDataHandler>('SET_FRAME_DATA', data => {
    const frame = figma.getNodeById(data.id)
    if (frame === null) {
      throw new Error('Frame not found')
    }
    if (frame.type !== 'FRAME') {
      throw new Error('Node is not a frame')
    }
    if (data.defaultUnits !== undefined) {
      frame.setPluginData('defaultUnits', data.defaultUnits)
    }
    if (data.width !== undefined) {
      frame.setPluginData('width', data.width)
    }
  })

  on<ExportHandler>('EXPORT', async data => {
    const frame = figma.getNodeById(data.frameId)
    if (frame === null) {
      throw new Error('Frame not found')
    }
    if (frame.type !== 'FRAME') {
      throw new Error('Node is not a frame')
    }
    emit<ExportDoneHandler>('EXPORT_DONE', await exportFrame(frame))
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
        name: selection[0].name,
        pixelWidth: selection[0].width,
        pixelHeight: selection[0].height,
        ...getFrameData(selection[0])
      },
      paths: getPathSelection(selection[0].children)
    })
  }
  else {
    const paths = getPathSelection(selection)
    emit<SelectionChangeHandler>('SELECTION_CHANGE', paths)
  }
}

function stageExport(frame: FrameNode) {
  const stagingFrame = clearOrCreateStagingFrame(frame)
  const paths = getTopLevelPathNodes(stagingFrame)
  const outPaths: SceneNode[] = []
  stagingFrame.fills = []
  stagingFrame.strokes = []

  paths.forEach(node => {
    const cutType = node.getPluginData('cutType')

    // Replace boolean operations with the vectors of their fills
    if (node.type === 'BOOLEAN_OPERATION') {
      const vector = figma.createVector()
      vector.vectorPaths = node.fillGeometry.map(g => ({ ...g, data: formatVectorPath(g.data) }))
      vector.x = node.x
      vector.y = node.y
      vector.rotation = node.rotation
      vector.resize(node.width, node.height)
      vector.name = node.name
      vector.setPluginData('cutType', cutType)
      vector.setPluginData('cutDepth', node.getPluginData('cutDepth'))
      node.parent!.appendChild(vector)
      node.remove()
      node = vector
    }

    // Set stroke/fill for cut type
    switch (cutType) {
      case 'inside':
        // black stroke white fill
        node.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
        node.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]
        break
      case 'outside':
        // black stroke black fill
        node.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
        node.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]
        break
      case 'online':
        // gray stroke
        node.strokes = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }]
        node.fills = []
        break
      case 'pocket':
        // gray fill
        node.strokes = []
        node.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }]
        break
      case 'guide':
        // #0068FF stroke
        node.strokes = [{ type: 'SOLID', color: { r: 0, g: 0.41, b: 1 } }]
        node.fills = []
        break
    }

    outPaths.push(node)
  })

  return { stagingFrame, paths: outPaths }
}

function getTopLevelPathNodes(frame: FrameNode) {
  return frame.findAll(n => isPathNode(n) && !hasPathNodeParent(n)) as PathNode[]
}

async function exportFrame(frame: FrameNode): Promise<{ svg: Uint8Array, pathData: Record<string, PathData> }> {
  const { stagingFrame, paths } = stageExport(frame)
  const svg = await stagingFrame.exportAsync({ format: 'SVG', svgIdAttribute: true })
  return {
    svg,
    pathData: paths.reduce((acc, node) => ({
      ...acc,
      [getNodeId(node, acc)]: {
        cutType: node.getPluginData('cutType'),
        cutDepth: node.getPluginData('cutDepth')
      }
    }), {})
  }

  function getNodeId(node: BaseNode, nodes: Record<string, unknown>) {
    return getName(node.name, nodes)
    function getName(name: string, nodes: Record<string, unknown>, counter = 2): string {
      return nodes[name] ? getName(`${name}_${counter}`, nodes, counter + 1) : name
    }
  }
}

function getOrCreateStagingPage() {
  let page = figma.root.children.find(page => page.getPluginData('stagingPage'))
  if (!page) {
    page = figma.createPage()
    page.name = "Shaper Origin Export Staging"
    page.setPluginData('stagingPage', 'true')
  }
  return page
}

function clearOrCreateStagingFrame(sourceFrame: FrameNode) {
  const page = getOrCreateStagingPage()
  page.children.find(node => node.type === 'FRAME' && node.name === sourceFrame.name)
    ?.remove()

  const frame = sourceFrame.clone()
  page.appendChild(frame)
  return frame
}