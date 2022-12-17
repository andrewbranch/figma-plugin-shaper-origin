import { Dropdown, DropdownOption } from "@create-figma-plugin/ui";
import { CutType } from "../types";
import { useCallback, useMemo } from "preact/hooks";
import {
  IconInside16,
  IconOutside16,
  IconOnLine16,
  IconPocket16,
  IconGuide16,
} from "./icons";
import { JSX, h } from "preact";
import { assertCutType } from "../utils";

type DropdownOptionValue = CutType | "" | "Mixed";

const openCutTypeOptions: DropdownOption<DropdownOptionValue>[] = [
  {
    value: "online",
    text: "On Line",
  },
  {
    value: "guide",
    text: "Guide",
  },
];

const closedCutTypeOptions: DropdownOption<DropdownOptionValue>[] = [
  {
    value: "inside",
    text: "Inside",
  },
  {
    value: "outside",
    text: "Outside",
  },
  {
    value: "online",
    text: "On Line",
  },
  {
    value: "pocket",
    text: "Pocket",
  },
  {
    value: "guide",
    text: "Guide",
  },
];

const mixed: DropdownOption<DropdownOptionValue>[] = [
  {
    value: "Mixed",
    disabled: true,
    text: "Mixed",
  },
  {
    separator: true,
  },
];

const clear: DropdownOption<DropdownOptionValue>[] = [
  {
    separator: true,
  },
  {
    value: "",
    text: "Clear",
  },
];

const openCutTypeOptionsWithClear: DropdownOption<DropdownOptionValue>[] = [
  ...openCutTypeOptions,
  ...clear,
];

const closedCutTypeOptionsWithClear: DropdownOption<DropdownOptionValue>[] = [
  ...closedCutTypeOptions,
  ...clear,
];

const mixedOpenCutTypeOptions: DropdownOption<DropdownOptionValue>[] = [
  ...mixed,
  ...openCutTypeOptions,
];

const mixedClosedCutTypeOptions: DropdownOption<DropdownOptionValue>[] = [
  ...mixed,
  ...closedCutTypeOptions,
];

const mixedOpenCutTypeOptionsWithClear: DropdownOption<DropdownOptionValue>[] =
  [...mixedOpenCutTypeOptions, ...clear];

const mixedClosedCutTypeOptionsWithClear: DropdownOption<DropdownOptionValue>[] =
  [...mixedClosedCutTypeOptions, ...clear];

interface CutTypeDropdownProps {
  cutType: CutType | "Mixed" | null;
  shapeIsClosed: boolean;
  onChange: (value: CutType | "") => void;
}

const noIcon16 = (
  <span style={{ display: "inline-block", width: 16, height: 16 }} />
);

export function CutTypeDropdown(props: CutTypeDropdownProps) {
  const { cutType, shapeIsClosed, onChange } = props;

  const onCutTypeChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      if (value !== "") {
        assertCutType(value);
      }
      onChange(value);
    },
    [props.onChange]
  );

  const icon = useMemo(() => {
    switch (cutType) {
      case "inside":
        return <IconInside16 />;
      case "outside":
        return <IconOutside16 />;
      case "online":
        return <IconOnLine16 />;
      case "pocket":
        return <IconPocket16 />;
      case "guide":
        return <IconGuide16 />;
      default:
        return noIcon16;
    }
  }, [cutType]);

  const options =
    cutType === "Mixed"
      ? cutType
        ? shapeIsClosed
          ? mixedClosedCutTypeOptionsWithClear
          : mixedOpenCutTypeOptionsWithClear
        : shapeIsClosed
        ? mixedClosedCutTypeOptions
        : mixedOpenCutTypeOptions
      : cutType
      ? shapeIsClosed
        ? closedCutTypeOptionsWithClear
        : openCutTypeOptionsWithClear
      : shapeIsClosed
      ? closedCutTypeOptions
      : openCutTypeOptions;

  return (
    <Dropdown
      icon={icon}
      placeholder="Cut type"
      options={options}
      value={cutType || null}
      onChange={onCutTypeChange}
    />
  );
}
