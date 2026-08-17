export function usesStandingSeamPrice(selectedOptions = {}) {
  return (
    selectedOptions.emboss === "na_rabek" ||
    selectedOptions.roofType === "na_rabek"
  );
}
