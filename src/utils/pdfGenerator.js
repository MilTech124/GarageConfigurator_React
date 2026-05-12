import { jsPDF } from "jspdf";

const ROOF_RISE_CM_PER_METER = 10;

const C_WALL = [50, 50, 50];
const C_ROOF = [150, 50, 50];
const C_GATE = [40, 80, 180];
const C_DOOR = [50, 150, 50];
const C_WINDOW = [190, 170, 40];
const C_CARPORT = [140, 100, 40];
const C_DIM = [0, 0, 0];
const C_FILL = [238, 238, 243];
const C_ROOF_FILL = [245, 232, 232];
const C_GATE_FILL = [190, 210, 245];
const C_DOOR_FILL = [200, 240, 200];
const C_WIN_FILL = [255, 250, 195];
const C_CARPORT_FILL = [250, 240, 220];

const PW = 210, PH = 297, ML = 12;
const OVERHANG_CM = 40;
const SIDE_KEYS = ["lewo","prawo","przod","tyl"];

function t(text) {
  if (!text) return "";
  return String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L");
}

function roofKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateOrderPdf(config) {
  const { garage, contact, price, lang = "pl" } = config;
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  doc.setFont("helvetica");

  const widthCm = (parseFloat(garage.width) || 6) * 100;
  const depthCm = (parseFloat(garage.depth) || 6) * 100;
  const heightCm = parseFloat(garage.height) || 213;
  const doors = Array.isArray(garage.doorList) && garage.doorList.length > 0 ? garage.doorList : parseItems(garage.doors);
  const windows = Array.isArray(garage.windowList) && garage.windowList.length > 0 ? garage.windowList : parseItems(garage.windows);
  const hasCarport = !!garage.carport;
  const carportWidthCm = (parseFloat(garage.carportWidth) || 3) * 100;
  const carportSide = garage.carportSide || "lewo";
  const roofGeo = calcRoofGeometry(garage.roof, widthCm, depthCm, hasCarport, carportWidthCm, carportSide);

  // ===== PAGE 1 =====
  let y = ML;
  const x0 = ML;
  doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text("ZAPYTANIE OFERTOWE", PW / 2, y + 6, { align: "center" }); y += 10;
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(t(`Data: ${new Date().toLocaleString("pl-PL")}`), PW / 2, y + 4, { align: "center" }); y += 10;

  const section = (title, yy) => {
    doc.setFillColor(31, 41, 55); doc.setTextColor(255, 255, 255);
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.rect(x0, yy, PW - 2 * ML, 7, "F");
    doc.text(t(title), x0 + 3, yy + 5); doc.setTextColor(0, 0, 0); return yy + 7;
  };
  const row = (label, value, yy) => {
    doc.setFillColor(245, 245, 245); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.rect(x0, yy, 55, 5.5, "F"); doc.text(t(label), x0 + 2, yy + 4);
    doc.setFont("helvetica", "normal"); doc.line(x0, yy + 5.5, x0 + PW - 2 * ML, yy + 5.5);
    doc.text(t(String(value || "-")), x0 + 57, yy + 4); return yy + 5.5;
  };

  y = section("Dane kontaktowe", y);
  y = row("Imie i nazwisko", contact.name, y);
  y = row("Email", contact.email, y);
  y = row("Telefon", contact.phone, y);
  y = row("Kod pocztowy", contact.postal_code, y);
  y = row("Miasto", contact.city, y);
  y = row("Adres dostawy", contact.address, y);
  y = row("Wiadomosc", contact.message, y); y += 3;

  y = section("Konfiguracja garazu", y);
  y = row("Szerokosc", `${garage.width} m`, y);
  y = row("Glebokosc", `${garage.depth} m`, y);
  y = row("Wysokosc", `${garage.height} cm`, y);
  y = row("Kolor", t(garage.color) + (garage.colorRal ? ` (${garage.colorRal})` : ""), y);
  y = row("Tloczenie", t(garage.emboss), y);
  y = row("Kierunek", t(garage.direction), y);
  y = row("Typ spadu", t(garage.roof), y);
  y = row("Kolor dachu", t(garage.roofColor) + (garage.roofColorRal ? ` (${garage.roofColorRal})` : ""), y);
  y = row("Pokrycie dachu", t(garage.roofType), y); y += 3;

  const gc = parseInt(garage.gateCount) || 0;
  y = section(`Bramy (${gc})`, y);
  if (garage.gateEmbose) y = row("Tloczenie bram", t(garage.gateEmbose), y);
  if (garage.gateDirection) y = row("Kierunek bram", t(garage.gateDirection), y);
  for (let i = 1; i <= Math.min(3, gc); i++) {
    const gt = garage[`gateType${i}`]; if (!gt) continue;
    const gc2 = garage[`gateColor${i}`];
    y = row(`Brama ${i}`, `${t(gt)}, ${gc2?t(gc2)+", ":""}${garage[`gateWidth${i}`]}m x ${garage[`gateHeight${i}`]}cm, od lewej: ${garage[`gatePositionValue${i}`] || 0}cm`, y);
  } y += 3;

  if (doors.length > 0) { y = section(`Drzwi (${doors.length})`, y); doors.forEach((d, i) => { y = row(`Drzwi ${i+1}`, `${d.size||"-"}, ${t(d.position)||"-"}, od lewej: ${d.positionValue||"-"}cm`, y); }); y += 3; }
  if (windows.length > 0) { y = section(`Okna (${windows.length})`, y); windows.forEach((w, i) => { y = row(`Okno ${i+1}`, `${w.size||"-"}, ${t(w.position)||"-"}, od lewej: ${w.positionValue||"-"}cm`, y); }); y += 3; }
  if (hasCarport) {
    y = section("Wiata", y);
    y = row("Szerokosc", `${garage.carportWidth} m`, y);
    y = row("Strona", t(carportSide), y);
    if (garage.carportType) y = row("Typ", t(garage.carportType), y);
    if (garage.carportSides) {
      const s = garage.carportSides;
      const sides = selectedCarportSides(s, garage.roof);
      if (sides.length) y = row("Sciany boczne", sides.map(t).join(", "), y);
    }
    if (garage.carportSides2) {
      const s2 = garage.carportSides2;
      const sides2 = selectedCarportSides(s2, garage.roof);
      if (sides2.length) y = row("Ażury", sides2.map(t).join(", "), y);
    }
    y += 3;
  }

  const addons = [];
  if (garage.gutter) addons.push(["Rynny", "Tak"]);
  if (garage.automatic) addons.push(["Automatyka", `Tak (${garage.countAutomatic||1} szt.)`]);
  if (garage.filc) addons.push(["Filc", "Tak"]);
  if (garage.transport) addons.push(["Transport", "Tak" + (garage.wojewodztwo ? ` (${t(garage.wojewodztwo)})` : "")]);
  if (addons.length > 0) {
    y = section("Dodatki", y);
    addons.forEach(([label, value]) => { y = row(label, value, y); });
  }
  if (price) { doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text(t(`Cena: ${price} PLN`), PW-ML, y+6, {align:"right"}); }

  // ===== PAGE 2 =====
  doc.addPage("a4", "p");
  doc.setFontSize(14); doc.setFont("helvetica","bold");
  doc.text("RYSUNKI TECHNICZNE", PW/2, ML+6, {align:"center"});

  const colW=92, rowH=85, gapX=6, gapY=5, x0v=10, y0v=20;
  const shared = {widthCm, depthCm, heightCm, garage, doors, windows, roofGeo, hasCarport, carportWidthCm, carportSide};

  [
    {wall:"front", label:"WIDOK PRZOD"},
    {wall:"back", label:"WIDOK TYL"},
    {wall:"left", label:"WIDOK LEWO"},
    {wall:"right", label:"WIDOK PRAWO"},
  ].forEach((v,i) => {
    const col=i%2, r=Math.floor(i/2);
    const xx=x0v+col*(colW+gapX), yy=y0v+r*(rowH+gapY);
    drawViewFrame(doc, xx, yy, colW, rowH, v.label);
    drawElevationView(doc, v.wall, {vx:xx, vy:yy, colW, rowH, ...shared});
  });

  const topY=y0v+2*(rowH+gapY), topX=x0v;
  drawViewFrame(doc, topX, topY, colW, rowH, "WIDOK Z GORY");
  drawTopView(doc, {vx:topX, vy:topY, colW, rowH, ...shared});
  return doc;
}

