import React, { useEffect } from "react";
import { Select, InputLabel, FormControl, MenuItem } from "@mui/material";
import { variable } from "../Variable";
import Button from '@mui/material/Button';

function CarportSetting({ selectedOptions, setSelectedOptions, t, o }) {
  const carportSides = selectedOptions.carportSides;
  const carportSide = selectedOptions.carportSide;
  const carportSides2 = selectedOptions.carportSides2;
  const roof = selectedOptions.roof;
  const roofKey = roof === "spad tył" || roof === "spad tyĹ‚" ? "spad tyl" : roof;

  const setCarportSides = (e) => {
    setSelectedOptions({
      ...selectedOptions,
      carportSides: { ...carportSides, [e.target.name]: !carportSides[e.target.name] }
    });
  };

  const setCarportSides2 = (e) => {
    setSelectedOptions({
      ...selectedOptions,
      carportSides2: { ...carportSides2, [e.target.name]: !carportSides2[e.target.name] }
    });
  };

  const setCarportSideName = (name) => {
    setSelectedOptions({ ...selectedOptions, carportSideName: name });
  };

  useEffect(() => {
    if (roof === "spad przód" || roof === "spad przĂłd") {
      (carportSide === "przod" && setCarportSideName("tyl")) ||
      (carportSide === "tyl" && setCarportSideName("przod")) ||
      (carportSide === "lewo" && setCarportSideName("prawo")) ||
      (carportSide === "prawo" && setCarportSideName("lewo"));
    }
    if (roofKey === "spad w lewo") {
      (carportSide === "przod" && setCarportSideName("prawo")) ||
      (carportSide === "tyl" && setCarportSideName("lewo")) ||
      (carportSide === "lewo" && setCarportSideName("przod")) ||
      (carportSide === "prawo" && setCarportSideName("tyl"));
    }
    if (roofKey === "spad w prawo") {
      (carportSide === "przod" && setCarportSideName("lewo")) ||
      (carportSide === "tyl" && setCarportSideName("prawo")) ||
      (carportSide === "lewo" && setCarportSideName("tyl")) ||
      (carportSide === "prawo" && setCarportSideName("przod"));
    }
    if (roofKey === "spad tyl") {
      (carportSide === "przod" && setCarportSideName("przod")) ||
      (carportSide === "tyl" && setCarportSideName("tyl")) ||
      (carportSide === "lewo" && setCarportSideName("lewo")) ||
      (carportSide === "prawo" && setCarportSideName("prawo"));
    }
  }, [carportSide]);

  return (
    <div className="flex flex-col">
      <h4 className="text-center text-xl p-2">{t("addCarport")}</h4>
      <div className="flex items-center">
        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
          <InputLabel id="demo-simple-select-standard-label">{t("addCarport")}</InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            value={selectedOptions.carport}
            onChange={(e) => setSelectedOptions({ ...selectedOptions, carport: e.target.value })}
            label={t("addCarport")}
          >
            <MenuItem value={false}>{t("no")}</MenuItem>
            <MenuItem value={true}>{t("yes")}</MenuItem>
          </Select>
        </FormControl>
      </div>

      {selectedOptions.carport && (
        <>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-standard-label">{t("side")}</InputLabel>
            <Select
              labelId="demo-simple-select-standard-label"
              id="demo-simple-select-standard"
              value={selectedOptions.carportSide}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, carportSide: e.target.value })}
              label={t("side")}
            >
              <MenuItem value={"lewo"}>{o("lewo")}</MenuItem>
              <MenuItem value={"prawo"}>{o("prawo")}</MenuItem>
              <MenuItem value={"przod"}>{o("przod")}</MenuItem>
              <MenuItem value={"tyl"}>{o("tyl")}</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-standard-label">{t("size")}</InputLabel>
            <Select
              labelId="demo-simple-select-standard-label"
              id="demo-simple-select-standard"
              value={selectedOptions.carportWidth}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, carportWidth: e.target.value })}
              label={t("width")}
            >
              {variable.carportWidth.map((width) => (
                <MenuItem key={width} value={width}>{width}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-standard-label">{t("claddingType")}</InputLabel>
            <Select
              labelId="demo-simple-select-standard-label"
              id="demo-simple-select-standard"
              value={selectedOptions.carportType}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, carportType: e.target.value })}
              label={t("claddingType")}
            >
              <MenuItem value={"brak"}>{o("brak")}</MenuItem>
              <MenuItem value={"oblachowane"}>{o("oblachowane")}</MenuItem>
              <MenuItem value={"azury"}>{o("azury")}</MenuItem>
              <MenuItem value={"mix"}>{o("mix")}</MenuItem>
            </Select>
          </FormControl>
        </>
      )}

      {(selectedOptions.carport && selectedOptions.carportType !== "brak") && (
        <div className="flex flex-col items-center justify-center">
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <Button disabled={carportSides2.przod ||((roof==="dwuspad" || roofKey==="spad tyl") && carportSide==="przod") } variant={selectedOptions.carportSides.przod ? "contained":"outlined"} name="przod" onClick={(e) => setCarportSides(e)}>{o("przod")}</Button>
          </FormControl>
          <div className="flex">
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
              <Button disabled={carportSides2.lewo ||((roof==="dwuspad" || roofKey==="spad tyl") && carportSide==="prawo") } variant={selectedOptions.carportSides.lewo ? "contained":"outlined"} name="lewo" onClick={(e) => setCarportSides(e)}>{o("lewo")}</Button>
            </FormControl>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
              <Button disabled={carportSides2.prawo ||((roof==="dwuspad" || roofKey==="spad tyl") && carportSide==="lewo") } variant={selectedOptions.carportSides.prawo ? "contained":"outlined"} name="prawo" onClick={(e) => setCarportSides(e)}>{o("prawo")}</Button>
            </FormControl>
          </div>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <Button disabled={carportSides2.tyl ||((roof==="dwuspad" || roofKey==="spad tyl") && carportSide==="tyl") } variant={selectedOptions.carportSides.tyl ? "contained":"outlined"} name="tyl" onClick={(e) => setCarportSides(e)}>{o("tyl")}</Button>
          </FormControl>
        </div>
      )}

      {(selectedOptions.carport && selectedOptions.carportType === "mix") && (
        <div className="flex flex-col items-center justify-center">
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <Button disabled={carportSides.przod || (carportSide==="tyl")} variant={selectedOptions.carportSides2.przod ? "contained":"outlined"} name="przod" onClick={(e) => setCarportSides2(e)}>{o("przod")}</Button>
          </FormControl>
          <div className="flex">
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
              <Button disabled={carportSides.lewo||carportSide==="prawo"} variant={selectedOptions.carportSides2.lewo ? "contained":"outlined"} name="lewo" onClick={(e) => setCarportSides2(e)}>{o("lewo")}</Button>
            </FormControl>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
              <Button disabled={carportSides.prawo||carportSide==="lewo"} variant={selectedOptions.carportSides2.prawo ? "contained":"outlined"} name="prawo" onClick={(e) => setCarportSides2(e)}>{o("prawo")}</Button>
            </FormControl>
          </div>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <Button disabled={carportSides.tyl||carportSide==="przod"} variant={selectedOptions.carportSides2.tyl ? "contained":"outlined"} name="tyl" onClick={(e) => setCarportSides2(e)}>{o("tyl")}</Button>
          </FormControl>
        </div>
      )}
    </div>
  );
}

export default CarportSetting;
