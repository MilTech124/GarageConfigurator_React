import { FormControl, InputLabel, Select, MenuItem, Grid, Card, CardActionArea, CardMedia } from '@mui/material';
import { useEffect } from 'react';


function RoofSetting({selectedOptions, setSelectedOptions}) { 
 
    const roof =[
        {name: "blachodachówka", url: "./konfigurator/blachodachowka.png"},
        {name: "trapezowa", url: "./konfigurator/trapezowa.png"},
    ]
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
        setSelectedOptions({ ...selectedOptions, roofColor,roofColorRal });
      };

    
      

  return (
    <div className='py-2'>
        <div className="flex gap-0 flex-wrap justify-evenly">
            {roof.map((type) => (
                <div key={type.name}>
                    <img key={type.name} onClick={() => setSelectedOptions({...selectedOptions, roofType: type.name})}
                    className={`w-32 h-16 object-cover ${selectedOptions.roofType ===type.name ? "border-4" :null}  `}
                    src={type.url}
                    alt={type.name}
                    />
                    <p className='text-center text-black'>{type.name}</p>
                </div>
         
            ))}
        </div>

        {/* Selektor koloru */}
      {/* Selektor koloru z obrazkami */}
      <Grid item xs={12} className='pt-2'>
        <div className='flex flex-wrap gap-2 ' spacing={2}>
          {roofColor.map((color) => (
          <div key={color.name} className={`max-w-[80px] ${selectedOptions.roofColor===color.name ? ' font-bold' : null}`}><div className='w-14 h-14 rounded-full' style={{backgroundColor:color.ral}} onClick={() => {handleSelectColor(color.name,color.ral)}}></div> <p className='text-xs text-center text-black'>{color.name}</p>       
          </div>
          ))}
        </div>
      </Grid>

      {/* Selektor koloru */}

    </div>
  )
}

export default RoofSetting