// =====================================================================
// Helpers
// =====================================================================
function drawViewFrame(doc,x,y,w,h,label) {
  doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(80,80,80);
  doc.text(label,x+w/2,y+4,{align:"center"});doc.setTextColor(0,0,0);
  doc.setDrawColor(200,200,200);doc.setLineWidth(0.2);doc.rect(x,y+5,w,h-5);doc.setDrawColor(0,0,0);
}
function calcScale(aw,ah,rwCm,rhCm) {
  const m=14,rv=rwCm/10,rh=rhCm/10;
  if(rv<=0||rh<=0) return 1;
  return Math.min((aw-m)/rv,(ah-m)/rh);
}
function wallHeight(wall,garage,hCm,rg) {
  if(rg.type==="single"){
    if(wall===shw(garage.roof))return hCm+rg.riseCm;
    if(wall===slw(garage.roof))return hCm;
    return hCm+rg.riseCm/2;
  } return hCm;
}
function isSideCarport(side){return side==="lewo"||side==="prawo";}
function isFrontBackCarport(side){return side==="przod"||side==="tyl";}
function carportVisibleOnElevation(wall,side){
  const isFB=wall==="front"||wall==="back";
  return (isFB&&isSideCarport(side))||(!isFB&&isFrontBackCarport(side));
}
function carportBeforeElevation(wall,side){
  if(wall==="front") return side==="lewo";
  if(wall==="back") return side==="prawo";
  if(wall==="left") return side==="przod";
  if(wall==="right") return side==="tyl";
  return false;
}
function attachedCarportSide(side){return{lewo:"prawo",prawo:"lewo",przod:"tyl",tyl:"przod"}[side]||"";}
function mapCarportSideForRoof(side,roof){
  const rk=roofKey(roof);
  if(rk==="spad przod") return {przod:"tyl",tyl:"przod",lewo:"prawo",prawo:"lewo"}[side]||side;
  if(rk==="spad w lewo") return {przod:"prawo",tyl:"lewo",lewo:"przod",prawo:"tyl"}[side]||side;
  if(rk==="spad w prawo") return {przod:"lewo",tyl:"prawo",lewo:"tyl",prawo:"przod"}[side]||side;
  return side;
}
function selectedCarportSides(sides,roof){
  return SIDE_KEYS.filter(key=>SIDE_KEYS.some(src=>!!sides[src]&&mapCarportSideForRoof(src,roof)===key));
}
function roofSpanWithCarport(spanCm,axis,hasCarport,carportWidthCm,carportSide){
  if(!hasCarport) return spanCm;
  if(axis==="width"&&isSideCarport(carportSide)) return spanCm+carportWidthCm;
  if(axis==="depth"&&isFrontBackCarport(carportSide)) return spanCm+carportWidthCm;
  return spanCm;
}
function shw(r){return{"spad tyl":"front","spad przod":"back","spad w lewo":"right","spad w prawo":"left"}[roofKey(r)]||"front";}
function slw(r){return{"spad tyl":"back","spad przod":"front","spad w lewo":"left","spad w prawo":"right"}[roofKey(r)]||"back";}
function roofRiseFromSpan(spanCm){return (spanCm/100)*ROOF_RISE_CM_PER_METER;}
function roofAngleFromRise(riseCm,runCm){return runCm>0?Number((Math.atan(riseCm/runCm)*180/Math.PI).toFixed(1)):0;}
function calcRoofGeometry(roof,wCm,dCm,hasCarport=false,carportWidthCm=0,carportSide="") {
  const rk = roofKey(roof);
  if(["spad tyl","spad przod","spad w lewo","spad w prawo"].includes(rk)){
    const axis=["spad tyl","spad przod"].includes(rk)?"depth":"width";
    const spanCm=roofSpanWithCarport(axis==="depth"?dCm:wCm,axis,hasCarport,carportWidthCm,carportSide);
    const riseCm=roofRiseFromSpan(spanCm);
    return{type:"single",riseCm,angle:roofAngleFromRise(riseCm,spanCm)};
  }
  if(["dwuspad","dwuspad przod-tyl"].includes(rk)){
    const axis=rk==="dwuspad"?"width":"depth";
    const spanCm=roofSpanWithCarport(axis==="width"?wCm:dCm,axis,hasCarport,carportWidthCm,carportSide);
    const riseCm=roofRiseFromSpan(spanCm);
    return{type:"dual",riseCm,angle:roofAngleFromRise(riseCm,spanCm/2)};
  }
  return{type:"flat",riseCm:0,angle:0};
}

