import React from "react";
import { Checkbox, FormControlLabel, MenuItem, Select } from "@mui/material";
import { assetPath } from "../../../utils/assetPath";

function Accessories({ selectedOptions, setSelectedOptions, t }) {
  const { filc, gutter, automatic } = selectedOptions;

  const handleChange = (event) => {
    setSelectedOptions({
      ...selectedOptions,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <div>
      <div className="flex flex-col justify-center items-center">
        <div className="flex">
          <img src={assetPath("images/rynnabp.jpg")} className="w-[200px] flex items-center justify-center" alt="" />
          <FormControlLabel
            control={<Checkbox name="gutter" checked={gutter} onChange={handleChange} inputProps={{ "aria-label": "controlled" }} />}
            label={t("gutters")}
          />
        </div>
        <div className="flex items-center justify-center">
          <img src={assetPath("images/automat.jpg")} className="w-[200px] flex items-center justify-center" alt="" />
          <Select
            value={selectedOptions.countAutomatic}
            onChange={(e) => setSelectedOptions({ ...selectedOptions, countAutomatic: e.target.value })}
          >
            <MenuItem value={1}>1 szt</MenuItem>
            <MenuItem value={2}>2 szt</MenuItem>
            <MenuItem value={3}>3 szt</MenuItem>
          </Select>
          <FormControlLabel
            control={<Checkbox name="automatic" checked={automatic} onChange={handleChange} inputProps={{ "aria-label": "controlled" }} />}
            label={t("gateDrive")}
          />
        </div>
      </div>
      <div className="flex items-center justify-center">
        <img src={assetPath("images/filc.jpeg")} className="w-[150px] flex items-center justify-center" alt="" />
        <FormControlLabel
          control={<Checkbox className="text-black" name="filc" checked={filc} onChange={handleChange} inputProps={{ "aria-label": "controlled" }} />}
          label={t("antiCondensationFelt")}
        />
      </div>
    </div>
  );
}

export default Accessories;
