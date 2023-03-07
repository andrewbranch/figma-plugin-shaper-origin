import * as Three from "Three";
import { OrbitControls } from "Three/examples/jsm/controls/OrbitControls.js";
import { SVGLoader } from "Three/examples/jsm/loaders/SVGLoader.js";
import Clipper from "clipper-lib";
import { CutType } from "../../types";

interface Point {
  X: number;
  Y: number;
}

type Path = Point[];

interface CutPaths {
  kind: "CUT_PATHS";
  d: string;
  cutType: CutType;
  bitDiameter: number;
}

interface DesignPath {
  kind: "DESIGN_PATH";
  cutType: CutType;
  d: string;
}

type ComputedPath = CutPaths | DesignPath;

export function getCutSVG(svgElement: SVGSVGElement) {
  const isGeometry = (node: Element): node is SVGGeometryElement =>
    node instanceof SVGGeometryElement;
  const geometry = Array.from(svgElement.querySelectorAll("*")).filter(
    isGeometry
  );
  const paths = geometry.flatMap<ComputedPath>((pathElement) => {
    const cutType = pathElement.getAttribute("shaper:cutType") as
      | CutType
      | undefined;
    const cutterDiameter = 15;
    if (cutType) {
      const offsetPaths = getCutPaths(pathElement, cutType, cutterDiameter);
      if (!offsetPaths.cutContour) {
        return [
          {
            kind: "DESIGN_PATH",
            cutType,
            d: offsetPaths.designPath,
          },
        ];
      }

      return [
        {
          kind: "CUT_PATHS",
          cutType,
          bitDiameter: cutterDiameter,
          d: offsetPaths.cutContour,
        },
        {
          kind: "DESIGN_PATH",
          cutType,
          d: offsetPaths.designPath,
        },
      ];
    }
    return [];
  });

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("viewBox", svgElement.getAttribute("viewBox")!);
  const pathElements = paths.map((path) => {
    const pathElement = document.createElement("path");
    pathElement.setAttribute("d", path.d);
    pathElement.setAttribute("fill-rule", "evenodd");
    pathElement.classList.add(path.cutType);
    if (path.kind === "CUT_PATHS") {
      pathElement.classList.add("cut");
    } else {
      pathElement.classList.add("design");
      pathElement.setAttribute("fill", "none");
    }
    return pathElement;
  });
  svg.append(...pathElements);
  return svg.outerHTML;
}

function getCutPaths(
  pathElement: SVGGeometryElement,
  cutType: CutType,
  cutterDiameter: number
) {
  const scale = 10;
  let paths = [toPath(pathElement, 1)];
  Clipper.JS.ScaleUpPaths(paths, scale);
  paths = Clipper.Clipper.SimplifyPolygons(
    paths,
    Clipper.PolyFillType.pftEvenOdd
  );
  paths = Clipper.Clipper.CleanPolygons(paths, 0.1 * scale);
  if (cutType === "guide") {
    return {
      designPath: serializePaths(paths, scale),
      cutContour: undefined,
    };
  }

  let centerlinePaths = paths;

  if (cutType === "inside" || cutType === "outside" || cutType === "pocket") {
    centerlinePaths = [];
    const offset = new Clipper.ClipperOffset(Infinity, 0.25);
    offset.AddPaths(
      paths,
      Clipper.JoinType.jtMiter,
      Clipper.EndType.etClosedPolygon
    );
    offset.Execute(
      centerlinePaths,
      cutType === "outside"
        ? (scale * cutterDiameter) / 2
        : (scale * -cutterDiameter) / 2
    );
  }

  const cutter = getUnitCircle();
  Clipper.JS.ScaleUpPath(cutter, (scale * cutterDiameter) / 2);
  const solution = Clipper.Clipper.MinkowskiSum(
    cutter,
    centerlinePaths,
    cutType === "pocket"
  );

  return {
    designPath: serializePaths(paths, scale),
    cutContour: serializePaths(solution as Path[], scale),
  };
}

