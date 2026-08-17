import { assetPath } from "../../../utils/assetPath";
import ImageOptionCard from "./ImageOptionCard";

const GATE_TYPES = [
  {
    value: "dwuskrzydłowa",
    image: assetPath("konfigurator/dwuskrzydlowa.jpg"),
  },
  {
    value: "uchylna",
    image: assetPath("konfigurator/uchylna.jpg"),
  },
  {
    value: "segmentowa",
    image: assetPath("konfigurator/segmentowa.jpg"),
  },
];

function GateTypeSelector({ label, value, onChange, translateOption, sectionalDisabled = false }) {
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-sm font-medium text-slate-800">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        {GATE_TYPES.map((type) => (
          <ImageOptionCard
            key={type.value}
            value={type.value}
            label={translateOption(type.value)}
            image={type.image}
            selected={value === type.value}
            disabled={type.value === "segmentowa" && sectionalDisabled}
            onSelect={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}

export default GateTypeSelector;
