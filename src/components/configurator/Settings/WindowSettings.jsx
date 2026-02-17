import { useState } from "react";
import { toast } from "react-toastify";
import {
  Select,
  InputLabel,
  FormControl,
  MenuItem,
  Slider,
} from "@mui/material";
import { variable } from "../Variable";

function WindowSettings({ selectedOptions, setSelectedOptions, t, o }) {
  const [countWindow, setCountWindow] = useState(0);
  const { width, depth } = selectedOptions;

  const handleWindow = (action) => {
    if (action === "+" && countWindow < 5) {
      setCountWindow(countWindow + 1);
      const newWindow = new window("80x60");
      setSelectedOptions({
        ...selectedOptions,
        window: [...selectedOptions.window, newWindow],
      });
      toast.success(t("windowAdded"));
    } else if (action === "-" && countWindow > 0) {
      setCountWindow(countWindow - 1);
      setSelectedOptions({
        ...selectedOptions,
        window: selectedOptions.window.slice(0, -1),
      });
      toast.error(t("windowRemoved"));
    }
  };

  function window(size) {
    this.size = size;
    this.position = "lewo";
    this.positionValue = 0;
  }

  return (
    <div>
      <div className="flex flex-col justify-center">
        <p className="text-center">{t("addOrRemoveWindows")}</p>
        <div className="flex flex-col justify-center items-center">
          <p className="text-2xl font-bold">{countWindow}</p>
          <div className="flex gap-2">
            <button className="bg-slate-900 text-white w-14 h-14 font-bold rounded-full hover:bg-slate-600" onClick={() => handleWindow("-")}>{t("remove")}</button>
            <button className="bg-slate-900 text-white w-14 h-14 font-bold rounded-full hover:bg-slate-600" onClick={() => handleWindow("+")}>{t("add")}</button>
          </div>
        </div>
      </div>
      {selectedOptions.window.map((window, index) => (
        <div className="bg-slate-200 mb-4 py-2" key={index}>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-helper-label">{t("position")}</InputLabel>
            <Select
              labelId="demo-simple-select-helper-label"
              id="demo-simple-select-helper"
              value={window.position}
              label={t("position")}
              onChange={(e) => {
                setSelectedOptions({
                  ...selectedOptions,
                  window: selectedOptions.window.map((window, i) =>
                    i === index ? { ...window, position: e.target.value } : window
                  ),
                });
              }}
            >
              {variable.windowPosition.map((position) => (
                <MenuItem key={position} value={position}>{o(position)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 350 }}>
            <InputLabel id="demo-simple-select-standard-label">{t("position")}</InputLabel>
            <Slider
              value={window.positionValue}
              onChange={(e) => {
                setSelectedOptions({
                  ...selectedOptions,
                  window: selectedOptions.window.map((item, i) =>
                    i === index ? { ...item, positionValue: e.target.value } : item
                  ),
                });
              }}
              min={0}
              max={window.position === "przod" || window.position === "tył" || window.position === "tyl" || window.position === "tyĹ‚" ? width * 100 - 100 : depth * 100 - 100}
              step={10}
              aria-label="Default"
              valueLabelDisplay="auto"
            />
          </FormControl>
        </div>
      ))}
    </div>
  );
}

export default WindowSettings;
