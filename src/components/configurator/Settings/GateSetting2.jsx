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
import { assetPath } from "../../../utils/assetPath";
import { getPrices, getPriceDataSync } from "../calculate/garagePrice";
import { findSectionalGatePrice } from "../calculate/sectionalGatePrice";
import GateTypeSelector from "./GateTypeSelector";

function GateSetting2({ selectedOptions, setSelectedOptions, t, o }) {
  const [gateCount, setGateCount] = useState(2);
  const {
    
    width,
    height,
    gate,
    gateColorRal1,
    gateColor1,
    gateColor2,
    gateColor3,
    gateColorRal2,
    gateColorRal3,
    gatePositionValue1,
    gatePositionValue2,
    gatePositionValue3,
    gateWidth1,
    gateWidth2,
    gateWidth3,
    gateHeight1,
    gateHeight2,
    gateHeight3,
    gateType1,
    gateType2,
    gateType3,
  } = selectedOptions;
  const [sectionalPrices, setSectionalPrices] = useState(
    () => getPriceDataSync().sectionalGates || []
  );
  const safeGateWidth1 = Math.min(Number(gateWidth1) || width, width);
  const safeGatePositionValue1 = Math.min(
    Number(gatePositionValue1) || 0,
    Math.max(0, width * 100 - safeGateWidth1 * 100)
  );

  const gateColor = [
    { name: "Złoty Dąb", url: assetPath("konfigurator/jasny-dab.webp") },
    { name: "Orzech", url: assetPath("konfigurator/orzech.png") },
    { name: "Ocynk", url: assetPath("konfigurator/ocynk.png") },
    // { name: "Złoty Dąb Ciemny", url: "./konfigurator/ciemny-dab.png" },
    
    { name: "BiaĹ‚y 9010", ral: "#FBFFFF" },
    { name: "Szary 9002", ral: "#F2EFE8" },
    { name: "Srebrny 9006", ral: "#A7ABB6" },
    { name: "Piaskowy 1002", ral: "#D7B075" },
    { name: "Antracyt 7016", ral: "#272C38" },
    { name: "Ciemny BrÄ…z 8017", ral: "#2F1D1D" },
    { name: "BrÄ…z Jasny 8004", ral: "#85392C" },
    { name: "Ciemna ZieleĹ„ 6029", ral: "#0B3821" },
    { name: "Jasna ZieleĹ„ 6029", ral: "#117825" },    
    { name: "Czerwony 3011", ral: "#781416" },
    { name: "Wisniowy 3005", ral: "#4F121A" },
    { name: "Czarny 9005", ral: "#2C2C2C" },
  ];

  const handleGates = (action) => {
    if (action === "+" && gateCount < 3) {
      if (
        gateCount === 1 &&
        width < gateWidth2 + gateWidth1 + gatePositionValue1 / 100
      ){
        return toast.warning(
          t("resizeFirstGate")
        );
      }
      if (
        gateCount === 2 &&
        width < gateWidth3 + gateWidth2 + gatePositionValue2 / 100
      ) {
        return toast.warning(
          t("resizeGates")
        );
      }
      setGateCount(gateCount + 1);
      toast.info(t("gateAdded"));
    } else if (action === "-" && gateCount > 0) {
      setGateCount(gateCount - 1);
    }
  };

  const handleChange = (prop) => (event) => {
    setSelectedOptions({ ...selectedOptions, [prop]: event.target.value });
  };

  const handleGateTypeChange = (number) => (type) => {
    const updates = { [`gateType${number}`]: type };
    if (type === "segmentowa") {
      const currentWidth = Number(selectedOptions[`gateWidth${number}`]);
      const currentHeightMm = Number(selectedOptions[`gateHeight${number}`]) * 10;
      const available = sectionalPrices.filter(
        (item) => item.widthMm <= Number(width) * 1000 && item.heightMm <= Number(height) * 10
      );
      const selected = available.sort((a, b) =>
        Math.abs(a.widthMm - currentWidth * 1000) + Math.abs(a.heightMm - currentHeightMm) -
        (Math.abs(b.widthMm - currentWidth * 1000) + Math.abs(b.heightMm - currentHeightMm))
      )[0];
      if (selected) {
        updates[`gateWidth${number}`] = selected.widthMm / 1000;
        updates[`gateHeight${number}`] = selected.heightMm / 10;
        updates[`gateDrive${number}`] = "came";
      }
    }
    setSelectedOptions({ ...selectedOptions, ...updates });
  };

  const gateHeights = (type, gateWidth) => {
    if (type !== "segmentowa") return variable.gateSizes.height.filter((value) => Number(height) >= value);
    return [...new Set(sectionalPrices
      .filter((item) => item.widthMm === Math.round(Number(gateWidth) * 1000) && item.heightMm <= Number(height) * 10)
      .map((item) => item.heightMm / 10))];
  };

  const gateWidths = (type, gateHeight, gatePosition) => {
    const maxWidth = Number(width) - Number(gatePosition || 0) / 100;
    if (type !== "segmentowa") return variable.gateSizes.width.filter((value) => value <= 4 && value <= maxWidth);
    return [...new Set(sectionalPrices
      .filter((item) => item.heightMm === Math.round(Number(gateHeight) * 10) && item.widthMm <= maxWidth * 1000)
      .map((item) => item.widthMm / 1000))];
  };

  const hasSectionalForGarage = sectionalPrices.some(
    (item) => item.widthMm <= Number(width) * 1000 && item.heightMm <= Number(height) * 10
  );
  const invalidSectionalSelection = [1, 2, 3]
    .slice(0, Number(selectedOptions.gateCount) || 0)
    .some((number) =>
      selectedOptions[`gateType${number}`] === "segmentowa" &&
      findSectionalGatePrice(
        sectionalPrices,
        selectedOptions[`gateWidth${number}`],
        selectedOptions[`gateHeight${number}`]
      ) === null
    );

  useEffect(() => {
    getPrices().then((config) => setSectionalPrices(config.sectionalGates || []));
  }, []);

  const changeColor = (prop, ralProp) => (event) => {
    const colorRal = gateColor.find(
      (color) => color.name === event.target.value
    )?.ral;
    setSelectedOptions({
      ...selectedOptions,
      [prop]: event.target.value,
      [ralProp]: colorRal,
    });
  };

  useEffect(() => {
    if(gateCount === 0){
      setSelectedOptions({
        ...selectedOptions,
        gateCount: 0,
      });
    }

    if (gateCount === 1) {
      setSelectedOptions({
        ...selectedOptions,
        gateCount: 1,
      });
    }
    if (gateCount === 2) {
      setSelectedOptions({
        ...selectedOptions,
        gateCount: 2,
      });
    }
    if (gateCount === 3) {
      setSelectedOptions({
        ...selectedOptions,
        gateCount: 3,
      });
    }
  }, [gateCount]);

  useEffect(() => {
    const updates = {};

    if (width < 6) {
      updates.gateCount = 1;
      setGateCount(1);
    }

    if (width < gateWidth1) {
      updates.gateWidth1 = width;
      updates.gatePositionValue1 = 0;
    }
    if (width < gateWidth2) {
      updates.gateWidth2 = width;
      updates.gatePositionValue2 = 0;
    }
    if (width < gateWidth3) {
      updates.gateWidth3 = width;
      updates.gatePositionValue3 = 0;
    }

    if (Object.keys(updates).length > 0) {
      setSelectedOptions({
        ...selectedOptions,
        ...updates,
      });
    }
  }, [width, gateWidth1, gateWidth2, gateWidth3]);
 


  return (
    <div>
      {invalidSectionalSelection && (
        <p className="mb-3 rounded bg-red-100 p-2 text-sm font-semibold text-red-800">
          {t("sectionalPriceUnavailable")}
        </p>
      )}
      <div className="relative">
      {/* <p className="text-red-500 text-center text-xl pb-5">
          Min. szerokoĹ›Ä‡ garaĹĽu 6m aby dodaÄ‡ bramÄ™.
        </p> */}
        <p className="text-center">{t("addOrRemoveGates")}</p>
        <div className="flex justify-around p-2">
          {/* <img src="./konfigurator/gate.svg" /> */}
          <div className="  flex flex-col justify-center items-center">
            <p className="text-2xl font-bold">{gateCount}</p>
            <div className="flex gap-2">
              <button
                className="bg-slate-900 text-white h-16 w-16 rounded-full"
                onClick={() => handleGates("-")}
              >
                {t("remove")}
              </button>
              <button
                className="bg-slate-900 text-white h-16 w-16 rounded-full"
                onClick={() => handleGates("+")}
              >
                {t("add")}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex pb-3 gap-5 max-md:flex-wrap">
          <FormControl fullWidth>
            <InputLabel>{t("emboss")}</InputLabel>
            <Select
              value={selectedOptions.gateEmbose}
              onChange={handleChange("gateEmbose")}
              label={t("emboss")}
            >
              {variable.gateEmbose.map((type) => (
                <MenuItem key={type} value={type}>
                  {o(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth className="pb-5">
            <InputLabel>{t("embossDirection")}</InputLabel>
            <Select
              value={selectedOptions.gateDirection}
              onChange={handleChange("gateDirection")}
              label={t("embossDirection")}
            >
              {variable.gateDirection.map((type) => (
                <MenuItem key={type} value={type}>
                  {o(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* //first gate  */}
        {selectedOptions.gateCount >= 1 ? (
          <div>
          <FormControl className=" mt-3" fullWidth>
              <InputLabel>{t("color")}</InputLabel>
              <Select
                value={gateColor1}
                label={t("color")}
                onChange={changeColor("gateColor1", "gateColorRal1")}
              >
                {gateColor.map((color) => (
                  <MenuItem key={color.name} value={color.name}>
                    {o(color.name)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <GateTypeSelector
              label={t("firstGate")}
              value={gateType1}
              onChange={handleGateTypeChange(1)}
              translateOption={o}
              sectionalDisabled={!hasSectionalForGarage}
            />
            <div className="flex pt-3 gap-1">
              <FormControl fullWidth>
                <InputLabel>{t("height")}</InputLabel>
                <Select
                  disabled={gateCount === 1 ? false : true}
                  value={gateHeight1}
                  label={t("height")}
                  onChange={handleChange("gateHeight1")}
                >
                  {gateHeights(gateType1, gateWidth1).map((gateHeight) => (
                    <MenuItem key={gateHeight} value={gateHeight}>{gateHeight} cm</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>{t("width")}</InputLabel>
                <Select
                  disabled={gateCount === 1 ? false : true}
                  value={safeGateWidth1}
                  label={t("width")}
                  onChange={handleChange("gateWidth1")}
                >
                  {gateWidths(gateType1, gateHeight1, gatePositionValue1).map((width) => (
                      <MenuItem key={width} value={width}>
                        {width} m
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {gateType1 !== "segmentowa" && (
              <p className="text-orange-400"> {t("gateClearance")}: {selectedOptions.gateHeight1-10} {t("height")}, {safeGateWidth1*100-25} {t("width")} </p>
            )}
          
            {/* Slider*/}
            <h5 className="text-sm text-center pt-2 text-slate-900">
              {t("gatePosition")}
            </h5>
            <Slider
              disabled={gateCount === 1 ? false : true}
              aria-label="Default"
              defaultValue={(width / 2) * 100 - (safeGateWidth1 / 2) * 100}
              valueLabelDisplay="auto"
              step={10}
              marks
              min={0}
              max={Math.max(0, width * 100 - safeGateWidth1 * 100)}
              onChange={(event, newValue) =>
                setSelectedOptions({
                  ...selectedOptions,
                  gatePositionValue1: newValue,
                })
              }
            />
            {safeGatePositionValue1} {t("fromLeftEdge")}
          </div>
        ) : null}
        {/* //second gate  */}
        {(gateCount >= 2) && (width>=6) ? (
          <div className="py-5 relative">
            <h4 className="bg-slate-400 text-sm p-2 mb-2">{t("secondGate")}</h4>
            {/* //gateCount -1 button to remove gate */}
            <button
              className="absolute top-0 right-0 bg-slate-900 hover:bg-slate-500 text-white px-3 py-1 rounded-md"
              onClick={() => handleGates("-")}
            >
              -
            </button>
            <GateTypeSelector
              label={t("secondGate")}
              value={gateType2}
              onChange={handleGateTypeChange(2)}
              translateOption={o}
              sectionalDisabled={!hasSectionalForGarage}
            />
            <div className="flex pt-3 gap-1">
              <FormControl fullWidth>
                <InputLabel>{t("height")}</InputLabel>
                <Select
                  disabled={gateCount === 2 ? false : true}
                  value={gateHeight2}
                  label={t("height")}
                  onChange={handleChange("gateHeight2")}
                >
                  {gateHeights(gateType2, gateWidth2).map((heightGate) => (
                    <MenuItem key={heightGate} value={heightGate}>{heightGate} cm</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>{t("width")}</InputLabel>
                <Select
                  disabled={gateCount === 2 ? false : true}
                  value={gateWidth2}
                  label={t("width")}
                  onChange={handleChange("gateWidth2")}
                >
                  {gateWidths(gateType2, gateHeight2, gatePositionValue2).map((width) => (
                      <MenuItem key={width} value={width}>
                        {width} m
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {/* <FormControl className="py-3 mt-3" fullWidth>
              <InputLabel>{t("color")}</InputLabel>
              <Select
                value={gateColor2}
                label={t("color")}
                onChange={changeColor("gateColor2", "gateColorRal2")}
              >
                {gateColor.map((color) => (
                  <MenuItem key={color.name} value={color.name}>
                    {o(color.name)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}
            {/* Slider 2*/}
            {gateType2 !== "segmentowa" && (
              <p className="text-orange-400"> {t("gateClearance")}: {selectedOptions.gateHeight2-10} {t("height")},{selectedOptions.gateWidth2*100-25} {t("width")}</p>
            )}
            <h5 className="text-sm text-center pt-2 text-slate-900">
              {t("gatePosition")}
            </h5>
            <Slider
              disabled={gateCount === 2 ? false : true}
              aria-label="Default"
              defaultValue={gatePositionValue1 + gateWidth1 * 100}
              valueLabelDisplay="auto"
              step={10}
              marks
              min={gatePositionValue1 + gateWidth1 * 100}
              max={width * 100 - gateWidth2 * 100}
              onChange={(event, newValue) =>
                setSelectedOptions({
                  ...selectedOptions,
                  gatePositionValue2: newValue,
                })
              }
            />
            {gatePositionValue2} {t("fromLeftEdge")}
          </div>
        ) : null}

        {/* //third gate  */}
        {gateCount >= 3 ? (
          <div className="py-5 relative">
            <h4 className="bg-slate-400 text-sm p-2 mb-2">{t("thirdGate")}</h4>
            {/* //gateCount -1 button to remove gate */}
            <button
              className="absolute top-0 right-0 bg-slate-900 hover:bg-slate-500 text-white px-3 py-1 rounded-md"
              onClick={() => handleGates("-")}
            >
              -
            </button>
            <GateTypeSelector
              label={t("thirdGate")}
              value={gateType3}
              onChange={handleGateTypeChange(3)}
              translateOption={o}
              sectionalDisabled={!hasSectionalForGarage}
            />
            <div className="flex pt-3 gap-1">
              <FormControl fullWidth>
                <InputLabel>{t("height")}</InputLabel>
                <Select
                  value={gateHeight3}
                  label={t("height")}
                  onChange={handleChange("gateHeight3")}
                >
                  {gateHeights(gateType3, gateWidth3).map((heightValue) => (
                    <MenuItem key={heightValue} value={heightValue}>
                      {heightValue} cm
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>{t("width")}</InputLabel>
                <Select
                  value={gateWidth3 <= width ? gateWidth3 : width}
                  label={t("width")}
                  onChange={handleChange("gateWidth3")}
                >
                    {gateWidths(gateType3, gateHeight3, gatePositionValue3).map((width) => (
                      <MenuItem key={width} value={width}>
                        {width} m
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </div>
            {/* <FormControl className="py-3 mt-3" fullWidth>
              <InputLabel>{t("color")}</InputLabel>
              <Select
                value={gateColor3}
                label={t("color")}
                onChange={changeColor("gateColor3", "gateColorRal3")}
              >
                {gateColor.map((color) => (
                  <MenuItem key={color.name} value={color.name}>
                    {o(color.name)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}
            {/* Slider*/}
            {gateType3 !== "segmentowa" && (
              <p className="text-orange-400"> {t("gateClearance")}: {selectedOptions.gateHeight3-10} {t("height")} ,{selectedOptions.gateWidth3*100-25} {t("width")}</p>
            )}
            <h5 className="text-sm text-center pt-2 text-slate-900">
              {t("gatePosition")}
            </h5>
            <Slider
              disabled={gateCount === 3 ? false : true}
              aria-label="Default"
              defaultValue={gatePositionValue2 + gateWidth2 * 100}
              valueLabelDisplay="auto"
              step={10}
              marks
              min={gatePositionValue2 + gateWidth2 * 100}
              max={width * 100 - gateWidth3 * 100}
              onChange={(event, newValue) =>
                setSelectedOptions({
                  ...selectedOptions,
                  gatePositionValue3: newValue,
                })
              }
            />
            {gatePositionValue3} {t("fromLeftEdge")}
          </div>
        ) : selectedOptions.gateCount >= 3 ? (
          <p className="text-red-400 text-xs">
            {t("cantAddThirdGate")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default GateSetting2;

