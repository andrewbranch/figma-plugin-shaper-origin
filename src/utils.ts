import { CutType } from './types'

export function not<T>(predicate: (value: T) => boolean): (value: T) => boolean {
  return value => !predicate(value)
}

export function assertCutType(cutType: string): asserts cutType is CutType {
  if (
    cutType !== 'inside' &&
    cutType !== 'outside' &&
    cutType !== 'on-line' &&
    cutType !== 'pocket' &&
    cutType !== 'guide'
  ) {
    throw new Error('Invalid cut type')
  }
}
