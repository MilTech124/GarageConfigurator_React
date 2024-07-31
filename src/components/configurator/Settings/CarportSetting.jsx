import React, { useEffect } from "react";
import { Select, InputLabel, FormControl, MenuItem, Menu } from "@mui/material";
import { variable } from "../Variable";
import { toast } from "react-toastify";
import Button from '@mui/material/Button';


function CarportSetting({ selectedOptions, setSelectedOptions }) {

  const carportSides = selectedOptions.carportSides; // Access carportSides from selectedOptions
  const carportSide = selectedOptions.carportSide; // Access carportSide from selectedOptions
  const carportSides2 = selectedOptions.carportSides2; // Access carportSides2 from selectedOptions

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

  const setCarportSideName =(name)=>{
    setSelectedOptions({...selectedOptions,carportSideName:name}); 
  }

  useEffect(() => {      //Korekcja wyboru strony wiaty w zależności od wyboru dachu
    if(selectedOptions.roof === "spad przód"){
      carportSide === "przod" && setCarportSideName("tyl") || carportSide === "tyl" && setCarportSideName("przod") || carportSide === "lewo" && setCarportSideName("prawo") || carportSide === "prawo" && setCarportSideName("lewo");
    }
    if(selectedOptions.roof === "spad w lewo"){
      carportSide === "przod" && setCarportSideName("prawo") || carportSide === "tyl" && setCarportSideName("lewo") || carportSide === "lewo" && setCarportSideName("przod") || carportSide === "prawo" && setCarportSideName("tyl");
    }
    if(selectedOptions.roof === "spad w prawo"){
      carportSide === "przod" && setCarportSideName("lewo") || carportSide === "tyl" && setCarportSideName("prawo") || carportSide === "lewo" && setCarportSideName("tyl") || carportSide === "prawo" && setCarportSideName("przod");
    }
    if(selectedOptions.roof === "spad tyl"){
      carportSide === "przod" && setCarportSideName("przod") || carportSide === "tyl" && setCarportSideName("tyl") || carportSide === "lewo" && setCarportSideName("lewo") || carportSide === "prawo" && setCarportSideName("prawo");
    }
      


  },[carportSide])

  


  return (
    <div className="flex flex-col">
      <h4 className=" text-center text-xl p-2">Dodaj wiatę</h4>
      <div className="flex items-center">
        {/* <img src="/konfigurator/carport.png" className="w-40 h-40" alt="" /> */}
        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }} >
          <InputLabel id="demo-simple-select-standard-label">Dodaj wiatę</InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            value={selectedOptions.carport}
            onChange={(e) => {
              setSelectedOptions({
                ...selectedOptions,
                carport: e.target.value,
              });
            }}
            label="Dodaj wiatę"
          >
            <MenuItem value={false}>Nie</MenuItem>
            <MenuItem value={true}>Tak</MenuItem>
          </Select>
        </FormControl>
        
      </div>     

      {selectedOptions.carport && (
        <>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-standard-label">
              Strona
            </InputLabel>

            {/* KOREKCJA WYBORU STRONY WIATY */}
            {selectedOptions.roof === "spad przód" ? (
              <Select
                labelId="demo-simple-select-standard-label"
                id="demo-simple-select-standard"
                value={selectedOptions.carportSide}
                onChange={(e) => {
                  setSelectedOptions({
                    ...selectedOptions,
                    carportSide: e.target.value,
                  });
                }}
                label="Strona"
              >
                <MenuItem value={"lewo"}>Prawo</MenuItem>
                <MenuItem value={"prawo"}>Lewo</MenuItem>
                <MenuItem value={"przod"}>Tył</MenuItem>
                <MenuItem value={"tyl"}>Przód</MenuItem>
              </Select>
            ) : selectedOptions.roof === "spad w lewo" ? (
              <Select
                labelId="demo-simple-select-standard-label"
                id="demo-simple-select-standard"
                value={selectedOptions.carportSide}
                onChange={(e) => {
                  setSelectedOptions({
                    ...selectedOptions,
                    carportSide: e.target.value,
                  });
                }}
                label="Strona"
              >
                <MenuItem value={"lewo"}>Przod</MenuItem>
                <MenuItem value={"prawo"}>Tył</MenuItem>
                <MenuItem value={"przod"}>Prawo</MenuItem>
                <MenuItem value={"tyl"}>Lewo</MenuItem>
              </Select>
            ) : selectedOptions.roof === "spad w prawo" ? (
              <Select
                labelId="demo-simple-select-standard-label"
                id="demo-simple-select-standard"
                value={selectedOptions.carportSide}
                onChange={(e) => {
                  setSelectedOptions({
                    ...selectedOptions,
                    carportSide: e.target.value,
                  });
                }}
                label="Strona"
              >
                <MenuItem value={"lewo"}>Tył</MenuItem>
                <MenuItem value={"prawo"}>Przod</MenuItem>
                <MenuItem value={"przod"}>Lewo</MenuItem>
                <MenuItem value={"tyl"}>Prawo</MenuItem>
              </Select>
            ) : (
              <Select
                labelId="demo-simple-select-standard-label"
                id="demo-simple-select-standard"
                value={selectedOptions.carportSide}
                onChange={(e) => {
                  setSelectedOptions({
                    ...selectedOptions,
                    carportSide: e.target.value,
                  });
                }}
                label="Strona"
              >
                <MenuItem value={"lewo"}>Lewo</MenuItem>
                <MenuItem value={"prawo"}>Prawo</MenuItem>
                <MenuItem value={"przod"}>Przód</MenuItem>
                <MenuItem value={"tyl"}>Tył</MenuItem>
              </Select>
            )}
          </FormControl>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-standard-label">
              Rozmiar
            </InputLabel>
            <Select
              labelId="demo-simple-select-standard-label"
              id="demo-simple-select-standard"
              value={selectedOptions.carportWidth}
              onChange={(e) => {
                setSelectedOptions({
                  ...selectedOptions,
                  carportWidth: e.target.value,
                });
              }}
              label="Szerokość"
            >
              {variable.carportWidth.map((width) => (
                <MenuItem key={width} value={width}>
                  {width}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-standard-label">
            Typ Poszycia Wiaty
            </InputLabel>
            <Select
              labelId="demo-simple-select-standard-label"
              id="demo-simple-select-standard"
              value={selectedOptions.carportType}
              onChange={(e) => {
                setSelectedOptions({
                  ...selectedOptions,
                  carportType: e.target.value,
                });
              }}
              label="Typ Poszycia Wiaty"
            >
              <MenuItem value={"brak"}>Brak</MenuItem>
              <MenuItem value={"oblachowane"}>Oblachowane</MenuItem>
              <MenuItem value={"azury"}>Ażury</MenuItem>
              <MenuItem value={"mix"}>Mix</MenuItem>
            </Select>       
          
          </FormControl>

          
        </>
      )}
      {(selectedOptions.carport  && !(selectedOptions.carportType==="brak") ) && (
        <div className="flex flex-col items-center justify-center ">      
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
              <Button disabled={selectedOptions.carportSides2.przod } variant={selectedOptions.carportSides.przod ? "contained":"outlined"} name="przod" onClick={(e) => setCarportSides(e)}>Przod</Button>
          </FormControl>
          <div className="flex">
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <Button disabled={selectedOptions.carportSides2.lewo} variant={selectedOptions.carportSides.lewo ? "contained":"outlined"} name="lewo" onClick={(e) => setCarportSides(e)} >Lewo</Button>
            </FormControl>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <Button disabled={selectedOptions.carportSides2.prawo} variant={selectedOptions.carportSides.prawo ? "contained":"outlined"} name="prawo" onClick={(e) => setCarportSides(e)} >Prawo</Button>
            </FormControl>
          </div>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <Button disabled={selectedOptions.carportSides2.tyl} variant={selectedOptions.carportSides.tyl ? "contained":"outlined"} name="tyl" onClick={(e) => setCarportSides(e)} >Tył</Button>
            </FormControl>
      </div>
      )
        }

        {(selectedOptions.carport && selectedOptions.carportType==="mix")
        
        && (
          <div className="flex flex-col items-center justify-center ">      
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <Button disabled={selectedOptions.carportSides.przod} variant={selectedOptions.carportSides2.przod ? "contained":"outlined"} name="przod" onClick={(e) => setCarportSides2(e)}>Przod</Button>
            </FormControl>
            <div className="flex">
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <Button disabled={selectedOptions.carportSides.lewo} variant={selectedOptions.carportSides2.lewo ? "contained":"outlined"} name="lewo" onClick={(e) => setCarportSides2(e)} >Lewo</Button>
              </FormControl>
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <Button disabled={selectedOptions.carportSides.prawo} variant={selectedOptions.carportSides2.prawo ? "contained":"outlined"} name="prawo" onClick={(e) => setCarportSides2(e)} >Prawo</Button>
              </FormControl>
            </div>
              <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                  <Button disabled={selectedOptions.carportSides.tyl} variant={selectedOptions.carportSides2.tyl ? "contained":"outlined"} name="tyl" onClick={(e) => setCarportSides2(e)} >Tył</Button>
              </FormControl>
          </div>
        )
        }
    
     
    </div>
  );
}

export default CarportSetting;
