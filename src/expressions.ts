import {
  RealDimension,
  Scalar,
  add,
  convertDimension,
  div,
  mul,
  neg,
} from "./dimensions";
import { RealUnit } from "./types";

// This file largely written by GitHub Copilot.
// It's not great but it was quick and does the job.

const enum TokenType {
  OpenParen,
  CloseParen,
  Number,
  Plus,
  Minus,
  Star,
  Slash,
  Unit,
}

interface Token {
  type: TokenType;
  value: string;
}

const digit = /[0-9]/;

type Expression = Quantity | BinaryOperation | UnitExpression;

const enum NodeKind {
  Quantity,
  BinaryOperation,
  UnitExpression,
}

interface Quantity {
  kind: NodeKind.Quantity;
  value: number;
  unit?: RealUnit;
}

interface BinaryOperation {
  kind: NodeKind.BinaryOperation;
  operator: TokenType.Plus | TokenType.Minus | TokenType.Star | TokenType.Slash;
  left: Expression;
  right: Expression;
  unit?: RealUnit;
}

interface UnitExpression {
  kind: NodeKind.UnitExpression;
  unit: RealUnit;
  expression: Expression;
}

export function parseMathExpression(input: string) {
  const tokens = tokenize(input);
  let i = 0;
  return parseExpression();

  function token() {
    return tokens[i];
  }

  function parseExpression(): Expression {
    const left = parseTerm();
    const operator = token()?.type;
    if (operator === TokenType.Plus || operator === TokenType.Minus) {
      i++;
      const right = parseExpression();
      return {
        kind: NodeKind.BinaryOperation,
        operator,
        left,
        right,
      };
    }
    return left;
  }

  function parseTerm(): Expression {
    const left = parseFactor();
    const operator = token()?.type;
    if (operator === TokenType.Star || operator === TokenType.Slash) {
      i++;
      const right = parseTerm();
      return {
        kind: NodeKind.BinaryOperation,
        operator,
        left,
        right,
      };
    }
    return left;
  }

  function parseFactor(): Expression {
    if (token()?.type === TokenType.Number) {
      const value = parseFloat(token().value);
      i++;
      if (token()?.type === TokenType.Number) {
        // Possibly compound fraction
        return {
          kind: NodeKind.BinaryOperation,
          operator: TokenType.Plus,
          left: {
            kind: NodeKind.Quantity,
            value,
          },
          right: parseFraction(),
          unit: parseOptionalUnit(),
        };
      }
      return {
        kind: NodeKind.Quantity,
        value,
        unit: parseOptionalUnit(),
      };
    }
    if (token().type === TokenType.OpenParen) {
      i++;
      const expression = parseExpression();
      if (token()?.type !== TokenType.CloseParen) {
        throw new Error("Expected closing paren");
      }
      i++;
      const unit = parseOptionalUnit();
      if (unit && expression.unit && unit !== expression.unit) {
        return {
          kind: NodeKind.UnitExpression,
          unit,
          expression,
        };
      }
    }
    throw new Error(`Unexpected token: ${token().type}`);
  }

  function parseFraction(): BinaryOperation {
    if (token()?.type !== TokenType.Number) {
      throw new Error("Expected number");
    }
    const numerator = parseFloat(token().value);
    i++;
    if (token()?.type !== TokenType.Slash) {
      throw new Error("Expected slash");
    }
    i++;
    if (token()?.type !== TokenType.Number) {
      throw new Error("Expected number");
    }
    const denominator = parseFloat(token().value);
    i++;
    return {
      kind: NodeKind.BinaryOperation,
      operator: TokenType.Slash,
      left: {
        kind: NodeKind.Quantity,
        value: numerator,
      },
      right: {
        kind: NodeKind.Quantity,
        value: denominator,
      },
    };
  }

  function parseOptionalUnit() {
    if (token()?.type === TokenType.Unit) {
      const unit = token().value as RealUnit;
      i++;
      return unit;
    }
  }
}

function tokenize(input: string): Token[] {
  const tokens = [];
  let i = 0;
  let seenDecimal = false;
  while (i < input.length) {
    const char = input[i];
    if (char === " ") {
      i++;
      continue;
    }
    if (char === "(") {
      tokens.push({ type: TokenType.OpenParen, value: "(" });
      i++;
      continue;
    }
    if (char === ")") {
      tokens.push({ type: TokenType.CloseParen, value: ")" });
      i++;
      continue;
    }
    if (digit.test(char) || (char === "." && !seenDecimal)) {
      let value = "";
      while (digit.test(input[i]) || (input[i] === "." && !seenDecimal)) {
        value += input[i];
        i++;
      }
      tokens.push({ type: TokenType.Number, value });
      continue;
    }
    if (char === "+") {
      tokens.push({ type: TokenType.Plus, value: "+" });
      i++;
      continue;
    }
    if (char === "-") {
      tokens.push({ type: TokenType.Minus, value: "-" });
      i++;
      continue;
    }
    if (char === "*") {
      tokens.push({ type: TokenType.Star, value: "*" });
      i++;
      continue;
    }
    if (char === "/") {
      tokens.push({ type: TokenType.Slash, value: "/" });
      i++;
      continue;
    }
    if (char === "i" && input[i + 1] === "n") {
      tokens.push({ type: TokenType.Unit, value: "in" });
      i += 2;
      continue;
    }
    if (char === "m" && input[i + 1] === "m") {
      tokens.push({ type: TokenType.Unit, value: "mm" });
      i += 2;
      continue;
    }
  }
  return tokens;
}

export function evaluateExpression(
  expression: Expression
): RealDimension | Scalar {
  if (expression.kind === NodeKind.Quantity) {
    return { scalar: expression.value, unit: expression.unit };
  }
  if (expression.kind === NodeKind.UnitExpression) {
    const res = evaluateExpression(expression.expression);
    return res.unit
      ? convertDimension(res, expression.unit)
      : { scalar: res.scalar, unit: expression.unit };
  }

  const left = evaluateExpression(expression.left);
  const right = evaluateExpression(expression.right);
  let res;
  switch (expression.operator) {
    case TokenType.Plus:
      // loose dimensional matching - a scalar and a dimension is unambiguous
      res = add(
        { scalar: left.scalar, unit: left.unit ?? right.unit },
        { scalar: right.scalar, unit: right.unit ?? left.unit }
      );
      break;
    case TokenType.Minus:
      const r = neg(right);
      res = res = add(
        { scalar: left.scalar, unit: left.unit ?? r.unit },
        { scalar: r.scalar, unit: r.unit ?? left.unit }
      );
      break;
    case TokenType.Star:
      // it's really unclear what the intent was if you have units on both sides
      // I'll let it error, as it should
      res = mul(left, right);
      break;
    case TokenType.Slash:
      // Oddly enough, you can divide inches by mm and get a scalar out,
      // which will then adopt the default units, so this is weird
      res = div(left, right);
      break;
  }
  if (expression.unit) {
    if (res.unit) {
      return convertDimension(res, expression.unit);
    }
    return { scalar: res.scalar, unit: expression.unit };
  }
  return res;
}

export function tryEvaluate(input: string) {
  try {
    return evaluateExpression(parseMathExpression(input));
  } catch (e) {
    return undefined;
  }
}
