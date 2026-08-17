import React,{useEffect}from 'react';
import { FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { variable } from '../Variable';
import { assetPath } from '../../../utils/assetPath';
import FlashingControl from './FlashingControl';
import ImageOptionCard from './ImageOptionCard';

const MainGarage = ({ selectedOptions, setSelectedOptions, t, o, lang }) => {
  const roofKey = String(selectedOptions.roof || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const isRearSlope = roofKey === "spad tyl";
  const availableHeights = isRearSlope
    ? [200, ...variable.garageSizes.height.filter((height) => height !== 200)]
    : variable.garageSizes.height.filter((height) => height !== 200);

  useEffect(() => {
    if (!isRearSlope && Number(selectedOptions.height) === 200) {
      setSelectedOptions((current) => ({ ...current, height: 213 }));
    }
  }, [isRearSlope, selectedOptions.height, setSelectedOptions]);

  const colorLabel = (name) => {
    return o(name);
  };

  const garageColors = [
    {name: "Ocynk", url: assetPath("konfigurator/ocynk.png")},
    {name: "Złoty Dąb", url: assetPath("konfigurator/jasny-dab.webp")},
    {name: "Orzech", url: assetPath("konfigurator/orzech.png")},
    {name: "BiaĹ‚y 9010", ral: "#FBFFFF"},
    {name: "Szary 9002", ral: "#F2EFE8"},
    {name: "Srebrny 9006", ral: "#A7ABB6"},
    {name: "Piaskowy 1002", ral: "#D7B075"},
    {name: "Ciemna ZieleĹ„ 6029", ral: "#0B3821"},
    {name: "Jasna ZieleĹ„ 6029", ral: "#117825"},
    {name: "Antracyt 7016", ral: "#272C38"},
    {name: "Ciemny BrÄ…z 8017", ral: "#2F1D1D"},
    {name: "BrÄ…z Jasny 8004", ral: "#85392C"},
    {name: "Ceglasty", ral: "#824C40"},
    {name: "Czerwony 3011", ral: "#781416"},
    {name: "Wisniowy 3005", ral: "#4F121A"},
    {name: "Czarny 9005", ral: "#2C2C2C"}
  ];

  const embossOptions = [
    { name: "szerokie", profile: "T-14", url: assetPath("images/przetloczenia-t14.jpg") },
    { name: "waskie", profile: "T-8", url: assetPath("images/przetloczenia-t8.jpg") },
    { name: "na_rabek", url: assetPath("images/rabek.webp") },
  ];

  const handleChange = (optionType) => (event) => {
    const value = event.target.value;

    if (optionType === "width") {
      const width = Number(value);

      setSelectedOptions((current) => ({
        ...current,
        width: value,
        gateCount: width < 6 ? Math.min(Number(current.gateCount) || 1, 1) : current.gateCount,
        gateWidth1: Math.min(Number(current.gateWidth1) || width, width),
        gateWidth2: Math.min(Number(current.gateWidth2) || width, width),
        gateWidth3: Math.min(Number(current.gateWidth3) || width, width),
        gatePositionValue1: 0,
        gatePositionValue2: width < 6 ? 0 : current.gatePositionValue2,
        gatePositionValue3: width < 6 ? 0 : current.gatePositionValue3,
      }));
      return;
    }

    setSelectedOptions({ ...selectedOptions, [optionType]: value });
  };

  const handleSelectColor = (color,colorRal) => {
    setSelectedOptions({ ...selectedOptions, color,colorRal });
  };

  return (
    <Grid className='w-full'>
      <div className='flex flex-col gap-2'>
        <Grid item container xs={12} spacing={2}>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>{t("width")}</InputLabel>
              <Select value={selectedOptions.width} label={t("width")} onChange={handleChange('width')}>
                {variable.garageSizes.width.map((size) => (
                  <MenuItem key={size} value={size}>{size} m</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>{t("length")}</InputLabel>
              <Select value={selectedOptions.depth} label={t("length")} onChange={handleChange('depth')}>
                {variable.garageSizes.depth.map((size) => (
                  <MenuItem key={size} value={size}>{size} m</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>{t("height")}</InputLabel>
              <Select value={selectedOptions.height} label={t("height")} onChange={handleChange('height')}>
                {availableHeights.map((size) => (
                  <MenuItem key={size} value={size}>{size} cm</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </div>

      <Grid item className='pt-2'>
        <div className='flex flex-wrap gap-2 ' spacing={2}>
          {garageColors.map((color) => (
            color.url ? (
              <div role="button" key={color.name} className={`max-w-[60px] ${selectedOptions.color===color.name ? ' font-bold' : null}`}>
                <img src={color.url} className='w-14 h-14 rounded-full ' alt={colorLabel(color.name)} onClick={() => handleSelectColor(color.name,color.ral)} />
                <p className='text-xs text-center text-black'>{colorLabel(color.name)}</p>
              </div>
            ) : (
              <div role="button" key={color.name} className={`max-w-[60px] ${selectedOptions.color===color.name ? ' font-bold' : null}`}>
                <div className='w-14 h-14 rounded-full' style={{backgroundColor:color.ral}} onClick={() => handleSelectColor(color.name,color.ral)}></div>
                <p className='text-xs text-center text-black'>{colorLabel(color.name)}</p>
              </div>
            )
          ))}
        </div>
      </Grid>

      <Grid className='pt-3' item xs={12} sm={4}>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-800">{t("emboss")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {embossOptions.map((emboss) => (
              <ImageOptionCard
                key={emboss.name}
                value={emboss.name}
                label={emboss.profile ? `${o(emboss.name)} (${emboss.profile})` : o(emboss.name)}
                image={emboss.url}
                selected={selectedOptions.emboss === emboss.name}
                onSelect={(value) =>
                  setSelectedOptions((current) => ({
                    ...current,
                    emboss: value,
                    direction: value === "na_rabek" ? "pion" : current.direction,
                  }))
                }
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-3">
          <FormControl fullWidth>
            <InputLabel>{t("direction")}</InputLabel>
            <Select
              value={selectedOptions.direction}
              label={t("direction")}
              onChange={handleChange('direction')}
              disabled={selectedOptions.emboss === "na_rabek" || selectedOptions.color === "Ocynk"}
            >
              {variable.garageDirection.map((direction) => (
                <MenuItem key={direction} value={selectedOptions.color === "Ocynk" ? "pion" : direction}>
                  {selectedOptions.color === "Ocynk" ? o("pion") : o(direction)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </Grid>
      <FlashingControl
        kind="garage"
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        label={t("garageFlashings")}
        inheritedLabel={t("sameAsGarage")}
        colorLabel={t("flashingColor")}
        o={o}
      />
    </Grid>
  );
};

export default MainGarage;
