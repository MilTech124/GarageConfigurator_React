import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Select,
  InputLabel,
  FormControl,
  MenuItem,
  Slider,
} from "@mui/material";
import { variable } from "../Variable";

function DoorSettings({ selectedOptions, setSelectedOptions, t, o }) {
  const [countDoor, setCountDoor] = useState(0);
  const { width, depth } = selectedOptions;

  const doorColor = [
    { name: "Złoty Dąb", url: "./konfigurator/jasny-dab.webp" },
    { name: "Orzech", url: "./konfigurator/orzech.png" },
    { name: "Antracyt 7016", ral: "#272C38" },
    { name: "Ciemny BrÄ…z 8017", ral: "#2F1D1D" },
    { name: "BrÄ…z Jasny 8004", ral: "#85392C" },
    { name: "Ciemna ZieleĹ„ 6029", ral: "#0B3821" },
    { name: "Jasna ZieleĹ„ 6029", ral: "#117825" },
    { name: "BiaĹ‚y 9010", ral: "#FBFFFF" },
    { name: "Szary 9002", ral: "#F2EFE8" },
    { name: "Srebrny 9006", ral: "#A7ABB6" },
    { name: "Piaskowy 1002", ral: "#D7B075" },
    { name: "Czerwony 3011", ral: "#781416" },
    { name: "Wisniowy 3005", ral: "#4F121A" },
    { name: "Czarny 9005", ral: "#2C2C2C" },
  ];

  const handleDoor = (action) => {
    if (action === "+" && countDoor < 5) {
      setCountDoor(countDoor + 1);
      const newDoor = new door("100x190", "lewe", "Złoty Dąb");
      setSelectedOptions({
        ...selectedOptions,
        door: [...selectedOptions.door, newDoor],
      });
      toast.success(t("doorsAdded"));
    } else if (action === "-" && countDoor > 0) {
      setCountDoor(countDoor - 1);
      setSelectedOptions({
        ...selectedOptions,
        door: selectedOptions.door.slice(0, -1),
      });
      toast.error(t("doorsRemoved"));
    }
  };

  function door(size, type, color) {
    this.size = size;
    this.type = type;
    this.color = color;
    this.position = "lewo";
    this.positionValue = 20;
  }

  return (
    <div>
      <div className="flex flex-col justify-center">
        <p className="text-center">{t("addOrRemoveDoors")}</p>
        <div className="flex flex-col justify-center items-center">
          <p className="text-2xl font-bold">{countDoor}</p>
          <div className="flex gap-2">
            <button className="bg-slate-900 text-white w-14 h-14 font-bold rounded-full hover:bg-slate-600" onClick={() => handleDoor("-")}>
              {t("remove")}
            </button>
            <button className="bg-slate-900 text-white w-14 h-14 font-bold rounded-full hover:bg-slate-600" onClick={() => handleDoor("+")}>
              {t("add")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {selectedOptions.door.map((door, index) => (
          <div key={index} className="flex flex-wrap gap-2 justify-between p-2 mt-2 bg-slate-200">
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="demo-simple-select-standard-label">{t("doorType")}</InputLabel>
              <Select
                labelId="demo-simple-select-standard-label"
                id="demo-simple-select-standard"
                value={door.type}
                onChange={(e) => {
                  setSelectedOptions({
                    ...selectedOptions,
                    door: selectedOptions.door.map((item, i) =>
                      i === index ? { ...item, type: e.target.value } : item
                    ),
                  });
                }}
                label={t("doorType")}
              >
                {variable.doorType.map((type) => (
                  <MenuItem key={type} value={type}>{o(type)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <div className="flex w-full justify-between">
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="demo-simple-select-standard-label">{t("color")}</InputLabel>
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={door.color}
                  onChange={(e) => {
                    const colorRal = doorColor.find(color => color.name === e.target.value)?.ral;
                    setSelectedOptions({
                      ...selectedOptions,
                      door: selectedOptions.door.map((item, i) =>
                        i === index ? { ...item, color: e.target.value, colorRal: colorRal } : item
                      ),
                    });
                  }}
                  label={t("color")}
                >
                  {doorColor.map((color) => (
                    <MenuItem key={color.name} value={color.name}>{o(color.name)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="demo-simple-select-standard-label">{t("position")}</InputLabel>
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={door.position}
                  onChange={(e) => {
                    setSelectedOptions({
                      ...selectedOptions,
                      door: selectedOptions.door.map((item, i) =>
                        i === index ? { ...item, position: e.target.value } : item
                      ),
                    });
                  }}
                  label={t("position")}
                >
                  {variable.doorPosition.map((position) => (
                    <MenuItem key={position} value={position}>{o(position)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <FormControl variant="standard" sx={{ m: 1, minWidth: 350 }}>
              <InputLabel id="demo-simple-select-standard-label">{t("position")}</InputLabel>
              <Slider
                value={door.positionValue}
                onChange={(e) => {
                  setSelectedOptions({
                    ...selectedOptions,
                    door: selectedOptions.door.map((item, i) =>
                      i === index ? { ...item, positionValue: e.target.value } : item
                    ),
                  });
                }}
                min={0}
                max={door.position === "przod" || door.position === "tył" || door.position === "tyl" || door.position === "tyĹ‚" ? width * 100 - 100 : depth * 100 - 100}
                step={10}
                aria-label="Default"
                valueLabelDisplay="auto"
              />
            </FormControl>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoorSettings;
