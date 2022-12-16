import { CutType, PathNode } from './types'

export function not<T>(predicate: (value: T) => boolean): (value: T) => boolean {
  return value => !predicate(value)
}

export function assertCutType(cutType: string): asserts cutType is CutType {
  if (
    cutType !== 'inside' &&
    cutType !== 'outside' &&
    cutType !== 'online' &&
    cutType !== 'pocket' &&
    cutType !== 'guide'
  ) {
    throw new Error('Invalid cut type')
  }
}

export function shapeIsClosed(shape: PathNode): boolean {
  switch (shape.type) {
    case 'BOOLEAN_OPERATION': return true
    case 'VECTOR': return shape.fillGeometry.length > 0
    case 'STAR': return true
    case 'LINE': return false
    case 'ELLIPSE': return true
    case 'POLYGON': return true
    case 'RECTANGLE': return true
    case 'TEXT': return true
    default: assertNever(shape)
  }
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`)
}
