import * as THREE from "three";

const ROOF_EDGE_OFFSET = 0.028;
const ROOF_EDGE_HEIGHT = 0.11;
const ROOF_EDGE_THICKNESS = 0.035;
const ROOF_EDGE_CENTER_Y = ROOF_EDGE_OFFSET - (ROOF_EDGE_HEIGHT - ROOF_EDGE_THICKNESS) / 2;
const GABLE_END_OFFSET = 0.018;
const CORNER_TRIM_WIDTH = 0.075;
const CORNER_TRIM_DEPTH = 0.025;

const GABLE_PLANES = [
  {
    name: "left",
    position: [0, 2.6414127349853516, 1.5910396575927734],
    rotation: [Math.PI / 9, 0, 0],
    scale: [3.1314218044281006, 1.1368772983551025, 1.7291532754898071],
  },
  {
    name: "right",
    position: [0, 2.6281611919403076, -1.6175947189331055],
    rotation: [-Math.PI / 9, 0, 0],
    scale: [3.1314218044281006, 1.1368772983551025, 1.7291532754898071],
  },
];

function RoofPlaneEdges({ material, endOffset = 0 }) {
  return (
    <group name="roof-plane-edge-frame">
      <mesh position={[0, ROOF_EDGE_CENTER_Y, 1]} material={material}>
        <boxGeometry args={[2, ROOF_EDGE_HEIGHT, ROOF_EDGE_THICKNESS]} />
      </mesh>
      <mesh position={[0, ROOF_EDGE_CENTER_Y, -1]} material={material}>
        <boxGeometry args={[2, ROOF_EDGE_HEIGHT, ROOF_EDGE_THICKNESS]} />
      </mesh>
      <mesh position={[1 + endOffset, ROOF_EDGE_CENTER_Y, 0]} material={material}>
        <boxGeometry args={[ROOF_EDGE_THICKNESS, ROOF_EDGE_HEIGHT, 2.04]} />
      </mesh>
      <mesh position={[-1 - endOffset, ROOF_EDGE_CENTER_Y, 0]} material={material}>
        <boxGeometry args={[ROOF_EDGE_THICKNESS, ROOF_EDGE_HEIGHT, 2.04]} />
      </mesh>
    </group>
  );
}

function getGableRoofTransform(selectedOptions) {
  const { roof, width, depth, height, carport, carportWidth, carportSide } = selectedOptions;
  const rotated = roof === "dwuspad przod-tył";
  const extensionScale = carport ? Number(carportWidth) * 0.15 : 0;
  const extensionPosition = carport ? Number(carportWidth) / 2.4 : 0;
  const extendsX = rotated
    ? carportSide === "lewo" || carportSide === "prawo"
    : carportSide === "przod" || carportSide === "tyl";
  const signedPosition =
    carportSide === "przod" || carportSide === "lewo"
      ? extensionPosition
      : carportSide === "tyl" || carportSide === "prawo"
      ? -extensionPosition
      : 0;
  const positionAlongX = carportSide === "przod" || carportSide === "tyl";
  const baseX = Number(rotated ? width : depth) / 6;
  const baseZ = Number(rotated ? depth : width) / 6;

  return {
    position: positionAlongX ? [signedPosition, 0, 0] : [0, 0, signedPosition],
    rotation: rotated ? [0, -Math.PI / 2, 0] : [0, -Math.PI, 0],
    scale: [
      baseX + (extendsX ? extensionScale : 0),
      (1.12 * Number(height)) / 213,
      baseZ + (!extendsX ? extensionScale : 0),
    ],
    planes: GABLE_PLANES,
  };
}

function GableRoofFlashings({ selectedOptions, material }) {
  const transform = getGableRoofTransform(selectedOptions);

  return (
    <group
      name="roof-flashings-gable"
      scale={transform.scale}
      position={transform.position}
      rotation={transform.rotation}
    >
      {transform.planes.map((plane) => (
        <group
          key={plane.name}
          name={`roof-flashing-plane-${plane.name}`}
          position={plane.position}
          rotation={plane.rotation}
          scale={plane.scale}
        >
          <RoofPlaneEdges material={material} endOffset={GABLE_END_OFFSET} />
        </group>
      ))}
    </group>
  );
}

