import React,{useState} from 'react';
import { FormControl, InputLabel, Select, MenuItem, Grid, Card, CardActionArea, CardMedia } from '@mui/material';
import { variable } from '../Variable';


const MainGarage = ({ selectedOptions, setSelectedOptions }) => {

  const garageColors = [
    {name: "Złoty Dąb Jasny", url: "./konfigurator/jasny-dab.webp"},
    {name: "Złoty Dąb Ciemny", url: "./konfigurator/ciemny-dab.png"},
    {name: "Orzech", url: "./konfigurator/orzech.png"},
    {name: "Antracyt", ral: "#272C38"},
    {name: "Ciemny Brąz 8017", ral: "#2F1D1D"},
    {name: "Brąz Jasny 8004", ral: "#85392C"},
    {name: "Ciemna Zieleń 6029", ral: "#0B3821"},
    {name: "Jasna Zieleń 6029", ral: "#117825"},
    {name: "Grafit 7016", ral: "#262F38"},
    {name: "Biały 9010", ral: "#FBFFFF"},
    {name: "Szary 9002", ral: "#F2EFE8"},
    {name: "Srebrny 9006", ral: "#A7ABB6"},
    {name: "Piaskowy 1002", ral: "#D7B075"},
    {name: "Czerwony 3011", ral: "#781416"},
    {name: "Wisniowy 3005", ral: "#4F121A"},
    {name: "Czarny 9005", ral: "#2C2C2C"}
  ];

  const handleChange = (optionType) => (event) => {
    setSelectedOptions({ ...selectedOptions, [optionType]: event.target.value });
  };

  const handleSelectColor = (color,colorRal) => {
    setSelectedOptions({ ...selectedOptions, color,colorRal });
  };



  return (
    <Grid className='w-full'>
        <div className='flex flex-col gap-2'>
        <h4 className='bg-slate-900 p-2'>Główne wymiary</h4>
      {/* Selektory dla szerokości, wysokości i głębokości */}
      <Grid item container xs={12} spacing={2}>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel>Szerokość</InputLabel>
            <Select
              value={selectedOptions.width}
              label="Szerokość"
              onChange={handleChange('width')}
            >
              {variable.garageSizes.width.map((size) => (
                <MenuItem key={size} value={size}>{size} m</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel>Długość</InputLabel>
            <Select
              value={selectedOptions.depth}
              label="Długość"
              onChange={handleChange('depth')}
            >
              {variable.garageSizes.depth.map((size) => (
                <MenuItem key={size} value={size}>{size} m</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <FormControl fullWidth>
            <InputLabel>Wysokość</InputLabel>
            <Select
              value={selectedOptions.height}
              label="Wysokość"
              onChange={handleChange('height')}
            >
              {variable.garageSizes.height.map((size) => (
                <MenuItem key={size} value={size}>{size} cm</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      
      </Grid>
        </div>
   

      {/* Dalsze selektory */}
     

      {/* Selektor koloru */}
      {/* Selektor koloru z obrazkami */}
      <Grid item xs={12} className='pt-2'>
        <div className='flex flex-wrap gap-2 ' spacing={2}>
          {garageColors.map((color) => (
          color.url ? <div key={color.name} className={`max-w-[80px] ${selectedOptions.color===color.name ? ' font-bold' : null}`}> <img key={color.name} src={color.url} className='w-20 h-12 rounded-md ' alt={color.name} onClick={() => handleSelectColor(color.name,color.ral)} /> <p className='text-xs text-center text-black'>{color.name}</p></div>
          : <div key={color.name} className={`max-w-[80px] ${selectedOptions.color===color.name ? ' font-bold' : null}`}><div key={color.name} className='w-20 h-12 rounded-md' style={{backgroundColor:color.ral}} onClick={() => handleSelectColor(color.name,color.ral)}></div> <p className='text-xs text-center text-black'>{color.name}</p>
        
          </div>
          ))}
        </div>
      </Grid>

      {/* Selektor koloru */}


      
      <Grid className='pt-2 flex gap-2' item xs={12} sm={4}>
        {/* Selektor wytłoczenia */}
        <FormControl fullWidth >
          <InputLabel>Wytłoczenie</InputLabel>
          <Select
            value={selectedOptions.emboss}
            label="Wytłoczenie"
            onChange={handleChange('emboss')}
          >
            {variable.garageEmbose.map((emboss) => (
              <MenuItem key={emboss} value={emboss}>{emboss}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth >
          <InputLabel>Kierunek przetczen</InputLabel>
          <Select
            value={selectedOptions.direction}
            label="Wytłoczenie"
            onChange={handleChange('direction')}
          >
            {variable.garageDirection.map((direction) => (
              <MenuItem key={direction} value={direction}>{direction}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default MainGarage;
