import { RealDimensionString, RealUnit, Unit } from './types';

export interface Dimension {
  scalar: number
  unit: Unit | undefined
}

export interface RealDimension extends Dimension {
  unit: RealUnit
}

export interface Scalar {
  scalar: number
  unit: undefined
}

export interface Fraction {
  numerator: Dimension
  denominator: Dimension
}

export function scalar(scalar: number): Scalar {
  return { scalar, unit: undefined };
}

export function assertRealUnit(unit: string | undefined): asserts unit is RealUnit
export function assertRealUnit(unit: string | undefined, node: BaseNode | null | undefined, property: string): asserts unit is RealUnit
export function assertRealUnit(unit: string | undefined, node?: BaseNode | null, property?: string): asserts unit is RealUnit {
  if (unit !== 'in' && unit !== 'mm') {
    node?.setPluginData(property!, '')
    throw new Error(`Unknown unit '${unit}'`)
  }
}

export function assertRealDimension(dimension: string, ensurePositive: boolean): asserts dimension is RealDimensionString;
export function assertRealDimension(dimension: string, ensurePositive: boolean, node: BaseNode | null | undefined, property: string): asserts dimension is RealDimensionString;
export function assertRealDimension(dimension: string, ensurePositive: boolean, node?: BaseNode | null, property?: string): asserts dimension is RealDimensionString {
  const parts = dimension.split(' ');
  if (parts.length !== 2) {
    node?.setPluginData(property!, '');
    throw new Error(`Invalid dimension '${dimension}'`);
  }
  const [value, unit] = parts;
  if (isNaN(Number(value))) {
    node?.setPluginData(property!, '');
    throw new Error(`Invalid dimension value '${value}'`);
  }
  if (ensurePositive && Number(value) < 0) {
    node?.setPluginData(property!, '');
    throw new Error(`Dimension value '${value}' must be positive`);
  }
  assertRealUnit(unit, node!, property!);
}

export function isDimension(value: string): value is RealDimensionString {
  try {
    assertRealDimension(value, false);
    return true;
  } catch {
    return false;
  }
}

export function parseRealDimensionString(str: RealDimensionString): RealDimension {
  const [scalar, unit] = str.split(' ');
  assertRealUnit(unit);
  return { scalar: Number(scalar), unit };
}

export function toRealDimensionString(dimension: RealDimension, precision?: number): RealDimensionString {
  precision ??= Math.max(1, Math.min(100, Math.floor(Math.log10(dimension.scalar)) + 3));
  precision = isNaN(precision) ? 3 : precision;
  assertRealUnit(dimension.unit);
  return `${dimension.scalar.toPrecision(precision) as `${number}`} ${dimension.unit}`;
}

export function coerceDimension(dimension: string, ensurePositive: boolean, defaultUnits: RealUnit): RealDimensionString | undefined {
  dimension = dimension.trim();
  if (dimension === '') {
    return undefined;
  }

  let unit = /[a-z]+$/i.exec(dimension)?.[0]?.toLowerCase();
  const scalar = Number(dimension.substring(0, dimension.length - (unit?.length ?? 0)));
  if (isNaN(scalar)) {
    return undefined;
  }
  const outUnit: RealUnit = unit === 'in' || unit === 'mm' ? unit : defaultUnits;
  return `${ensurePositive && scalar < 0 ? Math.abs(scalar) : scalar} ${outUnit}`;
}

export function convertDimension(dimension: Dimension, toUnit: Unit): Dimension {
  if (dimension.unit === toUnit) {
    return dimension;
  }
  if (dimension.unit === 'in') {
    return { scalar: dimension.scalar * 25.4, unit: toUnit };
  }
  if (dimension.unit === 'mm') {
    return { scalar: dimension.scalar / 25.4, unit: toUnit };
  }
  return dimension;
}

export function mul(a: Scalar, b: Scalar): Scalar;
export function mul(a: RealDimension, b: Scalar): RealDimension;
export function mul(a: Dimension, b: Scalar): Dimension;
export function mul(a: Dimension, b: Dimension): Dimension {
  if (a.unit && b.unit) {
    throw new Error('Cannot multiply two dimensions with units');
  }
  return { scalar: a.scalar * b.scalar, unit: a.unit ?? b.unit };
}

export function simplify(frac: Fraction): Dimension | Fraction {
  if (frac.numerator.unit === frac.denominator.unit) {
    return { scalar: frac.numerator.scalar / frac.denominator.scalar, unit: undefined };
  }
  if (frac.numerator.unit && frac.denominator.unit) {
    const withNumeratorUnits = convertDimension(frac.denominator, frac.numerator.unit);
    return simplify({ numerator: frac.numerator, denominator: withNumeratorUnits });
  }
  if (frac.numerator.unit) {
    return { scalar: frac.numerator.scalar / frac.denominator.scalar, unit: frac.numerator.unit };
  }
  return frac;
}

export function div(a: Scalar, b: Scalar): Scalar;
export function div(a: RealDimension, b: Scalar): RealDimension;
export function div(a: Dimension, b: Scalar): Dimension;
export function div(a: Dimension, b: Dimension): Dimension | Fraction {
  return simplify({ numerator: a, denominator: b });
}