// =====================================================================
// Elevation View
// =====================================================================
function drawElevationView(doc, wall, ctx) {
  const {vx,vy,colW,rowH,widthCm,depthCm,heightCm,garage,doors,windows,roofGeo,hasCarport,carportWidthCm,carportSide}=ctx;
  const roof=garage.roof;
  const rk=roofKey(roof);
  const dTop=vy+8, dH=rowH-15, dW=colW-14;
  const cx=vx+colW/2, by=dTop+dH;

  const isFB=wall==="front"||wall==="back";
  const visW=isFB?widthCm:depthCm;
  const wallH=wallHeight(wall,garage,heightCm,roofGeo);
  const showCarport=hasCarport&&carportVisibleOnElevation(wall,carportSide);
  const carportBefore=showCarport&&carportBeforeElevation(wall,carportSide);

  const isDwuspad = rk==="dwuspad";
  const isDwuspadFT = rk==="dwuspad przod-tyl";
  const gableVisible = (isDwuspad && isFB) || (isDwuspadFT && !isFB);
  const slopeVisible = (isDwuspad && !isFB) || (isDwuspadFT && isFB);
  const isSingleSlope = roofGeo.type==="single" &&
    ((isFB && (rk==="spad w lewo"||rk==="spad w prawo")) ||
     (!isFB && ["spad tyl","spad przod"].includes(rk)));

  let totalVisW = visW;
  if(showCarport) totalVisW = visW + carportWidthCm;

  let maxH = wallH;
  if(gableVisible || slopeVisible) maxH = wallH + roofGeo.riseCm;
  if(isSingleSlope) {
    let lH=wallHeight("left",garage,heightCm,roofGeo), rH=wallHeight("right",garage,heightCm,roofGeo);
    if(isFB && wall==="back")[lH,rH]=[rH,lH];
    if(!isFB){let fH=wallHeight("front",garage,heightCm,roofGeo),bH=wallHeight("back",garage,heightCm,roofGeo);if(wall==="right")[fH,bH]=[bH,fH];lH=fH;rH=bH;}
    if(showCarport){const s=(rH-lH)/visW;if(carportBefore)lH-=carportWidthCm*s;else rH+=carportWidthCm*s;}
    maxH = Math.max(lH,rH);
  }

  const scale = calcScale(dW, dH, totalVisW, maxH);
  const garagePW = visW/10*scale;
  const ph = wallH/10*scale;
  const pr = roofGeo.riseCm/10*scale;
  const ohMm = (OVERHANG_CM/10)*scale;
  const cwMm = (carportWidthCm/10)*scale;

  // Combined structure: one continuous wall, roof centered on total width.
  let lx, rx, garageLx, garageRx, totalPW;
  if(showCarport && carportBefore) {
    totalPW=garagePW+cwMm; lx=cx-totalPW/2; rx=cx+totalPW/2;
    garageLx=lx+cwMm; garageRx=rx;
  } else if(showCarport) {
    totalPW=garagePW+cwMm; lx=cx-totalPW/2; rx=cx+totalPW/2;
    garageLx=lx; garageRx=lx+garagePW;
  } else {
    totalPW=garagePW; lx=cx-totalPW/2; rx=cx+totalPW/2;
    garageLx=lx; garageRx=rx;
  }

  // Helper: mark carport area (lighter fill, posts, label)
  const markCp = (topL, topR) => {
    if(!showCarport) return;
    const cpL=carportBefore?lx:garageRx, cpR=carportBefore?garageLx:rx;
    setFill(doc,C_CARPORT_FILL);
    doc.rect(cpL,topL,cpR-cpL,by-topL,"F");
    doc.setDrawColor(C_CARPORT[0],C_CARPORT[1],C_CARPORT[2]);doc.setLineWidth(0.6);
    doc.line(cpL,by,cpL,topL); doc.line(cpR,by,cpR,topL);
    doc.setFontSize(4);doc.setFont("helvetica","bold");
    doc.setTextColor(C_CARPORT[0],C_CARPORT[1],C_CARPORT[2]);
    doc.text("WIATA",(cpL+cpR)/2,(topL+by)/2+1,{align:"center"});
    doc.setTextColor(0,0,0);
    drawDimH(doc,cpL,cpR,by+8,fmtM(carportWidthCm));
  };

  if(isSingleSlope) {
    let leftH=wallHeight("left",garage,heightCm,roofGeo), rightH=wallHeight("right",garage,heightCm,roofGeo);
    if(isFB && wall==="back")[leftH,rightH]=[rightH,leftH];
    if(!isFB){let fH=wallHeight("front",garage,heightCm,roofGeo),bH=wallHeight("back",garage,heightCm,roofGeo);if(wall==="right")[fH,bH]=[bH,fH];leftH=fH;rightH=bH;}
    if(showCarport){const s=(rightH-leftH)/visW;if(carportBefore)leftH-=carportWidthCm*s;else rightH+=carportWidthCm*s;}
    const plH=leftH/10*scale, prH=rightH/10*scale;
    setDraw(doc,C_WALL);doc.setLineWidth(0.5);setFill(doc,C_FILL);
    drawTrap(doc,lx,by,rx,by,rx,by-prH,lx,by-plH);
    // Carport trapezoid overlay
    if(showCarport){
      const cpL=carportBefore?lx:garageRx, cpR=carportBefore?garageLx:rx;
      const f=cwMm/totalPW;
      const cpLH=carportBefore?plH:plH+(prH-plH)*(garagePW/totalPW);
      const cpRH=carportBefore?plH+(prH-plH)*f:prH;
      setFill(doc,C_CARPORT_FILL);
      drawTrap(doc,cpL,by,cpR,by,cpR,by-cpRH,cpL,by-cpLH);
      doc.setDrawColor(C_CARPORT[0],C_CARPORT[1],C_CARPORT[2]);doc.setLineWidth(0.6);
      doc.line(cpL,by,cpL,by-cpLH); doc.line(cpR,by,cpR,by-cpRH);
      doc.setFontSize(4);doc.setFont("helvetica","bold");
      doc.setTextColor(C_CARPORT[0],C_CARPORT[1],C_CARPORT[2]);
      doc.text("WIATA",(cpL+cpR)/2,by-(cpLH+cpRH)/4+1,{align:"center"});
      doc.setTextColor(0,0,0);
      drawDimH(doc,cpL,cpR,by+8,fmtM(carportWidthCm));
    }
    drawOpenings(doc,wall,garageLx,by,garagePW,visW,wallH,scale,doors,windows,garage);
    setDraw(doc,C_ROOF);doc.setLineWidth(0.7);setFill(doc,C_ROOF_FILL);
    drawTrap(doc,lx-ohMm,by-plH,rx+ohMm,by-prH,rx+ohMm,by-prH-ohMm*0.15,lx-ohMm,by-plH-ohMm*0.15);
    drawDimH(doc,lx,rx,by+3,fmtM(totalVisW));
    drawDimV(doc,lx-4,by,by-plH,fmtCm(leftH));
    if(Math.abs(leftH-rightH)>1) drawDimV(doc,rx+4,by,by-prH,fmtCm(rightH));
    if(roofGeo.angle>0) drawAngleLabel(doc,lx,by-plH,rx,by-prH,roofGeo.angle,Math.max(plH,prH));

  } else if(gableVisible) {
    const wallTopY=by-ph;
    setDraw(doc,C_WALL);doc.setLineWidth(0.5);setFill(doc,C_FILL);
    doc.rect(lx,wallTopY,totalPW,ph,"FD");
    markCp(wallTopY,wallTopY);
    drawOpenings(doc,wall,garageLx,by,garagePW,visW,wallH,scale,doors,windows,garage);
    const ridgeX=cx;
    setDraw(doc,C_ROOF);doc.setLineWidth(0.7);setFill(doc,C_ROOF_FILL);
    drawTri(doc,lx-ohMm,wallTopY,rx+ohMm,wallTopY,ridgeX,wallTopY-pr);
    drawDimH(doc,lx,rx,by+3,fmtM(totalVisW));
    drawDimV(doc,lx-4,by,wallTopY,fmtCm(wallH));
    drawDimV(doc,rx+4,by,wallTopY-pr,fmtCm(wallH+roofGeo.riseCm));
    if(roofGeo.angle>0) drawAngleLabel(doc,lx-ohMm,wallTopY,ridgeX,wallTopY-pr,roofGeo.angle,pr);

  } else if(slopeVisible) {
    const wallTopY=by-ph;
    setDraw(doc,C_WALL);doc.setLineWidth(0.5);setFill(doc,C_FILL);
    doc.rect(lx,wallTopY,totalPW,ph,"FD");
    markCp(wallTopY,wallTopY);
    drawOpenings(doc,wall,garageLx,by,garagePW,visW,wallH,scale,doors,windows,garage);
    const ridgeY=wallTopY-pr;
    setDraw(doc,C_ROOF);doc.setLineWidth(0.7);setFill(doc,C_ROOF_FILL);
    doc.triangle(lx-ohMm,wallTopY,rx+ohMm,wallTopY,rx+ohMm,ridgeY,"FD");
    doc.triangle(lx-ohMm,wallTopY,rx+ohMm,ridgeY,lx-ohMm,ridgeY,"FD");
    drawDimH(doc,lx,rx,by+3,fmtM(totalVisW));
    drawDimV(doc,lx-4,by,wallTopY,fmtCm(wallH));
    drawDimV(doc,rx+4,by,ridgeY,fmtCm(wallH+roofGeo.riseCm));

  } else {
    const wallTopY=by-ph;
    setDraw(doc,C_WALL);doc.setLineWidth(0.5);setFill(doc,C_FILL);
    doc.rect(lx,wallTopY,totalPW,ph,"FD");
    markCp(wallTopY,wallTopY);
    drawOpenings(doc,wall,garageLx,by,garagePW,visW,wallH,scale,doors,windows,garage);
    setDraw(doc,C_ROOF);doc.setLineWidth(0.7);
    doc.line(lx-ohMm,wallTopY,rx+ohMm,wallTopY);
    drawDimH(doc,lx,rx,by+3,fmtM(totalVisW));
    drawDimV(doc,lx-4,by,wallTopY,fmtCm(wallH));
  }
}
// =====================================================================
function drawAngleLabel(doc,x1,y1,x2,y2,angleDeg,heightMm) {
  if(heightMm < 5) return;
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  const angleRad=Math.atan2(y2-y1,x2-x1);
  // Place label above the roof slope.
  const offX = -Math.sin(angleRad)*4;
  const offY = Math.cos(angleRad)*4;
  doc.setFontSize(5);doc.setFont("helvetica","bold");
  doc.setTextColor(C_ROOF[0],C_ROOF[1],C_ROOF[2]);
  const label = `${angleDeg}°`;
  doc.text(label, mx+offX, my+offY, {align:"center"});
  doc.setTextColor(0,0,0);
}

