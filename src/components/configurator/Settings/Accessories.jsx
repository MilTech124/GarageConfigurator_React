import React from "react";
import { Checkbox, FormControlLabel } from "@mui/material";

function Accessories({ selectedOptions, setSelectedOptions }) {
  const { filc, gutter, automatic } = selectedOptions;

  const handleChange = (event) => {
    setSelectedOptions({
      ...selectedOptions,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <div>
      <h4 className="bg-slate-900 p-2 mt-5">Akcesoria</h4>
      <div className="flex justify-around">
        <div>
          <img
            src="/image/rynnaPCV.png"
            className="w-[100px] flex items-center justify-center"
            alt=""
          />
          <FormControlLabel
            control={
              <Checkbox
                name="gutter"
                checked={gutter}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
              />
            }
            label="Rynny"
          />
        </div>
        <div>
          <img
            src="/image/automat.png"
            className="w-[100px] flex items-center justify-center"
            alt=""
          />
          <FormControlLabel
            control={
              <Checkbox
                name="automatic"
                checked={automatic}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
              />
            }
            label="Automat do bramy"
          />
        </div>        
      </div>
      <div className="flex flex-col items-center  justify-around">
          <img
            src="/image/filc.jpg"
            className="w-[150px] flex items-center justify-center"
            alt=""
          />
          <FormControlLabel
            control={
              <Checkbox
              className="text-black"
                name="filc"
                checked={filc}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
              />
            }
            label="Filc antykondensacyjny"
          />
        </div>
    </div>
  );
}

export default Accessories;
