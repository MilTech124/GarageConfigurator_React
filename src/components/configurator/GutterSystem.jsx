import * as THREE from "three";
import { getGutterSegments, normalizeRoofKey } from "./domain/gutters.js";

const DOWNSPOUT_RADIUS = 0.052;
const DOWNSPOUT_BOTTOM = 0.08;

function getGutterHeight(selectedOptions) {
  const heightScale = Number(selectedOptions.height) / 213;
  const roofKey = normalizeRoofKey(selectedOptions.roof);
  const isGable = roofKey === "dwuspad" || roofKey === "dwuspad przod-tyl";
  const lowSide = {
    "spad tyl": "tyl",
    "spad przod": "przod",
    "spad w lewo": "lewo",
    "spad w prawo": "prawo",
  }[roofKey];
  const loweredByCarportSlope =
    selectedOptions.carport &&
    normalizeRoofKey(selectedOptions.carportSide) === lowSide
      ? Number(selectedOptions.carportWidth || 0) * 0.08
      : 0;

  return ((isGable ? 2.32 : 2.19) - loweredByCarportSlope) * heightScale;
}

function getDownspoutPosition(segment, gutterPosition) {
  const endInset = 0.08;

  if (segment.axis === "x") {
    return [segment.x - segment.length / 2 + endInset, gutterPosition[2]];
  }

  return [gutterPosition[0], segment.z - segment.length / 2 + endInset];
}

function GutterMaterial({ color, doubleSided = false }) {
  return (
    <meshStandardMaterial
      color={color || "#272C38"}
      roughness={0.48}
      metalness={0.72}
      side={doubleSided ? THREE.DoubleSide : THREE.FrontSide}
    />
  );
}

function Downspout({ segment, gutterPosition, color }) {
  const [x, z] = getDownspoutPosition(segment, gutterPosition);
  const length = Math.max(gutterPosition[1] - DOWNSPOUT_BOTTOM, 0.1);
  const isFrontBack = segment.side === "przod" || segment.side === "tyl";
  const outletRotation = isFrontBack ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0];
  const outletDirection = {
    przod: [1, 0],
    tyl: [-1, 0],
    lewo: [0, 1],
    prawo: [0, -1],
  }[segment.side] || [0, 0];

  return (
    <group name={`downspout-${segment.id}`}>
      <mesh position={[x, DOWNSPOUT_BOTTOM + length / 2, z]}>
        <cylinderGeometry args={[DOWNSPOUT_RADIUS, DOWNSPOUT_RADIUS, length, 16]} />
        <GutterMaterial color={color} />
      </mesh>
      <mesh position={[x, gutterPosition[1] - 0.015, z]}>
        <sphereGeometry args={[DOWNSPOUT_RADIUS * 1.18, 16, 10]} />
        <GutterMaterial color={color} />
      </mesh>
      <mesh
        position={[
          x + outletDirection[0] * 0.07,
          DOWNSPOUT_BOTTOM,
          z + outletDirection[1] * 0.07,
        ]}
        rotation={outletRotation}
      >
        <cylinderGeometry args={[DOWNSPOUT_RADIUS, DOWNSPOUT_RADIUS, 0.18, 16]} />
        <GutterMaterial color={color} />
      </mesh>
    </group>
  );
}

function GutterSegment({ segment, gutterHeight, color }) {
  const isXAxis = segment.axis === "x";
  const outwardX = segment.side === "przod" ? 0.09 : segment.side === "tyl" ? -0.09 : 0;
  const outwardZ = segment.side === "lewo" ? 0.09 : segment.side === "prawo" ? -0.09 : 0;
  const position = [segment.x + outwardX, gutterHeight, segment.z + outwardZ];
  const rotation = isXAxis
    ? [0, 0, -Math.PI / 2]
    : [Math.PI / 2, -Math.PI / 2, 0];

  return (
    <group>
      <mesh name={`gutter-${segment.id}`} position={position} rotation={rotation}>
        <cylinderGeometry args={[segment.radius, segment.radius, segment.length, 20, 1, true, 0, Math.PI]} />
        <GutterMaterial color={color} doubleSided />
      </mesh>
      <Downspout segment={segment} gutterPosition={position} color={color} />
    </group>
  );
}

export default function GutterSystem({ selectedOptions }) {
  if (!selectedOptions.gutter) return null;

  const segments = getGutterSegments(selectedOptions);
  const gutterHeight = getGutterHeight(selectedOptions);

  return (
    <group name="gutters-root">
      {segments.map((segment) => (
        <GutterSegment
          key={segment.id}
          segment={segment}
          gutterHeight={gutterHeight}
          color={selectedOptions.roofColorRal}
        />
      ))}
    </group>
  );
}