// =====================================================================
// Top View
// =====================================================================
function drawTopView(doc,ctx) {
  const {vx,vy,colW,rowH,widthCm,depthCm,garage,roofGeo,hasCarport,carportWidthCm,carportSide,doors,windows}=ctx;
  const dTop=vy+8,dH=rowH-13,dW=colW-12;
  const cx=vx+colW/2,cy=dTop+dH/2;
  const sideCarport=hasCarport&&isSideCarport(carportSide);
  const fbCarport=hasCarport&&isFrontBackCarport(carportSide);
  const totalWCm=widthCm+(sideCarport?carportWidthCm:0);
  const totalDCm=depthCm+(fbCarport?carportWidthCm:0);
  const scale=calcScale(dW-6,dH-6,totalWCm,totalDCm);
  const pw=widthCm/10*scale,pd=depthCm/10*scale;
  const cwMm=(carportWidthCm/10)*scale;
  const totalPW=totalWCm/10*scale,totalPD=totalDCm/10*scale;

  const lx=cx-totalPW/2,rx=cx+totalPW/2,ty=cy-totalPD/2,by=cy+totalPD/2;
  let garageLx=lx,garageRx=lx+pw,garageTy=ty,garageBy=ty+pd;
  if(carportSide==="lewo"){garageLx=lx+cwMm;garageRx=rx;}
  else if(carportSide==="prawo"){garageLx=lx;garageRx=lx+pw;}
  else if(carportSide==="tyl"){garageTy=ty+cwMm;garageBy=by;}
  else if(carportSide==="przod"){garageTy=ty;garageBy=ty+pd;}
  else {garageLx=cx-pw/2;garageRx=cx+pw/2;garageTy=cy-pd/2;garageBy=cy+pd/2;}

  // Combined wall rect
  setDraw(doc,C_WALL);doc.setLineWidth(0.5);setFill(doc,C_FILL);
  doc.rect(garageLx,garageTy,pw,pd,"FD");

  // Carport area overlay
  if(hasCarport){
    let cpL=garageLx,cpR=garageRx,cpT=garageTy,cpB=garageBy;
    if(carportSide==="lewo"){cpL=lx;cpR=garageLx;cpT=garageTy;cpB=garageBy;}
    else if(carportSide==="prawo"){cpL=garageRx;cpR=rx;cpT=garageTy;cpB=garageBy;}
    else if(carportSide==="tyl"){cpL=garageLx;cpR=garageRx;cpT=ty;cpB=garageTy;}
    else if(carportSide==="przod"){cpL=garageLx;cpR=garageRx;cpT=garageBy;cpB=by;}
    const cs=garage.carportSides||{}, cs2=garage.carportSides2||{}, ct=garage.carportType||"";
    const C_AZURY=[40,100,180];

    setFill(doc,C_CARPORT_FILL);
    doc.rect(cpL,cpT,cpR-cpL,cpB-cpT,"F");

    function sideMat(key) {
      const h1=selectedCarportSides(cs,garage.roof).includes(key), h2=selectedCarportSides(cs2,garage.roof).includes(key);
      if(ct==="oblachowane" && h1) return "blacha";
      if(ct==="azury" && h1) return "azury";
      if(ct==="mix"){if(h1&&h2)return "mix"; if(h1)return "blacha"; if(h2)return "azury";}
      return null;
    }
    function drawSideEdge(key,x1,y1,x2,y2,labelX,labelY,align){
      const mat=sideMat(key);
      const shared=key===attachedCarportSide(carportSide);
      if(shared){
        doc.setDrawColor(C_WALL[0],C_WALL[1],C_WALL[2]);doc.setLineWidth(1);
        doc.setLineDashPattern([],0);doc.line(x1,y1,x2,y2);
        doc.setFontSize(3);doc.setFont("helvetica","bold");doc.setTextColor(C_WALL[0],C_WALL[1],C_WALL[2]);
        doc.text("GARAZ",labelX,labelY,{align});
        return;
      }
      if(mat==="blacha"||mat==="mix"){
        doc.setDrawColor(C_CARPORT[0],C_CARPORT[1],C_CARPORT[2]);doc.setLineWidth(1.5);doc.setLineDashPattern([],0);
        doc.line(x1,y1,x2,y2);
      }
      if(mat==="azury"||mat==="mix"){
        doc.setDrawColor(C_AZURY[0],C_AZURY[1],C_AZURY[2]);doc.setLineWidth(mat==="mix"?0.9:1.5);doc.setLineDashPattern([3,2],0);
        doc.line(x1,y1,x2,y2);doc.setLineDashPattern([],0);
      }
      if(!mat){
        doc.setDrawColor(200,200,200);doc.setLineWidth(0.3);doc.setLineDashPattern([2,2],0);
        doc.line(x1,y1,x2,y2);doc.setLineDashPattern([],0);
        return;
      }
      const color=mat==="azury"?C_AZURY:C_CARPORT;
      doc.setFontSize(3);doc.setFont("helvetica","bold");doc.setTextColor(color[0],color[1],color[2]);
      doc.text(`${key.toUpperCase()}: ${mat.toUpperCase()}`,labelX,labelY,{align});
    }

    drawSideEdge("tyl",cpL,cpT,cpR,cpT,(cpL+cpR)/2,cpT-1,"center");
    drawSideEdge("przod",cpL,cpB,cpR,cpB,(cpL+cpR)/2,cpB+3,"center");
    drawSideEdge("lewo",cpL,cpT,cpL,cpB,cpL-1,(cpT+cpB)/2,"right");
    drawSideEdge("prawo",cpR,cpT,cpR,cpB,cpR+1,(cpT+cpB)/2,"left");
    doc.setTextColor(0,0,0);
    doc.setFontSize(4);doc.setFont("helvetica","bold");doc.setTextColor(C_CARPORT[0],C_CARPORT[1],C_CARPORT[2]);
    doc.text("WIATA",(cpL+cpR)/2,(cpT+cpB)/2+1,{align:"center"});
    doc.setTextColor(0,0,0);
    if(sideCarport) drawDimH(doc,cpL,cpR,cpB+8,fmtM(carportWidthCm));
    else drawDimV(doc,cpL-8,cpT,cpB,fmtM(carportWidthCm));
  }

  // Gate/door/window marks on edges (on garage portion only).
  const pm={przod:"front","przód":"front",tyl:"back","tył":"back",lewo:"left",prawo:"right"};
  const gc=parseInt(garage.gateCount)||0;
  for(let i=1;i<=Math.min(3,gc);i++){
    const gwCm=(parseFloat(garage[`gateWidth${i}`])||0)*100,gpCm=parseFloat(garage[`gatePositionValue${i}`])||0;
    if(gwCm<=0)continue;
    const ox=garageLx+(gpCm/10)*scale,ow=(gwCm/10)*scale;
    doc.setDrawColor(C_GATE[0],C_GATE[1],C_GATE[2]);doc.setLineWidth(1.2);
    doc.line(ox,garageBy,ox+ow,garageBy);
  }
  doc.setLineWidth(0.5);
  doors.forEach(d=>{
    const wk=pm[d.position]||d.position;
    const dp=parseFloat(d.positionValue)||0;
    const[dw]=(d.size||"80x190").split("x").map(Number);
    const oMm=(dp/10)*scale,wMm=(dw/10)*scale;
    doc.setDrawColor(C_DOOR[0],C_DOOR[1],C_DOOR[2]);doc.setLineWidth(1);
    if(wk==="front")doc.line(garageLx+oMm,garageBy,garageLx+oMm+wMm,garageBy);
    if(wk==="back")doc.line(garageLx+oMm,garageTy,garageLx+oMm+wMm,garageTy);
    if(wk==="left")doc.line(garageLx,garageTy+oMm,garageLx,garageTy+oMm+wMm);
    if(wk==="right")doc.line(garageRx,garageTy+oMm,garageRx,garageTy+oMm+wMm);
  });
  windows.forEach(w=>{
    const wk=pm[w.position]||w.position;
    const wp=parseFloat(w.positionValue)||0;
    const[ww]=(w.size||"80x60").split("x").map(Number);
    const oMm=(wp/10)*scale,wMm=(ww/10)*scale;
    doc.setDrawColor(C_WINDOW[0],C_WINDOW[1],C_WINDOW[2]);doc.setLineWidth(1);
    if(wk==="front")doc.line(garageLx+oMm,garageBy,garageLx+oMm+wMm,garageBy);
    if(wk==="back")doc.line(garageLx+oMm,garageTy,garageLx+oMm+wMm,garageTy);
    if(wk==="left")doc.line(garageLx,garageTy+oMm,garageLx,garageTy+oMm+wMm);
    if(wk==="right")doc.line(garageRx,garageTy+oMm,garageRx,garageTy+oMm+wMm);
  });

  drawDimH(doc,lx,rx,by+3,fmtM(totalWCm));
  if(hasCarport) drawDimH(doc,garageLx,garageRx,garageBy+6,fmtM(widthCm));
  drawDimV(doc,lx-4,ty,by,fmtM(totalDCm));
  if(hasCarport) drawDimV(doc,garageLx-7,garageTy,garageBy,fmtM(depthCm));
}

