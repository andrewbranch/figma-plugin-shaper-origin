import { ExportReadySVG } from "../types";

export function prepareEncodedSvg({
  pathData,
  width,
  height,
  svg,
}: ExportReadySVG): SVGSVGElement {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(
    new TextDecoder().decode(
      // Uint8Array doesn't survive encoding into the Preview window HTML
      svg instanceof Uint8Array ? svg : Uint8Array.from(svg)
    ),
    "image/svg+xml"
  );
  svgDoc.documentElement.setAttribute("width", width.replace(" ", ""));
  svgDoc.documentElement.setAttribute("height", height.replace(" ", ""));
  svgDoc.documentElement.setAttribute(
    "xmlns:shaper",
    "http://www.shapertools.com/namespaces/shaper"
  );
  for (const nodeId in pathData) {
    const data = pathData[nodeId];
    const path = svgDoc.getElementById(nodeId);
    if (data.cutDepth) {
      path!.setAttribute("shaper:cutDepth", data.cutDepth.replace(" ", ""));
    }
    if (data.cutType) {
      path!.setAttribute("shaper:cutType", data.cutType.replace(" ", ""));
    }
  }

  return svgDoc.documentElement as any as SVGSVGElement;
}
