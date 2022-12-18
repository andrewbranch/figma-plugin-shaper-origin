import "!./styles.css";
import { render, useWindowResize } from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
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

  useWindowResize(
    (size) => {
      emit("RESIZE_WINDOW", size);
    },
    {
      minWidth: 320,
      minHeight: 240,
    }
  );

  return selection?.kind === "PATHS" ? (
    <PathSelectionEditor selection={selection} />
  ) : selection?.kind === "FRAME" ? (
    <FrameSelectionEditor selection={selection} />
  ) : null;
}

export default render(Plugin);
