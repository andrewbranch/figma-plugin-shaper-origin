import { Text } from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import {
  CutType,
  RealDimensionString,
  RealUnit,
  SetPathDataHandler,
} from "../types";
import { CutTypeDropdown } from "./CutTypeDropdown";
import { DimensionTextbox } from "./DimensionTextbox";
import { Cell, Row } from "./Table";
import { IconDepth16 } from "./icons";

interface CutControlsProps {
  nodeIds: readonly string[];
  shapeIsClosed: boolean;
  label?: string;
  cutDepth?: RealDimensionString | "Mixed";
  cutType?: CutType | "Mixed";
  defaultUnits: RealUnit;
}

export function CutControls({
  nodeIds,
  shapeIsClosed,
  label,
  cutDepth: initialCutDepth,
  cutType: initialCutType,
  defaultUnits,
}: CutControlsProps) {
  const [cutType, setCutType] = useState(initialCutType);
  const onCutTypeChange = useCallback(
    (cutType: CutType | "") => {
      setCutType(cutType || undefined);
      emit<SetPathDataHandler>("SET_PATH_DATA", { nodeIds, cutType });
    },
    [nodeIds]
  );
  const onCutDepthChange = useCallback(
    (value: RealDimensionString | "") => {
      emit<SetPathDataHandler>("SET_PATH_DATA", { nodeIds, cutDepth: value });
    },
    [nodeIds]
  );

  useEffect(() => {
    setCutType(initialCutType);
  }, [nodeIds]);

  return (
    <Row>
      {label && (
        <Cell>
          <Text>{label}</Text>
        </Cell>
      )}
      <Cell width={80}>
        <DimensionTextbox
          defaultUnits={defaultUnits}
          icon={<IconDepth16 />}
          disabled={cutType === "guide"}
          placeholder="Depth"
          initialValue={initialCutDepth}
          onValidInput={onCutDepthChange}
        />
      </Cell>
      <Cell width={96}>
        <CutTypeDropdown
          shapeIsClosed={shapeIsClosed}
          cutType={cutType ?? null}
          onChange={onCutTypeChange}
        />
      </Cell>
    </Row>
  );
}
