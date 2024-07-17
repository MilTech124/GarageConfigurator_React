import { Suspense } from "react";
import { Canvas, extend, useThree,useFrame } from '@react-three/fiber'
import { Environment } from "@react-three/drei";
import { OrbitControls, ContactShadows,Sky,PerspectiveCamera } from "@react-three/drei";
import { Model } from "./Model";
import { useRef, useEffect,useState } from "react";
import { Button } from "@mui/material";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';


function CaptureScreenshot({ setCaptureFunction,capture }) {
  const { gl } = useThree();

  useEffect(() => {
    if (capture){
      const capture = () => {
        const imageData = gl.domElement.toDataURL('image/png');
        console.log(imageData);
        return imageData;
      };  
       setCaptureFunction(capture())

    }
   
   
  },[capture])

  return null;
}

function CameraOrbit({ center = [0, 0, 0], radius = 10 }) {
  const cameraRef = useRef(null);
  const angleRef = useRef(0); // Użyj useRef zamiast useState

  useFrame(() => {
    // Aktualizuj kąt obrotu
    angleRef.current += 0.008;

    // Oblicz nową pozycję kamery
    const x = center[0] + radius * Math.sin(angleRef.current);
    const z = center[2] + radius * Math.cos(angleRef.current);

    // Ustaw nową pozycję kamery
    cameraRef.current.position.set(x,3, z);

    // Skieruj kamerę na centrum obrotu
    cameraRef.current.lookAt(...center);
  });

  return (
    <PerspectiveCamera makeDefault ref={cameraRef} fov={30} position={[10, 0, 5]} />
  );
}
  


function GarageViewer({ selectedOptions ,captureScreenshot,capture }) {

  const canvasRef = useRef();
  const [cameraPosition, setCameraPosition] = useState([15, 8, 4]); // Początkowa pozycja kamery
  const [onPlay, setOnPlay] = useState(false);

  const zoomIntensity = 2;
  const maxZoom = 20;
  const minZoom = 12;

  // Funkcja do płynnego zbliżania kamery
  const zoomIn = () => {
    
    setCameraPosition(prevPosition => [
      minZoom <=  prevPosition[0] - zoomIntensity ?  prevPosition[0] - zoomIntensity :minZoom, // Zmniejsz wartość x dla zbliżenia
      prevPosition[1],
      prevPosition[2]
    ]);
  };
  
  // Funkcja do płynnego oddalania kamery
  const zoomOut = () => {
    console.log(cameraPosition ,minZoom);
    setCameraPosition(prevPosition => [
      maxZoom >=  prevPosition[0] + zoomIntensity ?  prevPosition[0] + zoomIntensity :maxZoom, // Zwiększ wartość x dla oddalenia
      prevPosition[1],
      prevPosition[2]
    ]);
  };



  return ( 
 <>
    <div className="absolute right-0 top-0 z-10 flex flex-col gap-1 py-2">
      {/* <div className="flex gap-1">
      <Button variant="contained" onClick={zoomIn}><ZoomInIcon></ZoomInIcon></Button>
      <Button variant="contained"  onClick={zoomOut}><ZoomOutIcon></ZoomOutIcon></Button>
      </div> */}
      
      <Button variant="contained" color="error" onClick={() => setOnPlay(!onPlay)}><PlayCircleIcon></PlayCircleIcon></Button>
    </div>
 
  
    <Canvas gl={{ preserveDrawingBuffer: true }} 
      // camera={{ position: cameraPosition, fov: 45,} }
      style={{
        // background: "url(/logo-black.png)",
        backgroundRepeat: "repeat",
        backgroundSize: "50% 50%",        
      }}
      className="cursor-all-scroll"      
    >
    <PerspectiveCamera makeDefault   position={cameraPosition} fov={30} />

    {onPlay ? <CameraOrbit onPlay={onPlay} center={[0, 0, 0]} radius={15} /> : null} 
    

    {/* <Sky azimuth={1} inclination={0.7} distance={50} /> */}
      <CaptureScreenshot setCaptureFunction={captureScreenshot} capture={capture} />
      <OrbitControls
        minPolarAngle={Math.PI / 2.8}
        maxPolarAngle={Math.PI / 2.2}        
        minDistance={minZoom} // minimum zoom level
        maxDistance={maxZoom} // maximum zoom level   
               
      />
      <ambientLight intensity={1} />
      <directionalLight position={[10, 20, 5]} intensity={1} />
     
      

      <Model selectedOptions={selectedOptions}/>
      <Environment preset="city"  /> 
      
    </Canvas>
    </> 
  );
}

export default GarageViewer;
