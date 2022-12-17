import Clipper from 'clipper-lib'
import * as Three from 'Three'
import { SVGLoader } from "Three/examples/jsm/loaders/SVGLoader.js";
import { OrbitControls } from "Three/examples/jsm/controls/OrbitControls.js";
import { CutType } from '../../types';

interface Point {
  X: number
  Y: number
}

type Path = Point[]

export function getCutSVG(svgElement: SVGSVGElement) {
  const isGeometry = (node: Element): node is SVGGeometryElement => node instanceof SVGGeometryElement;
  const geometry = Array.from(svgElement.querySelectorAll('*')).filter(isGeometry);
  const paths = geometry.flatMap(pathElement => {
    const cutType = pathElement.getAttribute('shaper:cutType') as CutType | undefined;
    if (cutType) {
      return serializePaths(getCutPaths(pathElement, cutType, 5), 100);
    }
    return [];
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', svgElement.getAttribute('viewBox')!);
  const pathElements = paths.map(path => {
    const pathElement = document.createElement('path');
    pathElement.setAttribute('d', path);
    return pathElement;
  });
  svg.append(...pathElements);
  return svg.outerHTML;
}

function getCutPaths(pathElement: SVGGeometryElement, cutType: CutType, bitDiameter: number) {
  const scale = 100
  const paths = [toPath(pathElement, 1)];
  Clipper.JS.ScaleUpPaths(paths, scale);

  let centerlinePaths = paths;

  if (cutType === 'inside' || cutType === 'outside' || cutType === 'pocket') {
    centerlinePaths = [];
    const offset = new Clipper.ClipperOffset(2, 0.25);
    offset.AddPaths(paths, Clipper.JoinType.jtRound, Clipper.EndType.etClosedPolygon);
    offset.Execute(
      centerlinePaths,
      cutType === 'outside' ? scale * bitDiameter / 2 : scale * -bitDiameter / 2
    );
  }

  const outerContourPaths: Path[] = [];
  const outerOffset = new Clipper.ClipperOffset(2, 0.25);
  outerOffset.AddPaths(centerlinePaths, Clipper.JoinType.jtRound, Clipper.EndType.etClosedPolygon);
  outerOffset.Execute(outerContourPaths, scale * bitDiameter / 2);

  const innerContourPaths: Path[] = [];
  if (cutType !== 'pocket') {
    const innerOffset = new Clipper.ClipperOffset(2, 0.25);
    innerOffset.AddPaths(centerlinePaths, Clipper.JoinType.jtRound, Clipper.EndType.etClosedPolygon);
    innerOffset.Execute(innerContourPaths, scale * -bitDiameter / 2);
  }

  return [...outerContourPaths, ...innerContourPaths];
}

function render(svgString: string, cutDepth: number) {
  const fillMaterial = new Three.MeshBasicMaterial({ color: "#F3FBFB" });
  const strokeMaterial = new Three.LineBasicMaterial({
    color: "#00A5E6",
  });
  const loader = new SVGLoader();
  const svgData = loader.parse(svgString);
  const svgGroup = new Three.Group();
  const updateMap: any[] = [];

  svgGroup.scale.y *= -1;
  svgData.paths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);

    shapes.forEach((shape) => {
      const meshGeometry = new Three.ExtrudeGeometry(shape, {
        depth: cutDepth,
        bevelEnabled: false,
      });
      const linesGeometry = new Three.EdgesGeometry(meshGeometry);
      const mesh = new Three.Mesh(meshGeometry, fillMaterial);
      const lines = new Three.LineSegments(linesGeometry, strokeMaterial);

      updateMap.push({ shape, mesh, lines });
      svgGroup.add(mesh, lines);
    });
  });

  const box = new Three.Box3().setFromObject(svgGroup);
  const size = box.getSize(new Three.Vector3());
  const yOffset = size.y / -2;
  const xOffset = size.x / -2;

  svgGroup.children.forEach((item) => {
    item.position.x = xOffset;
    item.position.y = yOffset;
  });
  svgGroup.rotateX(-Math.PI / 2);

  return {
    object: svgGroup,
    update(cutDepth: number) {
      updateMap.forEach((updateDetails) => {
        const meshGeometry = new Three.ExtrudeGeometry(
          updateDetails.shape,
          {
            depth: cutDepth,
            bevelEnabled: false,
          }
        );
        const linesGeometry = new Three.EdgesGeometry(meshGeometry);

        updateDetails.mesh.geometry.dispose();
        updateDetails.lines.geometry.dispose();
        updateDetails.mesh.geometry = meshGeometry;
        updateDetails.lines.geometry = linesGeometry;
      });
    },
  };
}

function setupScene(container: HTMLElement) {
  const scene = new Three.Scene();
  const renderer = new Three.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  const camera = new Three.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.01,
    1e5
  );
  const ambientLight = new Three.AmbientLight("#888888");
  const pointLight = new Three.PointLight("#ffffff", 2, 800);
  const controls = new OrbitControls(camera, renderer.domElement);
  const animate = () => {
    renderer.render(scene, camera);
    controls.update();

    requestAnimationFrame(animate);
  };

  renderer.setSize(window.innerWidth, window.innerHeight);
  scene.add(ambientLight, pointLight);
  camera.position.z = 50;
  camera.position.x = 50;
  camera.position.y = 50;
  controls.enablePan = false;

  container.append(renderer.domElement);
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  animate();

  return { camera, controls, scene };
}

function fitCameraToObject(camera: any, object: any, controls: any) {
  const boundingBox = new Three.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new Three.Vector3());
  const size = boundingBox.getSize(new Three.Vector3());
  const offset = 1.25;
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraZ = Math.abs((maxDim / 4) * Math.tan(fov * 2)) * offset;
  const minZ = boundingBox.min.z;
  const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

  controls.target = center;
  controls.maxDistance = cameraToFarEdge * 2;
  controls.minDistance = cameraToFarEdge * 0.5;
  controls.saveState();
  camera.position.z = cameraZ;
  camera.far = cameraToFarEdge * 3;
  camera.updateProjectionMatrix();
}

function serializePaths(paths: Path[], scale: number) {
  let svgpath = "", i, j;
  if (!scale) scale = 1;
  for (i = 0; i < paths.length; i++) {
    for (j = 0; j < paths[i].length; j++) {
      if (!j) svgpath += "M";
      else svgpath += "L";
      svgpath += paths[i][j].X / scale + ", " + paths[i][j].Y / scale;
    }
    svgpath += "Z";
  }
  if (svgpath == "") svgpath = "M0,0";
  return svgpath;
}

function toPath(pathSVG: SVGGeometryElement, stepSize: number) {
  console.log(pathSVG);
  const pathLength = pathSVG.getTotalLength();
  const path: Path = [];
  let i = 0;
  while (i < pathLength) {
    let arr = pathSVG.getPointAtLength(i);
    path.push({ X: arr.x, Y: arr.y });
    i += stepSize;
  }
  return path;
}