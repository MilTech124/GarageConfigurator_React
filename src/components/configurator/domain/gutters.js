export function normalizeRoofKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const extendedLength = (base, extension, shouldExtend) =>
  Number(base) + (shouldExtend ? Number(extension) || 0 : 0);

/**
 * Returns the physical roof-eave segments that receive gutters.
 * Coordinates follow the model convention: x = front/back, z = left/right.
 */
export function getGutterSegments({
  width,
  depth,
  roof,
  carport = false,
  carportWidth = 0,
  carportSide = "",
}) {
  const roofKey = normalizeRoofKey(roof);
  const hasCarport = Boolean(carport);
  const side = normalizeRoofKey(carportSide);
  const common = { radius: 0.075 };

  if (roofKey === "dwuspad") {
    const length = extendedLength(
      depth,
      carportWidth,
      hasCarport && (side === "przod" || side === "tyl")
    );
    const xOffset = hasCarport
      ? side === "przod"
        ? Number(carportWidth) / 2
        : side === "tyl"
        ? -Number(carportWidth) / 2
        : 0
      : 0;
    return [
      {
        ...common,
        id: "dual-left",
        axis: "x",
        side: "lewo",
        length,
        x: xOffset,
        z: Number(width) / 2 + (hasCarport && side === "lewo" ? Number(carportWidth) : 0),
      },
      {
        ...common,
        id: "dual-right",
        axis: "x",
        side: "prawo",
        length,
        x: xOffset,
        z: -Number(width) / 2 - (hasCarport && side === "prawo" ? Number(carportWidth) : 0),
      },
    ];
  }

  if (roofKey === "dwuspad przod-tyl") {
    const length = extendedLength(
      width,
      carportWidth,
      hasCarport && (side === "lewo" || side === "prawo")
    );
    const zOffset = hasCarport
      ? side === "lewo"
        ? Number(carportWidth) / 2
        : side === "prawo"
        ? -Number(carportWidth) / 2
        : 0
      : 0;
    return [
      {
        ...common,
        id: "dual-front",
        axis: "z",
        side: "przod",
        length,
        x: Number(depth) / 2 + (hasCarport && side === "przod" ? Number(carportWidth) : 0),
        z: zOffset,
      },
      {
        ...common,
        id: "dual-back",
        axis: "z",
        side: "tyl",
        length,
        x: -Number(depth) / 2 - (hasCarport && side === "tyl" ? Number(carportWidth) : 0),
        z: zOffset,
      },
    ];
  }

  if (roofKey === "spad tyl" || roofKey === "spad przod") {
    const length = extendedLength(
      width,
      carportWidth,
      hasCarport && (side === "lewo" || side === "prawo")
    );
    const zOffset = hasCarport
      ? side === "lewo"
        ? Number(carportWidth) / 2
        : side === "prawo"
        ? -Number(carportWidth) / 2
        : 0
      : 0;
    const lowSide = roofKey === "spad tyl" ? "tyl" : "przod";
    return [{
      ...common,
      id: `single-${lowSide}`,
      axis: "z",
      side: lowSide,
      length,
      x:
        lowSide === "tyl"
          ? -Number(depth) / 2 - (hasCarport && side === "tyl" ? Number(carportWidth) : 0)
          : Number(depth) / 2 + (hasCarport && side === "przod" ? Number(carportWidth) : 0),
      z: zOffset,
    }];
  }

  if (roofKey === "spad w lewo" || roofKey === "spad w prawo") {
    const length = extendedLength(
      depth,
      carportWidth,
      hasCarport && (side === "przod" || side === "tyl")
    );
    const xOffset = hasCarport
      ? side === "przod"
        ? Number(carportWidth) / 2
        : side === "tyl"
        ? -Number(carportWidth) / 2
        : 0
      : 0;
    const lowSide = roofKey === "spad w lewo" ? "lewo" : "prawo";
    return [{
      ...common,
      id: `single-${lowSide}`,
      axis: "x",
      side: lowSide,
      length,
      x: xOffset,
      z:
        lowSide === "lewo"
          ? Number(width) / 2 + (hasCarport && side === "lewo" ? Number(carportWidth) : 0)
          : -Number(width) / 2 - (hasCarport && side === "prawo" ? Number(carportWidth) : 0),
    }];
  }

  return [];
}

export function getGutterLength(config) {
  return getGutterSegments(config).reduce((sum, segment) => sum + segment.length, 0);
}