// =====================================================================
// Openings
// =====================================================================
function drawOpenings(doc,wall,wLx,wBy,wPwMm,wWCm,wHCm,scale,doors,windows,garage) {
  const pm={przod:"front","przód":"front",tyl:"back","tył":"back",lewo:"left",prawo:"right"};

  if(wall==="front"){
    const gc=parseInt(garage.gateCount)||0;
    for(let i=1;i<=Math.min(3,gc);i++){
      const gwCm=(parseFloat(garage[`gateWidth${i}`])||0)*100,ghCm=parseFloat(garage[`gateHeight${i}`])||0,gpCm=parseFloat(garage[`gatePositionValue${i}`])||0;
      if(gwCm<=0||ghCm<=0)continue;
      const ox=wLx+(gpCm/10)*scale,ow=(gwCm/10)*scale,oh=(ghCm/10)*scale,oy=wBy-oh;
      doc.setDrawColor(C_GATE[0],C_GATE[1],C_GATE[2]);doc.setLineWidth(0.7);
      doc.setFillColor(C_GATE_FILL[0],C_GATE_FILL[1],C_GATE_FILL[2]);doc.rect(ox,oy,ow,oh,"FD");
      doc.setFontSize(5);doc.setFont("helvetica","bold");doc.setTextColor(C_GATE[0],C_GATE[1],C_GATE[2]);
      doc.text(`B${i}`,ox+ow/2,oy+oh/2+1.5,{align:"center"});doc.setTextColor(0,0,0);
      // Width and height
      drawDimH(doc,ox,ox+ow,wBy+8+(i-1)*6,`${garage[`gateWidth${i}`]}m`);
      drawDimV(doc,ox-3-(i-1)*5,wBy,oy,`${ghCm}cm`);
      // Position from left wall
      drawDimHVisible(doc,wLx,ox,wBy+3+(i-1)*3,`${gpCm}cm`,wLx,wLx+wPwMm);
    }
  }

  const wallDoors = doors.filter(d=>(pm[d.position]||d.position)===wall);
  const wallWindows = windows.filter(w=>(pm[w.position]||w.position)===wall);
  const gateCount = wall==="front" ? Math.min(3, parseInt(garage.gateCount)||0) : 0;
  const baseY = wBy + 3 + gateCount * 3;

  wallDoors.forEach((d,idx)=>{
    const[dw,dh]=(d.size||"80x190").split("x").map(Number);
    const dp=parseFloat(d.positionValue)||0;
    const ox=wLx+(dp/10)*scale,ow=(dw/10)*scale,oh=(dh/10)*scale,oy=wBy-oh;
    doc.setDrawColor(C_DOOR[0],C_DOOR[1],C_DOOR[2]);doc.setLineWidth(0.6);
    doc.setFillColor(C_DOOR_FILL[0],C_DOOR_FILL[1],C_DOOR_FILL[2]);doc.rect(ox,oy,ow,oh,"FD");

    // Door handle indicator
    if(ow>4 && oh>10){
      const isLeft=d.type==="lewe";
      doc.setFillColor(100,100,100);
      if(isLeft){
        doc.rect(ox+ow-2,oy+oh*0.45,1.5,oh*0.15,"F");
        doc.circle(ox+ow-1.2,oy+oh*0.52+oh*0.07,0.7,"F");
      } else {
        doc.rect(ox+0.5,oy+oh*0.45,1.5,oh*0.15,"F");
        doc.circle(ox+1.2,oy+oh*0.52+oh*0.07,0.7,"F");
      }
    }

    // Labels inside door
    doc.setTextColor(C_DOOR[0],C_DOOR[1],C_DOOR[2]);
    const fs=Math.min(4,ow*0.35);
    doc.setFontSize(fs);doc.setFont("helvetica","bold");
    doc.text(`D${idx+1}`,ox+ow/2,oy+oh*0.4,{align:"center"});
    doc.setFontSize(Math.min(3.5,ow*0.3));doc.setFont("helvetica","normal");
    doc.text(`${dw}x${dh}`,ox+ow/2,oy+oh*0.52,{align:"center"});
    if(d.type){
      doc.setFontSize(Math.min(3,ow*0.25));doc.setFont("helvetica","bold");
      doc.text(d.type==="lewe"?"LEWE":"PRAWE",ox+ow/2,oy+oh*0.64,{align:"center"});
    }
    doc.setTextColor(0,0,0);

    // Position from left
    drawDimHVisible(doc,wLx,ox,baseY+idx*4,`${dp}cm`,wLx,wLx+wPwMm);
    // Door width
    drawDimH(doc,ox,ox+ow,baseY+idx*4+2.6,`${dw}cm`);
  });

  const doorBase = baseY + wallDoors.length * 4;
  wallWindows.forEach((w,idx)=>{
    const[ww,wh]=(w.size||"80x60").split("x").map(Number);
    const wp=parseFloat(w.positionValue)||0;
    const ox=wLx+(wp/10)*scale,ow=(ww/10)*scale,oh=(wh/10)*scale,winBotMm=(150/10)*scale,oy=wBy-winBotMm;
    doc.setDrawColor(C_WINDOW[0],C_WINDOW[1],C_WINDOW[2]);doc.setLineWidth(0.6);
    doc.setFillColor(C_WIN_FILL[0],C_WIN_FILL[1],C_WIN_FILL[2]);doc.rect(ox,oy,ow,oh,"FD");

    // Labels inside window
    doc.setTextColor(C_WINDOW[0],C_WINDOW[1],C_WINDOW[2]);
    const wfs=Math.min(4,ow*0.35);
    doc.setFontSize(wfs);doc.setFont("helvetica","bold");
    doc.text(`O${idx+1}`,ox+ow/2,oy+oh*0.35,{align:"center"});
    doc.setFontSize(Math.min(3.5,ow*0.3));doc.setFont("helvetica","normal");
    doc.text(`${ww}x${wh}`,ox+ow/2,oy+oh*0.65,{align:"center"});
    doc.setTextColor(0,0,0);

    // Position from left
    drawDimHVisible(doc,wLx,ox,doorBase+idx*4,`${wp}cm`,wLx,wLx+wPwMm);
    // Window width
    drawDimH(doc,ox,ox+ow,doorBase+idx*4+2.6,`${ww}cm`);
  });
}

