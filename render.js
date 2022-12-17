// @ts-check

import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

window.THREE = THREE;

const fillMaterial = new THREE.MeshBasicMaterial({ color: "#F3FBFB" });
const strokeMaterial = new THREE.LineBasicMaterial({
  color: "#00A5E6",
});
const renderSVG = (extrusion, svg) => {
  const loader = new SVGLoader();
  const svgData = loader.parse(svg);
  const svgGroup = new THREE.Group();
  const updateMap = [];

  svgGroup.scale.y *= -1;
  svgData.paths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);

    shapes.forEach((shape) => {
      const meshGeometry = new THREE.ExtrudeGeometry(shape, {
        depth: extrusion,
        bevelEnabled: false,
      });
      const linesGeometry = new THREE.EdgesGeometry(meshGeometry);
      const mesh = new THREE.Mesh(meshGeometry, fillMaterial);
      const lines = new THREE.LineSegments(linesGeometry, strokeMaterial);

      console.log(path.userData);

      updateMap.push({ shape, mesh, lines });
      svgGroup.add(mesh, lines);
    });
  });

  const box = new THREE.Box3().setFromObject(svgGroup);
  const size = box.getSize(new THREE.Vector3());
  const yOffset = size.y / -2;
  const xOffset = size.x / -2;

  svgGroup.children.forEach((item) => {
    item.position.x = xOffset;
    item.position.y = yOffset;
  });
  svgGroup.rotateX(-Math.PI / 2);

  return {
    object: svgGroup,
    update(extrusion) {
      updateMap.forEach((updateDetails) => {
        const meshGeometry = new THREE.ExtrudeGeometry(
          updateDetails.shape,
          {
            depth: extrusion,
            bevelEnabled: false,
          }
        );
        const linesGeometry = new THREE.EdgesGeometry(meshGeometry);

        updateDetails.mesh.geometry.dispose();
        updateDetails.lines.geometry.dispose();
        updateDetails.mesh.geometry = meshGeometry;
        updateDetails.lines.geometry = linesGeometry;
      });
    },
  };
};
// scene.js

// Inspired by https://discourse.threejs.org/t/camera-zoom-to-fit-object/936/3
const fitCameraToObject = (camera, object, controls) => {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
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
};

const svg = `<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" height="100%" style="fill-rule:nonzero;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;" xml:space="preserve" width="100%" version="1.1" viewBox="0 0 24 24">
  <defs/>
  <g id="Untitled">
  <path d="M7.15256e-07+7.15256e-07L24+7.15256e-07L24+24L7.15256e-07+24L7.15256e-07+7.15256e-07M6.30667+20.0533C6.84+21.1867+7.89333+22.12+9.69333+22.12C11.6933+22.12+13.0667+21.0533+13.0667+18.72L13.0667+11.0133L10.8+11.0133L10.8+18.6667C10.8+19.8133+10.3333+20.1067+9.6+20.1067C8.82667+20.1067+8.50667+19.5733+8.14667+18.9467L6.30667+20.0533M14.28+19.8133C14.9467+21.12+16.2933+22.12+18.4+22.12C20.5333+22.12+22.1333+21.0133+22.1333+18.9733C22.1333+17.0933+21.0533+16.2533+19.1333+15.4267L18.5733+15.1867C17.6+14.7733+17.1867+14.4933+17.1867+13.8267C17.1867+13.28+17.6+12.8533+18.2667+12.8533C18.9067+12.8533+19.3333+13.1333+19.72+13.8267L21.4667+12.6667C20.7333+11.3867+19.6933+10.8933+18.2667+10.8933C16.2533+10.8933+14.96+12.1733+14.96+13.8667C14.96+15.7067+16.04+16.5733+17.6667+17.2667L18.2267+17.5067C19.2667+17.96+19.88+18.24+19.88+19.0133C19.88+19.6533+19.28+20.12+18.3467+20.12C17.24+20.12+16.6+19.5467+16.12+18.7467L14.28+19.8133Z" opacity="1" fill="#000000"/>
  </g>
  </svg>`;

const otherSvg = `<svg width="128" height="443" viewBox="0 0 128 443" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="128" height="443" fill="white"/>
<rect shaper:cutType="inside" shaper:cutDepth="15" x="54.5" y="0.5" width="19" height="438" rx="7.5" fill="#D9D9D9" stroke="black"/>
<rect shaper:cutType="inside" shaper:cutDepth="15" x="42.5" y="54.5" width="43" height="21" rx="7.5" fill="#D9D9D9" stroke="black"/>
<rect shaper:cutType="inside" shaper:cutDepth="15" x="50.5" y="0.5" width="27" height="41" rx="7.5" fill="#D9D9D9" stroke="black"/>
<path shaper:cutType="inside" shaper:cutDepth="15" d="M53.8135 355.501L53.8208 355.5H74.1792L74.1865 355.501C74.2102 355.504 74.2464 355.508 74.2945 355.515C74.3907 355.528 74.5343 355.549 74.7205 355.579C75.0931 355.639 75.6358 355.736 76.3101 355.887C77.6592 356.187 79.5313 356.695 81.618 357.527C85.7525 359.175 90.6942 362.079 94.1009 367.114C90.4026 389.591 93.2655 406.524 99.6057 417.869C105.864 429.068 115.512 434.81 125.5 434.995V442.5H64.249H63.751H2.5V434.994C11.5354 434.789 21.1575 429.039 27.6432 417.876C34.2323 406.535 37.5963 389.601 33.8991 367.114C37.3058 362.079 42.2475 359.175 46.382 357.527C48.4687 356.695 50.3408 356.187 51.6899 355.887C52.3642 355.736 52.9069 355.639 53.2795 355.579C53.4657 355.549 53.6093 355.528 53.7055 355.515C53.7536 355.508 53.7898 355.504 53.8135 355.501Z" fill="#D9D9D9" stroke="black"/>
</svg>
`;
const defaultExtrusion = 10;
const app = document.querySelector("#app");
const focusButton = document.querySelector("#focus");
const extrusionInput = document.querySelector("#input");
const { scene, camera, controls } = setupScene(app);
const { object, update } = renderSVG(defaultExtrusion, otherSvg);

scene.add(object);

extrusionInput.addEventListener("input", () => {
  update(Number(extrusionInput.value));
});
focusButton.addEventListener("click", () => {
  fitCameraToObject(camera, object, controls);
});
extrusionInput.value = defaultExtrusion;