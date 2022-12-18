import "!./styles.css";
import { Container, VerticalSpace, render } from "@create-figma-plugin/ui";
import { on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import { Selection, SelectionChangeHandler } from "../types";
import { FrameSelectionEditor } from "./FrameSelectionEditor";
import { PathSelectionEditor } from "./PathSelectionEditor";

function Plugin() {
  const [selection, setSelection] = useState<Selection>();
  useEffect(() => {
    on<SelectionChangeHandler>("SELECTION_CHANGE", (selection) => {
      setSelection(selection);
    });
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="large" />
      {selection?.kind === "PATHS" ? (
        <PathSelectionEditor selection={selection} />
      ) : selection?.kind === "FRAME" ? (
        <FrameSelectionEditor selection={selection} />
      ) : null}
    </Container>
  );
}

export default render(Plugin);
