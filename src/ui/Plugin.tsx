import "!./styles.css";
import { render, useWindowResize } from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import { ExportReadySVG, Selection, SelectionChangeHandler } from "../types";
import { windowConstraints } from "../utils";
import { FrameSelectionEditor } from "./FrameSelectionEditor";
import { PathSelectionEditor } from "./PathSelectionEditor";
import { Preview } from "./preview/Preview";

function Plugin(props: { preview?: ExportReadySVG }) {
  const [selection, setSelection] = useState<Selection>();
  useEffect(() => {
    on<SelectionChangeHandler>("SELECTION_CHANGE", (selection) => {
      setSelection(selection);
    });
  }, []);

  useWindowResize((size) => {
    emit("RESIZE_WINDOW", size);
  }, windowConstraints);

  if (props.preview) {
    return <Preview preview={props.preview} />;
  }

  return selection?.kind === "PATHS" ? (
    <PathSelectionEditor selection={selection} />
  ) : selection?.kind === "FRAME" ? (
    <FrameSelectionEditor selection={selection} />
  ) : null;
}

export default render(Plugin);
