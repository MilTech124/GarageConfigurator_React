import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Model } from "./Model";
import { LANG } from "./i18n";
import { useRef, useEffect, useState } from "react";
import { Button } from "@mui/material";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import DownloadIcon from "@mui/icons-material/Download";

function CaptureScreenshot({ setCaptureFunction, capture }) {
  const { gl } = useThree();

  useEffect(() => {
    if (capture) {
      const imageData = gl.domElement.toDataURL("image/png");
      setCaptureFunction(imageData);
    }
  }, [capture, gl, setCaptureFunction]);

  return null;
}

function CameraOrbit({ center = [0, 0, 0], radius = 10 }) {
  const cameraRef = useRef(null);
  const angleRef = useRef(0);

  useFrame(() => {
    angleRef.current += 0.008;
    const x = center[0] + radius * Math.sin(angleRef.current);
    const z = center[2] + radius * Math.cos(angleRef.current);

    if (cameraRef.current) {
      cameraRef.current.position.set(x, 3, z);
      cameraRef.current.lookAt(...center);
    }
  });

  return <PerspectiveCamera makeDefault ref={cameraRef} fov={30} position={[10, 0, 5]} />;
}

function GarageViewer({ selectedOptions, captureScreenshot, capture, lang, setLang }) {
  const wpConfig = window.__CONFIGURATOR_PLUGIN__ || {};
  const logoUrl = wpConfig.logoUrl || null;

  const rendererRef = useRef(null);
  const [cameraPosition, setCameraPosition] = useState([15, 8, 4]);
  const [onPlay, setOnPlay] = useState(false);

  const maxZoom = 20;
  const minZoom = 12;

  const downloadCurrentView = () => {
    const renderer = rendererRef.current;
    if (!renderer || !renderer.domElement) return;

    const imageData = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `garaz-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="absolute right-2 top-2 z-10 flex gap-1 py-2 max-sm:py-0.5 max-sm:gap-[2px]">
        <div className="flex flex-col gap-1 max-sm:gap-[2px]">
          <Button variant="contained" color="error" sx={{ minWidth: { xs: 22, md: 64 }, padding: { xs: '2px', md: '8px' } }} onClick={() => setOnPlay(!onPlay)}>
            <PlayCircleIcon sx={{ fontSize: { xs: '0.8rem', md: '1.5rem' } }} />
          </Button>
          <Button variant="contained" color="primary" sx={{ minWidth: { xs: 22, md: 64 }, padding: { xs: '2px', md: '8px' } }} onClick={downloadCurrentView}>
            <DownloadIcon sx={{ fontSize: { xs: '0.8rem', md: '1.5rem' } }} />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-0.5 max-sm:gap-[2px]">
          <button
            className={`max-sm:w-7 max-sm:px-0 max-sm:py-[1px] max-sm:text-[8px] md:w-20 md:px-3 md:py-2 md:text-sm text-xs rounded leading-none ${lang === LANG.PL ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}
            onClick={() => setLang(LANG.PL)}
          >
            PL
          </button>
          <button
            className={`max-sm:w-7 max-sm:px-0 max-sm:py-[1px] max-sm:text-[8px] md:w-20 md:px-3 md:py-2 md:text-sm text-xs rounded leading-none ${lang === LANG.CS ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}
            onClick={() => setLang(LANG.CS)}
          >
            CZ
          </button>
          <button
            className={`max-sm:w-7 max-sm:px-0 max-sm:py-[1px] max-sm:text-[8px] md:w-20 md:px-3 md:py-2 md:text-sm text-xs rounded leading-none ${lang === LANG.SL ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}
            onClick={() => setLang(LANG.SL)}
          >
            SK
          </button>
          <button
            className={`max-sm:w-7 max-sm:px-0 max-sm:py-[1px] max-sm:text-[8px] md:w-20 md:px-3 md:py-2 md:text-sm text-xs rounded leading-none ${lang === LANG.HU ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}
            onClick={() => setLang(LANG.HU)}
          >
            HU
          </button>
        </div>
      </div>

      {logoUrl ? (
        <div className="absolute left-0 top-0 md:w-[250px] w-20 z-20 pointer-events-none">
          <img src={logoUrl} alt="configurator-logo" />
        </div>
      ) : null}

      <p className="absolute font-semibold bottom-2 max-sm:text-xs md:bottom-5 md:right-10 right-2 text-slate-800 z-20 hover:text-red-800 hover:cursor-pointer">
        Realizacja <a className="font-bold" target="_blank" href="https://www.mil-tech.pl/">MIL-TECH</a>
      </p>

      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          rendererRef.current = gl;
        }}
        className="cursor-all-scroll"
      >
        <PerspectiveCamera makeDefault position={cameraPosition} fov={30} />

        {onPlay ? <CameraOrbit center={[0, 0, 0]} radius={15} /> : null}

        <CaptureScreenshot setCaptureFunction={captureScreenshot} capture={capture} />
        <OrbitControls
          enableZoom
          minPolarAngle={Math.PI / 2.8}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={minZoom}
          maxDistance={maxZoom}
        />

        <ambientLight intensity={1} />
        <directionalLight position={[10, 20, 5]} intensity={1} />

        <Model selectedOptions={selectedOptions} />
        <Environment preset="city" />
      </Canvas>
    </>
  );
}

export default GarageViewer;
