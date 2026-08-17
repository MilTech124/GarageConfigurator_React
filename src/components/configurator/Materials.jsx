import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { MeshStandardMaterial } from "three";
import * as THREE from "three";
import { DoubleSide } from 'three'
import { assetPath } from '../../utils/assetPath';
import { resolveFlashingColor } from './domain/flashingColors.js';
 
const standingSeamNormalMapCache = new Map();

function createStandingSeamNormalMap(usage = "wall") {
  if (standingSeamNormalMapCache.has(usage)) {
    return standingSeamNormalMapCache.get(usage);
  }

  const textureWidth = 256;
  const textureHeight = 4;
  const data = new Uint8Array(textureWidth * textureHeight * 4);
  const seamWidth = 0.014;

  for (let y = 0; y < textureHeight; y += 1) {
    for (let x = 0; x < textureWidth; x += 1) {
      const u = (x + 0.5) / textureWidth - 0.5;
      const height = Math.exp(-(u * u) / (2 * seamWidth * seamWidth));
      const derivative = (-u / (seamWidth * seamWidth)) * height;
      const normalX = -derivative * 0.018;
      const inverseLength = 1 / Math.sqrt(normalX * normalX + 1);
      const index = (y * textureWidth + x) * 4;

      data[index] = Math.round((normalX * inverseLength * 0.5 + 0.5) * 255);
      data[index + 1] = 128;
      data[index + 2] = Math.round((inverseLength * 0.5 + 0.5) * 255);
      data[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    textureWidth,
    textureHeight,
    THREE.RGBAFormat
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  standingSeamNormalMapCache.set(usage, texture);
  return texture;
}


function Materials(selectedOptions) {
  const {
    roofColorRal,
    roofType,
    roofFlashingColorMode,
    roofFlashingColorRal,
    garageFlashingColorMode,
    garageFlashingColorRal,
    color,
    colorRal,
    emboss,
    direction,
    gateDirection,
    gateEmbose,
    gateColorRal1,
    gateColor1,
    gateColorRal2,
    gateColor2,
    gateColorRal3,
    gateColor3,
    gateType1,
    gateType2,
    gateType3,
    door,
    height,
    width,
    carportType,
  } = selectedOptions;

  //helpers
  const mainColor = () => {
    let wallMaterial;
    const isStandingSeam = emboss === "na_rabek";
    const wallDetailMap = direction === "poziom" ? normalWall : normalwall90;
    if (colorRal === null || colorRal === undefined) {
      wallMaterial = new MeshStandardMaterial({
        map:
            color === "Ocynk"
            ? ocynkTexture
            :color === "Złoty Dąb"
            ? wallTexture
            : color === "Złoty Dąb Ciemny"
            ? wallTextureDabDark
            : wallTextureOrzech,
        normalMap: isStandingSeam ? standingSeamNormalMap : wallDetailMap,
        normalScale: isStandingSeam ? new THREE.Vector2(1.55, 1) : new THREE.Vector2(1, 1),
        roughness: isStandingSeam ? 0.62 : 0.8,
        metalness: isStandingSeam ? 0.65 : 1,
        bumpScale: isStandingSeam ? 0 : -1,
        bumpMap: isStandingSeam ? null : wallDetailMap,
        side:DoubleSide
        
      });
    } else {
      wallMaterial = new MeshStandardMaterial({
        color: colorRal,
        normalMap: isStandingSeam ? standingSeamNormalMap : wallDetailMap,
        normalScale: isStandingSeam ? new THREE.Vector2(1.55, 1) : new THREE.Vector2(1, 1),
        roughness: isStandingSeam ? 0.62 : 0.9,
        metalness: isStandingSeam ? 0.62 : 0.2,
        bumpScale: isStandingSeam ? 0 : -1,
        bumpMap: isStandingSeam ? null : wallDetailMap,
        side:DoubleSide
      });
    }
    return wallMaterial;
  };

  const gateColor = (num) => {
    let gateMaterial;

    if (num === 1) {
      if (gateType1 != "segmentowa") {
        if (gateColorRal1 === null || gateColorRal1 === undefined) {
          gateMaterial = new MeshStandardMaterial({
            map:
              gateColor1 === "Złoty Dąb"
                ? wallTexture
                :gateColor1 === "Ocynk"
                ? ocynkTexture
                : gateColor1 === "Złoty Dąb Ciemny"
                ? wallTextureDabDark
                : wallTextureOrzech,
            normalMap: gateDirection === "poziom" ? normalGate : normalGate90,
            roughness: 0.8,
            metalness: 1,
            
          });
        } else {
          gateMaterial = new MeshStandardMaterial({
            color: gateColorRal1,
            normalMap: gateDirection === "poziom" ? normalGate : normalGate90,
            roughness: 0.9,
            metalness: 0.2,
          });
        }
      } else {
        if (gateColorRal1 === null || gateColorRal1 === undefined) {
          gateMaterial = new MeshStandardMaterial({
            map:
              gateColor1 === "Złoty Dąb"
                ? wallTexture
                : gateColor1 === "Złoty Dąb Ciemny"
                ? wallTextureDabDark
                : wallTextureOrzech,
            normalMap: gateSegment,
            roughness: 0.8,
            metalness: 1,
          });
        } else {
          gateMaterial = new MeshStandardMaterial({
            color:gateColorRal1,
            normalMap: gateSegment,
            roughness: 0.9,
            metalness: 0.2,
          });
          return gateMaterial;
        }
      }
    } else if (num === 2) {
      if (gateType2 != "segmentowa") {
        if (gateColorRal2 === null || gateColorRal2 === undefined) {
          gateMaterial = new MeshStandardMaterial({
            map:
              gateColor2 === "Złoty Dąb"
                ? wallTexture
                : gateColor2 === "Złoty Dąb Ciemny"
                ? wallTextureDabDark
                : wallTextureOrzech,
            normalMap: gateDirection === "poziom" ? normalGate : normalGate90,
            roughness: 0.8,
            metalness: 1,
          });
        } else {
          gateMaterial = new MeshStandardMaterial({
            color: gateColorRal2,
            normalMap: gateDirection === "poziom" ? normalGate : normalGate90,
            roughness: 0.9,
            metalness: 0.2,
          });
        }
      } else {
        if (gateColorRal2 === null || gateColorRal2 === undefined) {
          gateMaterial = new MeshStandardMaterial({
            map:
              gateColor2 === "Złoty Dąb"
                ? wallTexture
                : gateColor2 === "Złoty Dąb Ciemny"
                ? wallTextureDabDark
                : wallTextureOrzech,
            normalMap: gateSegment,
            roughness: 0.8,
            metalness: 1,
          });
        } else {
          gateMaterial = new MeshStandardMaterial({
            color:gateColorRal2,
            normalMap: gateSegment,
            roughness: 0.9,
            metalness: 0.2,
          });
          return gateMaterial;
        }
      }
    } else if (num === 3) {
      if (gateType3 != "segmentowa") {
        if (gateColorRal3 === null || gateColorRal3 === undefined) {
          gateMaterial = new MeshStandardMaterial({
            map:
              gateColor3 === "Złoty Dąb"
                ? wallTexture
                : gateColor3 === "Złoty Dąb Ciemny"
                ? wallTextureDabDark
                : wallTextureOrzech,
            normalMap: gateDirection === "poziom" ? normalGate : normalGate90,
            roughness: 0.8,
            metalness: 1,
          });
        } else {
          gateMaterial = new MeshStandardMaterial({
            color: gateColorRal3,
            normalMap: gateDirection === "poziom" ? normalGate : normalGate90,
            roughness: 0.9,
            metalness: 0.2,
          });
        }
      } else {
        if (gateColorRal3 === null || gateColorRal3 === undefined) {
          gateMaterial = new MeshStandardMaterial({
            map:
              gateColor3 === "Złoty Dąb"
                ? wallTexture
                : gateColor3 === "Złoty Dąb Ciemny"
                ? wallTextureDabDark
                : wallTextureOrzech,
            normalMap: gateSegment,
            roughness: 0.8,
            metalness: 1,
          });
        } else {
          gateMaterial = new MeshStandardMaterial({
            color:gateColorRal3,
            normalMap: gateSegment,
            roughness: 0.9,
            metalness: 0.2,
          });
          return gateMaterial;
        }
      }
    }
    return gateMaterial;
  };

  const doorNumber = (num) => {
    const doorItem = door.find((door, index) => index === num);
    return doorItem;
  };

  const doorColor = (num) => {
    let doorMaterial;
    if (door.length >= 1) {
      doorNumber(num);

      const curentDoor = doorNumber(num);
      const colorRal = curentDoor.colorRal ? curentDoor.colorRal : null;
      const color = curentDoor.color ? curentDoor.color : null;
      const doorNormalMap = createDoorNormalMap(curentDoor.emboss, gateDirection);
      if (colorRal === null || colorRal === undefined) {
        doorMaterial = new MeshStandardMaterial({
          map:
            color === "Złoty Dąb"
              ? wallTexture
              : color === "Ocynk"
              ? ocynkTexture
              : color === "Złoty Dąb Ciemny"
              ? wallTextureDabDark
              : wallTextureOrzech,
          normalMap: doorNormalMap,
          roughness: 0.8,
          metalness: 1,         
        });
      } else {
        doorMaterial = new MeshStandardMaterial({
          color: colorRal,
          normalMap: doorNormalMap,
          roughness: 0.9,
          metalness: 0.2,
        });
      }
      return doorMaterial;
    }
  };

  //textures loader
  const roofTexture = useLoader(TextureLoader, assetPath("model/roof.jpg"));
  const roofTrapezTexture = useLoader(TextureLoader, assetPath("model/trapez3.jpg"));

  const ocynkTexture = useLoader(TextureLoader, assetPath("model/ocynk.jpg"));
  const wallTexture = useLoader(TextureLoader, assetPath("model/jasny-dab-2.jpg"));
  const wallTextureDabDark = useLoader(TextureLoader, assetPath("model/dab-2.jpg"));
  const wallTextureOrzech = useLoader(TextureLoader, assetPath("model/orzech-2-kopia.jpg"));
  const normalWall = useLoader(TextureLoader, assetPath("model/normal-big-90.jpg"));
  const normalwall90 = useLoader(TextureLoader, assetPath("model/normal-big.jpg"));
  const standingSeamNormalMap = createStandingSeamNormalMap("wall");
  const roofStandingSeamNormalMap = createStandingSeamNormalMap("roof");

  const gateTexture = useLoader(TextureLoader, assetPath("model/jasny-dab-2.jpg"));
  const normalGate = useLoader(TextureLoader, assetPath("model/normal-big-90-gate.jpg"));
  const normalGate90 = useLoader(TextureLoader, assetPath("model/normal-big-gate.jpg"));
  const gateSegment = useLoader(TextureLoader, assetPath("model/segmentowa.jpg"));

  const azuryTexture = useLoader(TextureLoader, assetPath("model/azury.png"));
  const alphatexture = useLoader(TextureLoader, assetPath("model/alpha-azury.png"));

  //textures uv
  ocynkTexture.repeat.set(2*(3*width/6), 1);
  ocynkTexture.wrapS = THREE.RepeatWrapping;
  ocynkTexture.wrapT = THREE.RepeatWrapping;
  
  roofTexture.repeat.set(1.4, 1.4);
  roofTexture.wrapS = THREE.RepeatWrapping;
  roofTexture.wrapT = THREE.RepeatWrapping;

  roofTrapezTexture.repeat.set(5*(width/6), 1);
  roofTrapezTexture.wrapS = THREE.RepeatWrapping;
  roofTrapezTexture.wrapT = THREE.RepeatWrapping;

  wallTexture.repeat.set(0.5, 0.5);;
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;

  wallTextureDabDark.repeat.set(0.5, 0.5);;
  wallTextureDabDark.wrapS = THREE.RepeatWrapping;
  wallTextureDabDark.wrapT = THREE.RepeatWrapping;

  wallTextureOrzech.repeat.set(0.5, 0.5);
  wallTextureOrzech.wrapS = THREE.RepeatWrapping;
  wallTextureOrzech.wrapT = THREE.RepeatWrapping;

  azuryTexture.repeat.set(1, 1);
  azuryTexture.wrapS = THREE.RepeatWrapping;
  azuryTexture.wrapT = THREE.RepeatWrapping;
  

  normalWall.repeat.set(
    1,
    emboss !== "szerokie" ? 5 * (height / 213) : 3.5 * (height / 213)
  );
  normalWall.wrapS = THREE.RepeatWrapping;
  normalWall.wrapT = THREE.RepeatWrapping;

  normalwall90.repeat.set(
    emboss !== "szerokie" ? (11 * width) / 6 : (6 * width) / 6,
    6
  );
  normalwall90.wrapS = THREE.RepeatWrapping;
  normalwall90.wrapT = THREE.RepeatWrapping;

  standingSeamNormalMap.repeat.set(Math.max(1, width / 0.5), 1);
  standingSeamNormalMap.needsUpdate = true;

  roofStandingSeamNormalMap.repeat.set(Math.max(1, width / 0.5), 1);
  roofStandingSeamNormalMap.needsUpdate = true;

  gateTexture.repeat.set(1, 1);
  gateTexture.wrapS = THREE.RepeatWrapping;
  gateTexture.wrapT = THREE.RepeatWrapping;

  gateSegment.repeat.set(1, 2);
  gateSegment.wrapS = THREE.RepeatWrapping;
  gateSegment.wrapT = THREE.RepeatWrapping;

  normalGate.repeat.set(1, gateEmbose !== "szerokie" ? 5.2 : 3, 1);
  normalGate.wrapS = THREE.RepeatWrapping;
  normalGate.wrapT = THREE.RepeatWrapping;

  normalGate90.repeat.set(gateEmbose !== "szerokie" ? 5.2 : 3, 1);
  normalGate90.wrapS = THREE.RepeatWrapping;
  normalGate90.wrapT = THREE.RepeatWrapping;

  const createDoorNormalMap = (doorEmboss, doorDirection) => {
    const isHorizontal = doorDirection === "poziom";
    const texture = (isHorizontal ? normalGate : normalGate90).clone();
    const embossRepeat = doorEmboss === "szerokie" ? 3 : 5.2;

    texture.repeat.set(isHorizontal ? 1 : embossRepeat, isHorizontal ? embossRepeat : 1);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
  };

  //materials
  const isRoofTile = roofType === "blachodachówka";
  const isRoofStandingSeam = roofType === "na_rabek";
  const roofDetailMap = isRoofStandingSeam
    ? roofStandingSeamNormalMap
    : isRoofTile
    ? roofTexture
    : roofTrapezTexture;
  const roofMaterial = new MeshStandardMaterial({
    map: isRoofTile || isRoofStandingSeam ? null : roofTrapezTexture,
    normalMap: roofDetailMap,
    normalScale: isRoofStandingSeam
      ? new THREE.Vector2(1.65, 1)
      : new THREE.Vector2(1, 1),
    color: roofColorRal,
    roughness: isRoofStandingSeam ? 0.62 : 0.9,
    metalness: isRoofStandingSeam ? 0.65 : isRoofTile ? 0.6 : 0.4,
    bumpMap: isRoofStandingSeam ? null : roofDetailMap,
    side: DoubleSide,
  });

  const inheritedGarageTrimTexture =
    color === "Ocynk"
      ? ocynkTexture
      : color === "Złoty Dąb"
      ? wallTexture
      : color === "Złoty Dąb Ciemny"
      ? wallTextureDabDark
      : color === "Orzech"
      ? wallTextureOrzech
      : null;

  const roofFlashingMaterial = new MeshStandardMaterial({
    color: resolveFlashingColor(
      roofFlashingColorMode,
      roofFlashingColorRal,
      roofColorRal
    ),
    roughness: 0.58,
    metalness: 0.68,
  });

  const garageFlashingMaterial = new MeshStandardMaterial({
    color: resolveFlashingColor(
      garageFlashingColorMode,
      garageFlashingColorRal,
      colorRal,
      garageFlashingColorMode === "custom" ? colorRal || "#272C38" : "#ffffff"
    ),
    map: garageFlashingColorMode === "custom" ? null : inheritedGarageTrimTexture,
    roughness: 0.6,
    metalness: 0.65,
  });


  const azuryMaterialChose = () => {
    let material;
    if (carportType==="azury"){
      if (colorRal === null || colorRal === undefined)  {
        material = new MeshStandardMaterial({
          map:
          color === "Ocynk"
          ? ocynkTexture
          :color === "Złoty Dąb"
          ? wallTexture
          // : color === "Złoty Dąb Ciemny"
          // ? wallTextureDabDark
          : color === "Orzech"
          ? wallTextureOrzech    
          : null,
          alphaMap: alphatexture,
          color: colorRal,
          roughness: 0.8,        
          metalness: 1,
          bumpScale: -1,  
          transparent: true,
          side:DoubleSide
        });
      } else {
        material = new MeshStandardMaterial({
          color: colorRal,
          alphaMap: alphatexture,
          roughness: 0.9,        
          metalness: .2,
          bumpScale: -1,  
          transparent: true,
          side:DoubleSide   
        });
      }  
      return material
    }
    if (carportType ==="oblachowane"){
      return mainColor()
     } 
     if (carportType ==="mix"){
      if (colorRal === null || colorRal === undefined)  {
        material = new MeshStandardMaterial({
          map:
          color === "Ocynk"
          ? ocynkTexture
          :color === "Złoty Dąb"
          ? wallTexture
          // : color === "Złoty Dąb Ciemny"
          // ? wallTextureDabDark
          : color === "Orzech"
          ? wallTextureOrzech    
          : null,
          alphaMap: alphatexture,
          color: colorRal,
          roughness: 0.8,        
          metalness: 1,
          bumpScale: -1,  
          transparent: true,
          side:DoubleSide
        });
      } else {
        material = new MeshStandardMaterial({
          color: colorRal,
          alphaMap: alphatexture,
          roughness: 0.9,        
          metalness: .2,
          bumpScale: -1,  
          transparent: true,
          side:DoubleSide   
        });
      }  
  
      return {material1:mainColor() ,material2:material}
     }
  }





  const wallMaterial = mainColor();
  const gateMaterial1 = gateColor(1);
  const gateMaterial2 = gateColor(2);
  const gateMaterial3 = gateColor(3);
  const azuryMaterial = azuryMaterialChose();
  // const gateMaterial2 = gateColor(2);
  // const gateMaterial3 = gateColor(3);


  let doorMaterial1;
  let doorMaterial2;
  let doorMaterial3;
  let doorMaterial4;
  let doorMaterial5;
  doorMaterial1 = door.length >= 1 ? doorColor(0) : doorMaterial1;
  doorMaterial2 = door.length >= 2 ? doorColor(1) : doorMaterial2;
  doorMaterial3 = door.length >= 3 ? doorColor(2) : doorMaterial3;
  doorMaterial4 = door.length >= 4 ? doorColor(3) : doorMaterial4;
  doorMaterial5 = door.length >= 5 ? doorColor(4) : doorMaterial5;

  return {
    roofMaterial,
    wallMaterial,
    roofFlashingMaterial,
    garageFlashingMaterial,
    gateMaterial1,
    gateMaterial2,
    gateMaterial3,
    doorMaterial1,
    doorMaterial2,
    doorMaterial3,
    doorMaterial4,
    doorMaterial5,
    azuryMaterial,    
  };
}

export default Materials;
