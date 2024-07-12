"use client";

import React, { useState, useEffect, use } from "react";
import GarageConfigurator from "./GarageConfigurator";
import GarageViewer from "./GarageViewer";
import Modal from "./Modal";
import axios from 'axios';
import LeftSettings from "./LeftSettings/LeftSettings";
import CalcMain from "./calculate/CalcMain";

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

    gateCount: 2,
    gateType1: "uchylna",
    gateColor1: "Złoty Dąb",
    gateColorRal1: null,
    gateWidth1: 3,
    gateHeight1: 200,
    gatePositionValue1: 150,

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
    carportType: "brak",
    carportSides:{lewo:true,prawo:true,przod:false,tyl:true},

    gutter: false,
    automatic: false,
    filc: false,
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


  // const user = process.env.NEXT_PUBLIC_USER_WP;
  // const password = process.env.NEXT_PUBLIC_PASSWORD_WP;

  const captureScreenshot = async (image) => {

    // const fetchResponse = await fetch(image);
    // const blob = await fetchResponse.blob();

    // const formData = new FormData();
    // formData.append('file', blob, 'screenshot.png');
    
    // try {
    //   const response = await axios.post(
    //     'https://backend.acelgarage.pl/backend/wp-json/wp/v2/media',
    //     formData,
    //     {
    //       headers: {
    //         'Content-Type': 'multipart/form-data',
    //         'Authorization': 'Basic ' + btoa(user + ":" + password),
    //       },
    //       withCredentials: true,
    //     }
    //   );
    //   console.log("Response",response.data);        
  
    //   await setImageURL(response.data.guid.rendered)
      
  
    
    // } catch (error) {
    //   console.error(error);
    // }
  };
 
  return (
    <div className="bg-slate-200 relative w-screen h-screen flex max-sm:flex-col">
      <LeftSettings selectedOptions={selectedOptions} setSelectedOptions={setSelectedOptions}  />
      <Modal selectedOptions={selectedOptions} modal={modal} setModal={setModal} setCapture={setCapture} capture={capture} imageURL={imageURL} />
      <div id='capture' className="w-full h-3/4 relative max-sm:h-1/2 ">
        <GarageViewer selectedOptions={selectedOptions} captureScreenshot={captureScreenshot} capture={capture}  />
        <div className="pl-[10%] p-5 border-2 border-slate-800">
          <CalcMain selectedOptions={selectedOptions} price={price} setPrice={setPrice} />
         <button className="btn-acel max-sm:py-2 w-full py-5 text-2xl bottom-0 right-0  animate-pulse  bg-slate-600 text-white rounded-md">Wyślij wycenę</button>
        </div>
        {/* <button
          onClick={() => (setModal(true))}
          className="fixed z-50 btn-acel max-sm:py-2 w-full py-5 text-2xl bottom-0 right-0  animate-pulse  bg-slate-900 text-white rounded-md"
        >
          Wyślij wycenę
        </button> */}
      </div>
      {/* <div className=" p-5 md:w-[600px] h- bg-slate-300 overflow-auto ">
        <GarageConfigurator
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
        />
      </div> */}
    </div>
  );
}

export default Main;
