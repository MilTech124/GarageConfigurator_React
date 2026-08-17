export const FLASHING_COLORS = [
  { name: "Ocynk", ral: "#A7ABA7" },
  { name: "Biały 9010", ral: "#FBFFFF" },
  { name: "Szary 9002", ral: "#F2EFE8" },
  { name: "Srebrny 9006", ral: "#A7ABB6" },
  { name: "Piaskowy 1002", ral: "#D7B075" },
  { name: "Antracyt 7016", ral: "#272C38" },
  { name: "Ciemny Brąz 8017", ral: "#2F1D1D" },
  { name: "Brąz Jasny 8004", ral: "#85392C" },
  { name: "Ciemna Zieleń 6029", ral: "#0B3821" },
  { name: "Jasna Zieleń 6029", ral: "#117825" },
  { name: "Czerwony 3011", ral: "#781416" },
  { name: "Ceglasty", ral: "#824C40" },
  { name: "Wisniowy 3005", ral: "#4F121A" },
  { name: "Czarny 9005", ral: "#2C2C2C" },
];

export function resolveFlashingColor(mode, customRal, inheritedRal, fallback = "#272C38") {
  return mode === "custom" ? customRal || fallback : inheritedRal || fallback;
}