// =====================================================================
// Dimension Lines
// =====================================================================
function drawDimH(doc,x1,x2,y,label) {
  if(Math.abs(x2-x1)<3)return;
  setDraw(doc,C_DIM);doc.setLineWidth(0.2);
  doc.line(x1,y-1.5,x1,y+0.5);doc.line(x2,y-1.5,x2,y+0.5);doc.line(x1,y,x2,y);
  doc.line(x1,y,x1+1.2,y-0.4);doc.line(x1,y,x1+1.2,y+0.4);
  doc.line(x2,y,x2-1.2,y-0.4);doc.line(x2,y,x2-1.2,y+0.4);
  doc.setFontSize(5);doc.setFont("helvetica","normal");
  const tw=doc.getTextWidth(label)+2,lx=(x1+x2)/2-tw/2;
  doc.text(label,lx+1,y+0.8);
}
function drawDimHVisible(doc,x1,x2,y,label,minX,maxX) {
  setDraw(doc,C_DIM);doc.setLineWidth(0.2);
  doc.line(x1,y-1.5,x1,y+0.5);
  doc.line(x2,y-1.5,x2,y+0.5);
  if(Math.abs(x2-x1)>=0.5) doc.line(x1,y,x2,y);
  doc.setFontSize(5);doc.setFont("helvetica","normal");
  const tw=doc.getTextWidth(label)+2;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  let lx=(x1+x2)/2-tw/2;
  if(Math.abs(x2-x1)<10) lx=x2+2;
  lx=clamp(lx,minX+1,maxX-tw-1);
  if(Math.abs(x2-x1)<10) doc.line(x2,y,lx+tw/2,y);
  doc.text(label,lx+1,y+0.8);
}
function drawDimV(doc,x,y1,y2,label) {
  if(Math.abs(y2-y1)<3)return;
  setDraw(doc,C_DIM);doc.setLineWidth(0.2);
  doc.line(x-0.5,y1,x+1.5,y1);doc.line(x-0.5,y2,x+1.5,y2);doc.line(x,y1,x,y2);
  doc.line(x,y1,x-0.4,y1+1.2);doc.line(x,y1,x+0.4,y1+1.2);
  doc.line(x,y2,x-0.4,y2-1.2);doc.line(x,y2,x+0.4,y2-1.2);
  doc.setFontSize(5);doc.setFont("helvetica","normal");
  const tw=doc.getTextWidth(label)+2,mid=(y1+y2)/2;
  doc.text(label,x-tw/2+1,mid+0.8);
}

// =====================================================================
// Drawing primitives
// =====================================================================
function drawTrap(d,x1,y1,x2,y2,x3,y3,x4,y4){d.triangle(x1,y1,x2,y2,x3,y3,"FD");d.triangle(x1,y1,x3,y3,x4,y4,"FD");}
function drawTri(d,x1,y1,x2,y2,x3,y3){d.triangle(x1,y1,x2,y2,x3,y3,"FD");}
function setDraw(d,c){d.setDrawColor(c[0],c[1],c[2]);}
function setFill(d,c){d.setFillColor(c[0],c[1],c[2]);}
function yesNo(v){return v?"Tak":"Nie";}
function fmtM(cm){return(cm/100).toFixed(1)+" m";}
function fmtCm(cm){return Math.round(cm)+" cm";}
function parseItems(raw){
  if(!raw||typeof raw!=="string")return[];
  return raw.split(/\r?\n/).reduce((a,l)=>{l=l.trim();const m=l.match(/^[^:]+:\s*(\{.*\})$/);if(m){try{a.push(JSON.parse(m[1]));}catch(e){}}return a;},[]);
}
