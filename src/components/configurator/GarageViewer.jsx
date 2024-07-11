import { Suspense } from "react";
import { Canvas, extend, useThree } from '@react-three/fiber'
import { Environment } from "@react-three/drei";
import { OrbitControls, ContactShadows,Sky } from "@react-three/drei";
import { Model } from "./Model";
import { useRef, useEffect } from "react";


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



function GarageViewer({ selectedOptions ,captureScreenshot,capture }) {

  const canvasRef = useRef();



  return (  
    <Canvas gl={{ preserveDrawingBuffer: true }} 
      camera={{ position: [20, 0, 5], fov: 30,}}
      style={{
        // background: "url(/logo-black.png)",
        backgroundRepeat: "repeat",
        backgroundSize: "50% 50%",        
      }}
      className="cursor-all-scroll"
    >
    {/* <Sky azimuth={1} inclination={0.6} distance={1000} /> */}
      <CaptureScreenshot setCaptureFunction={captureScreenshot} capture={capture} />
      <OrbitControls
        minPolarAngle={Math.PI / 2.8}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={0} // minimum zoom level
        maxDistance={100} // maximum zoom level            
      />
      <ambientLight intensity={1} />
      <directionalLight position={[20, 20, 5]} intensity={0.5} />
      <ContactShadows
        // frames={1}
        position={[0, -0.5, 0]}
        blur={1}
        opacity={0.75}
      />
      

      <Model selectedOptions={selectedOptions}/>
      <Environment preset="city"  /> 
    </Canvas>
   
  );
}

export default GarageViewer;
