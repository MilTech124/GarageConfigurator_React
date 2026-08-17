import { Checkbox, FormControlLabel, MenuItem, Select } from "@mui/material";
import { FLASHING_COLORS } from "../domain/flashingColors.js";

export default function FlashingControl({
  kind,
  selectedOptions,
  setSelectedOptions,
  label,
  inheritedLabel,
  colorLabel,
  o = (value) => value,
}) {
  const enabledKey = `${kind}Flashing`;
  const modeKey = `${kind}FlashingColorMode`;
  const colorKey = `${kind}FlashingColor`;
  const colorRalKey = `${kind}FlashingColorRal`;
  const enabled = Boolean(selectedOptions[enabledKey]);
  const selectedValue = selectedOptions[modeKey] === "custom" ? selectedOptions[colorKey] : kind;

  const handleColorChange = (event) => {
    const value = event.target.value;
    const selectedColor = FLASHING_COLORS.find((item) => item.name === value);
    setSelectedOptions((current) => ({
      ...current,
      [modeKey]: value === kind ? kind : "custom",
      [colorKey]: selectedColor?.name || "",
      [colorRalKey]: selectedColor?.ral || null,
    }));
  };

  return (
    <div className="mt-3 w-full rounded-md border border-gray-200 p-3">
      <FormControlLabel
        control={
          <Checkbox
            checked={enabled}
            onChange={(event) =>
              setSelectedOptions((current) => ({ ...current, [enabledKey]: event.target.checked }))
            }
            inputProps={{ "aria-label": label }}
          />
        }
        label={label}
      />
      {enabled && (
        <Select fullWidth size="small" value={selectedValue} onChange={handleColorChange} aria-label={`${label} - ${colorLabel}`}>
          <MenuItem value={kind}>{inheritedLabel}</MenuItem>
          {FLASHING_COLORS.map((item) => (
            <MenuItem key={`${kind}-${item.name}`} value={item.name}>
              <span
                className="mr-2 inline-block h-4 w-4 rounded-full border border-gray-300 align-middle"
                style={{ backgroundColor: item.ral }}
              />
              {o(item.name)}
            </MenuItem>
          ))}
        </Select>
      )}
    </div>
  );
}
