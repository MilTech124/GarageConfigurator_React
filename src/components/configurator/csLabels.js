const csLabels = {
  // Generic directions/positions
  pion: "Svislý",
  poziom: "Vodorovný",
  szerokie: "Široké",
  "wąskie": "Úzké",
  "wÄ…skie": "Úzké",
  lewe: "Levé",
  prawe: "Pravé",
  lewo: "Levá",
  prawo: "Pravá",
  przod: "Přední",
  "przód": "Přední",
  "przĂłd": "Přední",
  tyl: "Zadní",
  "tył": "Zadní",
  "tyĹ‚": "Zadní",

  // Roof options
  "spad tył": "Spád dozadu",
  "spad tyĹ‚": "Spád dozadu",
  "spad tyl": "Spád dozadu",
  "spad przód": "Spád dopředu",
  "spad przĂłd": "Spád dopředu",
  "spad w lewo": "Spád doleva",
  "spad w prawo": "Spád doprava",
  dwuspad: "Dvojitý spád",
  "dwuspad przod-tył": "Dvojitý spád předek-zadek",
  "dwuspad przod-tyĹ‚": "Dvojitý spád předek-zadek",
  trapezowa: "Trapézový plech",
  blachodachówka: "Střešní taškový plech",
  "blachodachĂłwka": "Střešní taškový plech",

  // Gate options
  dwuskrzydłowa: "Dvoukřídlá",
  "dwuskrzydĹ‚owa": "Dvoukřídlá",
  uchylna: "Výklopná",
  segmentowa: "Sekční",

  // Carport cladding
  brak: "Bez opláštění",
  oblachowane: "Opláštěné",
  azury: "Žaluziové",
  mix: "Kombinace",

  // Colors
  Ocynk: "Pozink",
  Orzech: "Ořech",
  "Złoty Dąb": "Zlaty dub",
  "ZĹ‚oty DÄ…b": "Zlaty dub",
  "Biały 9010": "Bílá 9010",
  "BiaĹ‚y 9010": "Bílá 9010",
  "Szary 9002": "Šedá 9002",
  "Srebrny 9006": "Stříbrná 9006",
  "Piaskowy 1002": "Písková 1002",
  "Ciemna Zieleń 6029": "Tmavě zelená 6029",
  "Ciemna ZieleĹ„ 6029": "Tmavě zelená 6029",
  "Jasna Zieleń 6029": "Světle zelená 6029",
  "Jasna ZieleĹ„ 6029": "Světle zelená 6029",
  "Antracyt 7016": "Antracit 7016",
  Antracyt: "Antracit",
  "Ciemny Brąz 8017": "Tmavě hnědá 8017",
  "Ciemny BrÄ…z 8017": "Tmavě hnědá 8017",
  "Brąz Jasny 8004": "Světle hnědá 8004",
  "BrÄ…z Jasny 8004": "Světle hnědá 8004",
  Ceglasty: "Cihlová",
  "Czerwony 3011": "Červená 3011",
  "Wisniowy 3005": "Višňová 3005",
  "Czarny 9005": "Černá 9005",
};

export function getCsLabel(value) {
  return csLabels[value] ?? value;
}