function getSingleSlopeRoofTransform(selectedOptions) {
  const { roof, width, depth, height, carport, carportWidth, carportSide } = selectedOptions;
  const frontBackRoof = roof === "spad tył" || roof === "spad przód";
  const extension = carport ? Number(carportWidth) / 2 : 0;
  const meshX = carportSide === "tyl" ? -extension : carportSide === "przod" ? extension : 0;
  const meshY =
    carportSide === "tyl"
      ? 2.427441120147705 - extension * 0.08
      : carportSide === "przod"
      ? 2.427441120147705 + extension * 0.08
      : 2.427441120147705;
  const meshZ = carportSide === "lewo" ? -0.005770491436123848 + extension : carportSide === "prawo" ? -0.005770491436123848 - extension : -0.005770491436123848;
  const meshScaleX = 3.1314215660095215 + ((carportSide === "tyl" || carportSide === "przod") ? extension : 0);
  const meshScaleZ = 3.1004321575164795 + ((carportSide === "lewo" || carportSide === "prawo") ? extension : 0);
  const rotation =
    roof === "spad przód"
      ? [0, Math.PI, 0]
      : roof === "spad w prawo"
      ? [0, -Math.PI / 2, 0]
      : roof === "spad w lewo"
      ? [0, Math.PI / 2, 0]
      : [0, 0, 0];

  return {
    position: [0, 0, 0],
    rotation,
    scale: [
      Number(frontBackRoof ? depth : width) / 6,
      Number(height) / 213,
      Number(frontBackRoof ? width : depth) / 6,
    ],
    planes: [{
      name: "single",
      position: [meshX, meshY, meshZ],
      rotation: [0, 0, 0.08726645509299334],
      scale: [meshScaleX, 1.1368772983551025, meshScaleZ],
    }],
  };
}

function SingleSlopeRoofFlashings({ selectedOptions, material }) {
  const transform = getSingleSlopeRoofTransform(selectedOptions);

  return (
    <group
      name="roof-flashings-single-slope"
      position={transform.position}
      scale={transform.scale}
      rotation={transform.rotation}
    >
      <group
        position={transform.planes[0].position}
        rotation={transform.planes[0].rotation}
        scale={transform.planes[0].scale}
      >
        <RoofPlaneEdges material={material} />
      </group>
    </group>
  );
}

function transformMatrix({ position, rotation, scale }) {
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...position),
    quaternion,
    new THREE.Vector3(...scale)
  );
}

function roofPlanes(selectedOptions) {
  const isGable = selectedOptions.roof === "dwuspad" || selectedOptions.roof === "dwuspad przod-tył";
  const transform = isGable
    ? getGableRoofTransform(selectedOptions)
    : getSingleSlopeRoofTransform(selectedOptions);
  const rootMatrix = transformMatrix(transform);

  return transform.planes.map((planeTransform) => {
    const matrix = rootMatrix.clone().multiply(transformMatrix(planeTransform));
    const a = new THREE.Vector3(-1, 0, -1).applyMatrix4(matrix);
    const b = new THREE.Vector3(1, 0, -1).applyMatrix4(matrix);
    const c = new THREE.Vector3(-1, 0, 1).applyMatrix4(matrix);
    return new THREE.Plane().setFromCoplanarPoints(a, b, c);
  });
}

function garageCornerHeight(planes, x, z, minimumHeight) {
  const heights = planes
    .filter((plane) => Math.abs(plane.normal.y) > 0.0001)
    .map((plane) => -(
      plane.normal.x * x + plane.normal.z * z + plane.constant
    ) / plane.normal.y);
  const roofHeight = heights.length ? Math.min(...heights) : minimumHeight;
  return Math.max(minimumHeight, roofHeight - 0.018);
}

function RoofFlashings({ selectedOptions, material }) {
  const isGable = selectedOptions.roof === "dwuspad" || selectedOptions.roof === "dwuspad przod-tył";
  return isGable ? (
    <GableRoofFlashings selectedOptions={selectedOptions} material={material} />
  ) : (
    <SingleSlopeRoofFlashings selectedOptions={selectedOptions} material={material} />
  );
}

function GarageCornerTrim({ x, z, height, material, index }) {
  const xDirection = x < 0 ? 1 : -1;
  const zDirection = z < 0 ? 1 : -1;

  return (
    <group name={`garage-flashing-corner-${index}`}>
      <mesh position={[x + xDirection * CORNER_TRIM_WIDTH / 2, height / 2, z]} material={material}>
        <boxGeometry args={[CORNER_TRIM_WIDTH, height, CORNER_TRIM_DEPTH]} />
      </mesh>
      <mesh position={[x, height / 2, z + zDirection * CORNER_TRIM_WIDTH / 2]} material={material}>
        <boxGeometry args={[CORNER_TRIM_DEPTH, height, CORNER_TRIM_WIDTH]} />
      </mesh>
    </group>
  );
}

export default function FlashingSystem({ selectedOptions, roofFlashingMaterial, garageFlashingMaterial }) {
  const width = Number(selectedOptions.width);
  const depth = Number(selectedOptions.depth);
  const wallHeight = Number(selectedOptions.height) / 100;
  const corners = [
    [-depth / 2, width / 2],
    [depth / 2, width / 2],
    [-depth / 2, -width / 2],
    [depth / 2, -width / 2],
  ];
  const planes = roofPlanes(selectedOptions);

  return (
    <group name="flashings-root">
      {selectedOptions.roofFlashing && (
        <RoofFlashings selectedOptions={selectedOptions} material={roofFlashingMaterial} />
      )}
      {selectedOptions.garageFlashing && (
        <group name="garage-flashings">
          {corners.map(([x, z], index) => (
            <GarageCornerTrim
              key={`garage-flashing-${index}`}
              index={index}
              x={x}
              z={z}
              height={garageCornerHeight(planes, x, z, wallHeight)}
              material={garageFlashingMaterial}
            />
          ))}
        </group>
      )}
    </group>
  );
}
