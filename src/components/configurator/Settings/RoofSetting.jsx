import { FormControl, InputLabel, Select, MenuItem, Grid, Card, CardActionArea, CardMedia } from '@mui/material';
import { useEffect } from 'react';
import { assetPath } from '../../../utils/assetPath';
import FlashingControl from './FlashingControl';
import ImageOptionCard from './ImageOptionCard';

function RoofSetting({selectedOptions, setSelectedOptions, o, t = (value) => value}) {
  const roof =[
    {name: "blachodachówka", url: assetPath("images/blachodachowka.jpg") },
    {name: "trapezowa", url: assetPath("images/trapezowa.jpg") },
    {name: "na_rabek", url: assetPath("images/rabek.webp") },
  ];

  const roofColor = [
    {name: "Ocynk", ral: "#A7ABA7"},
    {name: "Biały 9010", ral: "#FBFFFF"},
    {name: "Szary 9002", ral: "#F2EFE8"},
    {name: "Srebrny 9006", ral: "#A7ABB6"},
    {name: "Piaskowy 1002", ral: "#D7B075"},
    {name: "Antracyt 7016", ral: "#272C38"},
    {name: "Ciemny Brąz 8017", ral: "#2F1D1D"},
    {name: "Brąz Jasny 8004", ral: "#85392C"},
    {name: "Ciemna Zieleń 6029", ral: "#0B3821"},
    {name: "Jasna Zieleń 6029", ral: "#117825"},
    {name: "Czerwony 3011", ral: "#781416"},
    {name: "Ceglasty", ral: "#824C40"},
    {name: "Wisniowy 3005", ral: "#4F121A"},
    {name: "Czarny 9005", ral: "#2C2C2C"}
  ];

  const handleSelectColor = (roofColor,roofColorRal) => {
    setSelectedOptions({ ...selectedOptions, roofColor, roofColorRal });
  };

  return (
    <div className='py-2'>
      <div className="grid grid-cols-3 gap-2">
        {roof.map((type) => (
          <ImageOptionCard
            key={type.name}
            value={type.name}
            label={o(type.name)}
            image={type.url}
            selected={selectedOptions.roofType === type.name}
            onSelect={(roofType) =>
              setSelectedOptions((current) => ({ ...current, roofType }))
            }
          />
        ))}
      </div>

      <Grid item xs={12} className='pt-2'>
        <div className='flex flex-wrap gap-2 ' spacing={2}>
          {roofColor.map((color) => (
            <button
              type="button"
              key={color.name}
              aria-label={o(color.name)}
              aria-pressed={selectedOptions.roofColor === color.name}
              onClick={() => handleSelectColor(color.name, color.ral)}
              className={`max-w-[80px] rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${selectedOptions.roofColor === color.name ? 'font-bold ring-2 ring-slate-900' : ''}`}
            >
              <span className='mx-auto block h-14 w-14 rounded-full border border-slate-300' style={{backgroundColor:color.ral}}></span>
              <span className='block text-xs text-center text-black'>{o(color.name)}</span>
            </button>
          ))}
        </div>
      </Grid>
      <FlashingControl
        kind="roof"
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        label={t("roofFlashings")}
        inheritedLabel={t("sameAsRoof")}
        colorLabel={t("flashingColor")}
        o={o}
      />
    </div>
  )
}

export default RoofSetting
