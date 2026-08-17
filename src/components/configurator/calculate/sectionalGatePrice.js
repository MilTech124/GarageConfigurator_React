export const SECTIONAL_GATE_TYPE = "segmentowa";

export function expandSectionalGateCatalog(catalog) {
  if (Array.isArray(catalog)) return catalog;
  const widths = catalog?.widthsMm || [];
  return (catalog?.rows || []).flatMap((row) =>
    widths.flatMap((widthMm, index) => {
      const price = row.prices?.[index];
      return Number(price) > 0
        ? [{ widthMm: Number(widthMm), heightMm: Number(row.heightMm), price: Number(price) }]
        : [];
    })
  );
}

export function findSectionalGatePrice(prices, widthMeters, heightMm) {
  const widthMm = Math.round(Number(widthMeters) * 1000);
  const rawHeight = Number(heightMm);
  const height = Math.round(rawHeight < 1000 ? rawHeight * 10 : rawHeight);
  const row = (prices || []).find(
    (item) => Number(item.widthMm) === widthMm && Number(item.heightMm) === height
  );
  return row && Number(row.price) > 0 ? Number(row.price) : null;
}

export function getSectionalGateDimensions(prices) {
  const widths = [...new Set((prices || []).map((item) => Number(item.widthMm)).filter(Boolean))].sort((a, b) => a - b);
  const heights = [...new Set((prices || []).map((item) => Number(item.heightMm)).filter(Boolean))].sort((a, b) => a - b);
  return { widths, heights };
}

export function isSectionalGateSelectionValid(prices, widthMeters, heightMm) {
  return findSectionalGatePrice(prices, widthMeters, heightMm) !== null;
}

export function calculateSectionalGateAdjustment({
  gateType,
  gateWidth,
  gateHeight,
  prices,
  includedUpAndOverGate = 0,
}) {
  if (gateType !== SECTIONAL_GATE_TYPE) return { valid: true, amount: 0 };

  const tablePrice = findSectionalGatePrice(prices, gateWidth, gateHeight);
  if (tablePrice === null) return { valid: false, amount: 0 };

  return {
    valid: true,
    amount: tablePrice - (Number(includedUpAndOverGate) || 0),
  };
}

const normalizedGateType = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .replace(/[^a-z0-9]/g, "");

export function calculateGateAdjustments({
  gates,
  prices,
  includedUpAndOverGate = 0,
  doubleLeafAdjustment = 0,
}) {
  let amount = 0;
  let valid = true;
  let nonSectionalCount = 0;

  for (const gate of gates || []) {
    if (gate.type !== SECTIONAL_GATE_TYPE) nonSectionalCount += 1;
    if (normalizedGateType(gate.type) === "dwuskrzydlowa") amount += Number(doubleLeafAdjustment) || 0;

    const sectional = calculateSectionalGateAdjustment({
      gateType: gate.type,
      gateWidth: gate.width,
      gateHeight: gate.height,
      prices,
      includedUpAndOverGate,
    });
    valid = valid && sectional.valid;
    amount += sectional.amount;
  }

  return { amount, valid, nonSectionalCount };
}
