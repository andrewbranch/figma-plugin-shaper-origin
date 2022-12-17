import { h } from "preact";
import { Props } from "@create-figma-plugin/ui";
import depth from "./images/depth.svg";
import guide from "./images/guide.svg";
import inside from "./images/inside.svg";
import onLine from "./images/on-line.svg";
import outside from "./images/outside.svg";
import pocket from "./images/pocket.svg";

// There is definitely a better way to do this,
// but I'm too lazy to figure out how to customize
// the build.
function getPathStrings(dataURL: string): string[] {
  const base64 = dataURL.slice("data:image/svg+xml;base64,".length);
  const svg = atob(base64);
  const regex = /<path d="([^"]+)"/g;
  const matches = [];
  let match;
  while ((match = regex.exec(svg))) {
    matches.push(match[1]);
  }
  return matches;
}

function createIcon(paths: string[], size: number) {
  return function Icon(props: Props<SVGSVGElement>) {
    return (
      <svg
        {...props}
        viewBox="0 0 64 64"
        fill="currentColor"
        style={{ height: size, width: size }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path) => (
          <path clip-rule="evenodd" d={path} fill-rule="evenodd" />
        ))}
      </svg>
    );
  };
}

export const IconDepth16 = createIcon(getPathStrings(depth), 16);
export const IconGuide16 = createIcon(getPathStrings(guide), 16);
export const IconInside16 = createIcon(getPathStrings(inside), 16);
export const IconOnLine16 = createIcon(getPathStrings(onLine), 16);
export const IconOutside16 = createIcon(getPathStrings(outside), 16);
export const IconPocket16 = createIcon(getPathStrings(pocket), 16);
