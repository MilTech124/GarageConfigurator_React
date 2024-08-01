"use client";

import React, { useState, useEffect, use } from "react";
import GarageConfigurator from "./GarageConfigurator";
import GarageViewer from "./GarageViewer";
import Modal from "./Modal";
import axios from 'axios';
import LeftSettings from "./LeftSettings/LeftSettings";
import CalcMain from "./calculate/CalcMain";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import Checkbox from '@mui/material/Checkbox';


function Main() {

  const [selectedOptions, setSelectedOptions] = useState({
    color: "Złoty Dąb",
    colorRal: null,
    width: 6,
    depth: 6,
    height: 213,
    emboss: "wąskie",
    direction: "poziom",

    roof: "dwuspad",
    roofColor: "Antracyt",
    roofColorRal: "#272C38",
    roofType: "trapezowa",

    gateEmbose: "wąskie",
    gateDirection: "poziom",

    gateCount: 2,   //2 wczesniej
    gateType1: "uchylna",
    gateColor1: "Złoty Dąb",
    gateColorRal1: null,
    gateWidth1: 3,
    gateHeight1: 200,
    gatePositionValue1: 0,

    gateType2: "uchylna",
    gateColor2: "Złoty Dąb",
    gateColorRal2: null,
    gateWidth2: 3,
    gateHeight2: 200,
    gatePositionValue2: 300,

    gateType3: "uchylna",
    gateColor3: "Złoty Dąb",
    gateColorRal3: null,
    gateWidth3: 3,
    gateHeight3: 200,
    gatePositionValue3: 600,

    door: [],
    window: [],

    carport: false,
    carportWidth: 3,
    carportSide: "lewo",
    carportSideName: "lewo",
    carportType: "brak",
    carportSides:{lewo:false,prawo:false,przod:false,tyl:true},
    carportSides2:{lewo:false,prawo:false,przod:false,tyl:false},

    gutter: false,
    automatic: false,
    countAutomatic: 1,
    filc: false,
    transport: false,   
    wojewodztwo: ""
  });
  const [modal, setModal] = useState(false);
  const [capture, setCapture] = useState(false);
  const [imageURL, setImageURL] = useState(null);
  const [price, setPrice] = useState(0);


  //use effects helpers

  useEffect(() => {
    if (selectedOptions.color ==="Ocynk") {
      selectedOptions.direction = "pion";
      selectedOptions.emboss = "wąskie";
    }
  }, [selectedOptions.color]);

  useEffect(() => {
    if(selectedOptions.color === "Ocynk") {
    
      setSelectedOptions({...selectedOptions, roofColorRal: "#A7ABA7",gateColor1:"Ocynk",gateColor2:"Ocynk",gateColor3:"Ocynk"})
    }}
  ,[selectedOptions.color])





  const user = import.meta.env.VITE_USER_WP;
  const password = import.meta.env.VITE_PASSWORD_WP;




  const captureScreenshot = async (image) => {   

    const fetchResponse = await fetch(image);
    const blob = await fetchResponse.blob();
  
    const resizeImage = (blob, maxWidth, maxHeight) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
  
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
  
          // Calculate the new dimensions while maintaining the aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height *= maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width *= maxHeight / height));
              height = maxHeight;
            }
          }
  
          canvas.width = width;
          canvas.height = height;
  
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
  
          canvas.toBlob((resizedBlob) => {
            resolve(resizedBlob);
          }, 'image/png');
        };
       
      });
      
    };
  
    const resizedBlob = await resizeImage(blob, 800, 600); // Set your desired max width and height
  
    const formData = new FormData();
    formData.append('file', resizedBlob, 'screenshot.png');
  
    try {
      const response = await axios.post(
        'https://newgarage.pl/wp-json/wp/v2/media',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Basic ' + btoa(user + ":" + password),
          },
          withCredentials: true,
        }
      );
      console.log("Response", response.data);
  
      await setImageURL(response.data.guid.rendered);
    } catch (error) {
      console.error(error);
    }
   
  };
 
  return (
    <div className="bg-slate-200 relative w-screen h-screen flex max-sm:flex-col">
   
   {capture && <div class="absolute top-0 left-0 w-full h-full flex-col gap-4  flex items-center justify-center !z-50 bg-black/50 ">
        <div class="w-28 h-28 border-8 text-blue-400 text-4xl animate-spin border-gray-300 flex items-center justify-center border-t-blue-400 rounded-full">
          <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em" class="animate-ping">
            <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"></path>
          </svg>
        </div>
      </div> }
   
      <LeftSettings selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions}  />      
      <Modal selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions} modal={modal} price={price} setModal={setModal} setCapture={setCapture} capture={capture} imageURL={imageURL} />
      <div id='capture' className="w-full md:h-3/4 relative max-sm:order-1 max-sm:h-1/3 max-sm:pb-[75px] ">
        <GarageViewer selectedOptions={selectedOptions} captureScreenshot={captureScreenshot} capture={capture}  />
        <div className="md:pl-[10%] relative flex justify-around p-2 border-2 border-slate-800">
          <CalcMain selectedOptions={selectedOptions} price={price} setPrice={setPrice} />
    
          <Button onClick={() => (setModal(true))} variant="contained" size="large" endIcon={<SendIcon />}>Zamów </Button>
          
        </div>
       
        {/* <button
          onClick={() => (setModal(true))}
          className="fixed z-50 btn-acel max-sm:py-2 w-full py-5 text-2xl bottom-0 right-0  animate-pulse  bg-slate-900 text-white rounded-md"
        >
          Wyślij wycenę
        </button> */}
        <div className="p-2 border-2 border-slate-800 ">
        <p><b>Konstrukcja</b>- Konstrukcja wykonana jest z czarnej stali malowanej farbą podkładową, co chroni przed korozją.
        <br></br> Wykorzystano <b>profil zamknięty</b>, który zapewnia wysoką wytrzymałość i stabilność garażu. </p>
        <p className="pt-2">
          <b>Przygotowanie podłoża</b>, <b>fundamentów</b>  leży po stronie klienta.
          Kotwiczenie garażu we własnym zakresie.
        </p>
        </div>
        
      </div>
   

      
    </div>
  );
}

export default Main;
