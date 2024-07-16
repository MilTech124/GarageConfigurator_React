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
      
      <div className="flex flex-col justify-center items-center">
        <div className="flex">
          <img          
            src="/images/rynnabp.jpg"
            className="w-[200px] flex items-center justify-center"
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
        <div className="flex items-center justify-center">
          <img
            src="/images/automat.jpg"
            className="w-[200px] flex items-center justify-center"
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
      <div className="flex items-center  justify-center">
          <img
            src="/images/filc.jpeg"
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
