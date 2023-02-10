import { assertRealDimension, assertRealUnit } from "./dimensions";
import {
  CutType,
  FrameData,
  PathData,
  PathNode,
  PathSelection,
  SerializedNode,
  SerializedPath,
} from "./types";

export function not<T>(
  predicate: (value: T) => boolean
): (value: T) => boolean {
  return (value) => !predicate(value);
}

export function assertCutType(
  cutType: string,
  node?: BaseNode
): asserts cutType is CutType {
  if (
    cutType !== "inside" &&
    cutType !== "outside" &&
    cutType !== "online" &&
    cutType !== "pocket" &&
    cutType !== "guide"
  ) {
    node?.setPluginData("cutType", "");
    throw new Error("Invalid cut type");
  }
}

export function shapeIsClosed(shape: PathNode): boolean {
  switch (shape.type) {
    case "BOOLEAN_OPERATION":
      return true;
    case "VECTOR":
      return shape.fillGeometry.length > 0;
    case "STAR":
      return true;
    case "LINE":
      return false;
    case "ELLIPSE":
      return true;
    case "POLYGON":
      return true;
    case "RECTANGLE":
      return true;
    case "TEXT":
      return true;
    default:
      assertNever(shape);
  }
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

export function hasPathNodeParent(node: BaseNode) {
  let parent = node.parent;
  while (parent !== null) {
    if (isPathNode(parent)) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

export function serializePath(node: PathNode): SerializedPath {
  const frame = getContainingFrame(node);
  const defaultUnits = frame?.getPluginData("defaultUnits") || "in";
  assertRealUnit(defaultUnits, frame, "defaultUnits");
  const serializePath = {
    ...serializeNode(node),
    ...getPathData(node),
    isClosed: shapeIsClosed(node),
    defaultUnits,
  };

  if (node.id.startsWith("I")) {
    const [instanceId, pathId] = node.id.substring(1).split(";");
    const component = (figma.getNodeById(instanceId) as InstanceNode)
      .mainComponent;
    const componentPath = component?.findOne((n) => n.id === pathId);
    return {
      ...serializePath,
      componentData:
        component && componentPath
          ? {
              ...getPathData(componentPath),
              componentId: component.id,
            }
          : undefined,
    };
  }
  return serializePath;
}

export function serializeNode(node: BaseNode): SerializedNode {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
  };
}

export function getContainingFrame(node: BaseNode): FrameNode | null {
  let parent = node.parent;
  while (parent !== null) {
    if (parent.type === "FRAME") {
      return parent;
    }
    parent = parent.parent;
  }
  return null;
}

export function getPathData(node: BaseNode): PathData {
  const cutDepth = node.getPluginData("cutDepth");
  const cutType = node.getPluginData("cutType");
  if (cutType !== "") {
    assertCutType(cutType, node);
  }
  if (cutDepth !== "") {
    assertRealDimension(cutDepth, /*ensurePositive*/ false, node, "cutDepth");
  }
  return {
    cutDepth: !cutDepth ? undefined : cutDepth,
    cutType: !cutType ? undefined : cutType,
  };
}

export function getFrameData(node: FrameNode): FrameData {
  const width = node.getPluginData("width");
  const defaultUnits = node.getPluginData("defaultUnits");
  if (width !== "") {
    assertRealDimension(width, /*ensurePositive*/ true, node, "width");
  }
  if (defaultUnits !== "") {
    assertRealUnit(defaultUnits, node, "defaultUnits");
  }
  return {
    width: !width ? undefined : width,
    defaultUnits: !defaultUnits ? "in" : defaultUnits,
  };
}

export function isGroupLikeNode(
  node: BaseNode
): node is BaseNode & ChildrenMixin {
  return (
    node.type === "COMPONENT" ||
    node.type === "GROUP" ||
    node.type === "INSTANCE"
  );
}

export function isPathNode(node: BaseNode): node is PathNode {
  return (
    node.type === "BOOLEAN_OPERATION" ||
    node.type === "ELLIPSE" ||
    node.type === "LINE" ||
    node.type === "POLYGON" ||
    node.type === "RECTANGLE" ||
    node.type === "STAR" ||
    node.type === "TEXT" ||
    node.type === "VECTOR"
  );
}

export function getPathSelection(
  selection: readonly BaseNode[]
): PathSelection {
  const nodes: SerializedPath[] = [];
  const invalidNodes: SerializedNode[] = [];
  for (const node of selection) {
    if (hasPathNodeParent(node)) {
      invalidNodes.push(serializeNode(node));
    } else if (isPathNode(node)) {
      nodes.push(serializePath(node));
    } else if (isGroupLikeNode(node)) {
      const validChildren = node.findAll(isPathNode) as PathNode[];
      const invalidChildren = node.findAll(not(isPathNode));
      nodes.push(...validChildren.map(serializePath));
      invalidNodes.push(...invalidChildren.map(serializeNode));
    } else {
      invalidNodes.push({
        id: node.id,
        name: node.name,
        type: node.type,
      });
    }
  }
  return {
    kind: "PATHS",
    nodes,
    invalidNodes,
  };
}

export function formatVectorPath(data: string) {
  return data
    .replace(/([a-z])([0-9])/gi, "$1 $2")
    .replace(/([0-9])([a-z])/gi, "$1 $2");
}

export const windowConstraints = {
  minWidth: 320,
  minHeight: 240,
};
