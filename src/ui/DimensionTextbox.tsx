import { Textbox, TextboxProps } from "@create-figma-plugin/ui";
import { h } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { isRealDimensionString, toRealDimensionString } from "../dimensions";
import { tryEvaluate } from "../expressions";
import { RealDimensionString, RealUnit } from "../types";

interface DimensionTextboxProps extends Partial<TextboxProps<string>> {
  initialValue?: RealDimensionString | "Mixed";
  onValidInput: (value: RealDimensionString | "") => void;
  defaultUnits: RealUnit;
  ensurePositive?: boolean;
}

export function DimensionTextbox(props: DimensionTextboxProps) {
  const {
    initialValue,
    onValidInput,
    disabled,
    defaultUnits,
    ensurePositive,
    ...rest
  } = props;
  const [value, setValue] = useState(initialValue ?? "");
  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  const handleValueInput = useCallback(
    (value: string) => {
      setValue((prevValue) => {
        if (value !== prevValue && isRealDimensionString(value, ensurePositive)) {
          onValidInput(value as RealDimensionString);
        }
        return value;
      });
    },
    [onValidInput, ensurePositive]
  );
  const handleValidateOnBlur = useCallback(
    (value: string) => {
      if (value.trim() === "") {
        return "";
      }
      const evaluated = tryEvaluate(value);
      if (!evaluated || ensurePositive && evaluated.scalar < 0) {
        return false;
      }
      if (ensurePositive && evaluated.scalar === 0) {
        return "";
      }

      return toRealDimensionString(evaluated.unit ? evaluated : { ...evaluated, unit: defaultUnits });
    },
    [defaultUnits, ensurePositive]
  );
  return (
    <Textbox
      {...rest}
      disabled={disabled}
      value={disabled ? "" : value}
      onValueInput={handleValueInput}
      validateOnBlur={handleValidateOnBlur}
    />
  );
}