function getUnitCircle() {
  return [
    { X: 1, Y: 0 },
    { X: 0.9987550973892212, Y: 0.04997774213552475 },
    { X: 0.9950512647628784, Y: 0.09983277320861816 },
    { X: 0.9888762831687927, Y: 0.1494419276714325 },
    { X: 0.9802303910255432, Y: 0.19868044555187225 },
    { X: 0.9691254496574402, Y: 0.24742333590984344 },
    { X: 0.9555841684341431, Y: 0.29554662108421326 },
    { X: 0.939629077911377, Y: 0.3429207503795624 },
    { X: 0.9213314652442932, Y: 0.3894299864768982 },
    { X: 0.9006685614585876, Y: 0.434948205947876 },
    { X: 0.8777467608451843, Y: 0.4793700873851776 },
    { X: 0.8526298403739929, Y: 0.5225870013237 },
    { X: 0.8253865242004395, Y: 0.564494252204895 },
    { X: 0.7960898876190186, Y: 0.6049908995628357 },
    { X: 0.7648167610168457, Y: 0.6439798474311829 },
    { X: 0.7316471934318542, Y: 0.6813671588897705 },
    { X: 0.6966646313667297, Y: 0.7170624136924744 },
    { X: 0.659955620765686, Y: 0.7509781718254089 },
    { X: 0.6216095685958862, Y: 0.7830302119255066 },
    { X: 0.5817192196846008, Y: 0.8131375312805176 },
    { X: 0.5403806567192078, Y: 0.8412225842475891 },
    { X: 0.49769341945648193, Y: 0.867211103439331 },
    { X: 0.45376068353652954, Y: 0.891033411026001 },
    { X: 0.4086897671222687, Y: 0.9126242995262146 },
    { X: 0.36259129643440247, Y: 0.9319242835044861 },
    { X: 0.315580278635025, Y: 0.9488800764083862 },
    { X: 0.26783275604248047, Y: 0.9636688828468323 },
    { X: 0.21933843195438385, Y: 0.9758077263832092 },
    { X: 0.1702956259250641, Y: 0.9854946136474609 },
    { X: 0.12082912027835846, Y: 0.992712676525116 },
    { X: 0.07106421142816544, Y: 0.997456431388855 },
    { X: 0.021125294268131256, Y: 0.9997326731681824 },
    { X: -0.028866102918982506, Y: 0.9995572566986084 },
    { X: -0.07878860086202621, Y: 0.9969199895858765 },
    { X: -0.1285189390182495, Y: 0.9918040037155151 },
    { X: -0.17793089151382446, Y: 0.9842059016227722 },
    { X: -0.22689858078956604, Y: 0.9741339683532715 },
    { X: -0.2752966582775116, Y: 0.9616078734397888 },
    { X: -0.3229083716869354, Y: 0.94640052318573 },
    { X: -0.3697885572910309, Y: 0.9290865063667297 },
    { X: -0.41573935747146606, Y: 0.9094372391700745 },
    { X: -0.4606466293334961, Y: 0.8875066041946411 },
    { X: -0.5044004321098328, Y: 0.8633546233177185 },
    { X: -0.5468941330909729, Y: 0.8370468616485596 },
    { X: -0.5880244374275208, Y: 0.8086537718772888 },
    { X: -0.6276929378509521, Y: 0.7782496213912964 },
    { X: -0.6658036112785339, Y: 0.745912492275238 },
    { X: -0.7022644281387329, Y: 0.7117235064506531 },
    { X: -0.7369862198829651, Y: 0.6757672429084778 },
    { X: -0.7698824405670166, Y: 0.6381317973136902 },
    { X: -0.800870418548584, Y: 0.5989075899124146 },
    { X: -0.8298203349113464, Y: 0.5581663846969604 },
    { X: -0.8566800951957703, Y: 0.5160086154937744 },
    { X: -0.8814026117324829, Y: 0.47256460785865784 },
    { X: -0.9039210677146912, Y: 0.42794081568717957 },
    { X: -0.9241747856140137, Y: 0.382245808839798 },
    { X: -0.9421085715293884, Y: 0.33559268712997437 },
    { X: -0.9577924013137817, Y: 0.2881232500076294 },
    { X: -0.9709615707397461, Y: 0.239899143576622 },
    { X: -0.9816877841949463, Y: 0.19107387959957123 },
    { X: -0.9899495840072632, Y: 0.14177179336547852 },
    { X: -0.995736300945282, Y: 0.09211824834346771 },
    { X: -0.9990491271018982, Y: 0.0422385111451149 },
    { X: -0.9999020099639893, Y: -0.00774429552257061 },
    { X: -0.9983027577400208, Y: -0.05770903453230858 },
    { X: -0.9942324757575989, Y: -0.1075335443019867 },
    { X: -0.9876819849014282, Y: -0.15709340572357178 },
    { X: -0.9786543250083923, Y: -0.2062624841928482 },
    { X: -0.9671643376350403, Y: -0.2549152672290802 },
    { X: -0.9531719088554382, Y: -0.30289608240127563 },
    { X: -0.9368359446525574, Y: -0.3501341640949249 },
    { X: -0.9181404709815979, Y: -0.3964882791042328 },
    { X: -0.8971375226974487, Y: -0.4418424963951111 },
    { X: -0.8738855123519897, Y: -0.486085444688797 },
    { X: -0.848449170589447, Y: -0.5291082859039307 },
    { X: -0.8208974599838257, Y: -0.5708069801330566 },
    { X: -0.7913036346435547, Y: -0.6110814809799194 },
    { X: -0.759745180606842, Y: -0.6498346328735352 },
    { X: -0.7263019680976868, Y: -0.6869735717773438 },
    { X: -0.6910582184791565, Y: -0.7224076390266418 },
    { X: -0.6541005373001099, Y: -0.7560499310493469 },
    { X: -0.6155188679695129, Y: -0.7878165245056152 },
    { X: -0.5754066705703735, Y: -0.8176264762878418 },
    { X: -0.533859372138977, Y: -0.8454033136367798 },
    { X: -0.49097833037376404, Y: -0.8710721731185913 },
    { X: -0.44686612486839294, Y: -0.8945645689964294 },
    { X: -0.40163135528564453, Y: -0.9158153533935547 },
    { X: -0.35538533329963684, Y: -0.9347654581069946 },
    { X: -0.30824270844459534, Y: -0.9513627886772156 },
    { X: -0.260355681180954, Y: -0.9656921625137329 },
    { X: -0.21176937222480774, Y: -0.9774554967880249 },
    { X: -0.1626535803079605, Y: -0.9867607355117798 },
    { X: -0.11313337832689285, Y: -0.993592381477356 },
    { X: -0.06333361566066742, Y: -0.9979463219642639 },
    { X: -0.013379933312535286, Y: -0.9998306632041931 },
    { X: 0.03660661727190018, Y: -0.9992631673812866 },
    { X: 0.08650469779968262, Y: -0.9962347745895386 },
    { X: 0.13619017601013184, Y: -0.9907305836677551 },
    { X: 0.18553896248340607, Y: -0.98274827003479 },
    { X: 0.23442374169826508, Y: -0.9722976684570312 },
    { X: 0.2827211022377014, Y: -0.9593993425369263 },
    { X: 0.33024606108665466, Y: -0.9439176917076111 },
    { X: 0.37699463963508606, Y: -0.9262452125549316 },
    { X: 0.4227975308895111, Y: -0.9062463045120239 },
    { X: 0.467540979385376, Y: -0.8839755654335022 },
    { X: 0.511115550994873, Y: -0.8594935536384583 },
    { X: 0.5534152984619141, Y: -0.8328661918640137 },
    { X: 0.5943371057510376, Y: -0.8041647672653198 },
    { X: 0.6337834000587463, Y: -0.7734634876251221 },
    { X: 0.671658456325531, Y: -0.7408409118652344 },
    { X: 0.7078290581703186, Y: -0.7063491940498352 },
    { X: 0.7422174215316772, Y: -0.6700692772865295 },
    { X: 0.7747623324394226, Y: -0.6321305632591248 },
    { X: 0.8053829669952393, Y: -0.5926240086555481 },
    { X: 0.834000825881958, Y: -0.5516453981399536 },
    { X: 0.8605412840843201, Y: -0.5092933773994446 },
    { X: 0.8849337697029114, Y: -0.46567004919052124 },
    { X: 0.9071120023727417, Y: -0.42088261246681213 },
    { X: 0.9270161390304565, Y: -0.3750395178794861 },
    { X: 0.9445912837982178, Y: -0.3282553553581238 },
    { X: 0.9600010514259338, Y: -0.28069832921028137 },
    { X: 0.9727979898452759, Y: -0.23237352073192596 },
    { X: 0.9831453561782837, Y: -0.18346627056598663 },
    { X: 0.9910230040550232, Y: -0.1341003030538559 },
    { X: 0.9964214563369751, Y: -0.08440262824296951 },
    { X: 0.9993432760238647, Y: -0.03449787572026253 },
  ];
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
        const meshGeometry = new Three.ExtrudeGeometry(updateDetails.shape, {
          depth: cutDepth,
          bevelEnabled: false,
        });
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
  let svgpath = "",
    i,
    j;
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
