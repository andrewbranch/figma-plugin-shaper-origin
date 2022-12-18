import { Textbox, TextboxProps } from "@create-figma-plugin/ui";
import { h } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { coerceDimension, parseRealDimensionString } from "../dimensions";
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
        if (value !== prevValue && handleValidateOnBlur(value) === value) {
          onValidInput(value as RealDimensionString);
        }
        return value;
      });
    },
    [onValidInput]
  );
  const handleValidateOnBlur = useCallback(
    (value: string) => {
      if (value.trim() === "") {
        return "";
      }
      const coerced = coerceDimension(value, !!ensurePositive, defaultUnits);
      const scalar = coerced && parseRealDimensionString(coerced).scalar;
      if (ensurePositive && scalar === 0) {
        return "";
      }

      return coerced ?? false;
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
