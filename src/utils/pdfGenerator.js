import { jsPDF } from "jspdf";

const SINGLE_PITCH_ANGLE = 5;
const DUAL_PITCH_ANGLE = 20;

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

function t(text) {
  if (!text) return "";
  return String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L");
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
  const roofGeo = calcRoofGeometry(garage.roof, widthCm, depthCm);
  const hasCarport = !!garage.carport;
  const carportWidthCm = (parseFloat(garage.carportWidth) || 3) * 100;
  const carportSide = garage.carportSide || "lewo";

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
      const sides = [];
      if (s.lewo) sides.push("lewo"); if (s.prawo) sides.push("prawo");
      if (s.przod) sides.push("przod"); if (s.tyl) sides.push("tyl");
      if (sides.length) y = row("Sciany boczne", sides.map(t).join(", "), y);
    }
    if (garage.carportSides2) {
      const s2 = garage.carportSides2;
      const sides2 = [];
      if (s2.lewo) sides2.push("lewo"); if (s2.prawo) sides2.push("prawo");
      if (s2.przod) sides2.push("przod"); if (s2.tyl) sides2.push("tyl");
      if (sides2.length) y = row("Obicie wiaty", sides2.map(t).join(", "), y);
    }
    y += 3;
  }

  y = section("Dodatki", y);
  y = row("Rynny", yesNo(garage.gutter), y);
  y = row("Automatyka", yesNo(garage.automatic) + (garage.automatic ? ` (${garage.countAutomatic||1} szt.)` : ""), y);
  y = row("Filc", yesNo(garage.filc), y);
  y = row("Transport", yesNo(garage.transport) + (garage.transport && garage.wojewodztwo ? ` (${t(garage.wojewodztwo)})` : ""), y);
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
function shw(r){return{"spad tyl":"front","spad tył":"front","spad przod":"back","spad przód":"back","spad w lewo":"right","spad w prawo":"left"}[r]||"front";}
function slw(r){return{"spad tyl":"back","spad tył":"back","spad przod":"front","spad przód":"front","spad w lewo":"left","spad w prawo":"right"}[r]||"back";}
function calcRoofGeometry(roof,wCm,dCm) {
  const st=["spad tyl","spad tył","spad przod","spad przód","spad w lewo","spad w prawo"];
  const dt=["dwuspad","dwuspad przod-tyl","dwuspad przód-tył"];
  if(st.includes(roof)){const fb=["spad tyl","spad tył","spad przod","spad przód"].includes(roof);return{type:"single",riseCm:(fb?dCm:wCm)*Math.tan(SINGLE_PITCH_ANGLE*Math.PI/180),angle:SINGLE_PITCH_ANGLE};}
  if(dt.includes(roof)){const lr=roof==="dwuspad";return{type:"dual",riseCm:(lr?wCm/2:dCm/2)*Math.tan(DUAL_PITCH_ANGLE*Math.PI/180),angle:DUAL_PITCH_ANGLE};}
  return{type:"flat",riseCm:0,angle:0};
}

// =====================================================================
// Elevation View
// =====================================================================
function drawElevationView(doc, wall, ctx) {
  const {vx,vy,colW,rowH,widthCm,depthCm,heightCm,garage,doors,windows,roofGeo,hasCarport,carportWidthCm,carportSide}=ctx;
  const roof=garage.roof;
  const dTop=vy+8, dH=rowH-15, dW=colW-14;
  const cx=vx+colW/2, by=dTop+dH;

  const isFB=wall==="front"||wall==="back";
  const visW=isFB?widthCm:depthCm;
  const wallH=wallHeight(wall,garage,heightCm,roofGeo);
  const showCarport=hasCarport&&isFB;

  const isDwuspad = roof==="dwuspad";
  const isDwuspadFT = ["dwuspad przod-tyl","dwuspad przód-tył"].includes(roof);
  const gableVisible = (isDwuspad && isFB) || (isDwuspadFT && !isFB);
  const slopeVisible = (isDwuspad && !isFB) || (isDwuspadFT && isFB);
  const isSingleSlope = roofGeo.type==="single" &&
    ((isFB && (roof==="spad w lewo"||roof==="spad w prawo")) ||
     (!isFB && ["spad tyl","spad tył","spad przod","spad przód"].includes(roof)));

  let totalVisW = visW;
  if(showCarport) totalVisW = visW + carportWidthCm;

  let maxH = wallH;
  if(gableVisible || slopeVisible) maxH = wallH + roofGeo.riseCm;
  if(isSingleSlope) {
    let lH=wallHeight("left",garage,heightCm,roofGeo), rH=wallHeight("right",garage,heightCm,roofGeo);
    if(isFB && wall==="back")[lH,rH]=[rH,lH];
    if(!isFB){let fH=wallHeight("front",garage,heightCm,roofGeo),bH=wallHeight("back",garage,heightCm,roofGeo);if(wall==="right")[fH,bH]=[bH,fH];lH=fH;rH=bH;}
    if(showCarport){const s=(rH-lH)/visW;if(carportSide==="lewo")lH-=carportWidthCm*s;else rH+=carportWidthCm*s;}
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
  if(showCarport && carportSide==="lewo") {
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
    const cpL=carportSide==="lewo"?lx:garageRx, cpR=carportSide==="lewo"?garageLx:rx;
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
    if(showCarport){const s=(rightH-leftH)/visW;if(carportSide==="lewo")leftH-=carportWidthCm*s;else rightH+=carportWidthCm*s;}
    const plH=leftH/10*scale, prH=rightH/10*scale;
    setDraw(doc,C_WALL);doc.setLineWidth(0.5);setFill(doc,C_FILL);
    drawTrap(doc,lx,by,rx,by,rx,by-prH,lx,by-plH);
    // Carport trapezoid overlay
    if(showCarport){
      const cpL=carportSide==="lewo"?lx:garageRx, cpR=carportSide==="lewo"?garageLx:rx;
      const f=cwMm/totalPW;
      const cpLH=carportSide==="lewo"?plH:plH+(prH-plH)*(garagePW/totalPW);
      const cpRH=carportSide==="lewo"?plH+(prH-plH)*f:prH;
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
// Angle label on roof slope
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
  const roof=garage.roof;
  const dTop=vy+8,dH=rowH-13,dW=colW-12;
  const cx=vx+colW/2,cy=dTop+dH/2;
  const totalWCm=hasCarport?widthCm+carportWidthCm:widthCm;
  const scale=calcScale(dW-6,dH-6,totalWCm,depthCm);
  const pw=widthCm/10*scale,pd=depthCm/10*scale;
  const cwMm=(carportWidthCm/10)*scale;
  const totalPW=hasCarport?pw+cwMm:pw;

  let lx,rx,garageLx;
  if(hasCarport&&carportSide==="lewo"){lx=cx-totalPW/2;rx=cx+totalPW/2;garageLx=lx+cwMm;}
  else if(hasCarport){lx=cx-totalPW/2;rx=cx+totalPW/2;garageLx=lx;}
  else{lx=cx-pw/2;rx=cx+pw/2;garageLx=lx;}
  const ty=cy-pd/2;

  // Combined wall rect
  setDraw(doc,C_WALL);doc.setLineWidth(0.5);setFill(doc,C_FILL);
  doc.rect(lx,ty,totalPW,pd,"FD");

  // Carport area overlay
  if(hasCarport){
    const cpL=carportSide==="lewo"?lx:garageLx+pw;
    const cpR=carportSide==="lewo"?garageLx:rx;
    setFill(doc,C_CARPORT_FILL);
    doc.rect(cpL,ty,cpR-cpL,pd,"F");
    doc.setDrawColor(C_CARPORT[0],C_CARPORT[1],C_CARPORT[2]);doc.setLineWidth(0.4);
    doc.line(cpL,ty,cpL,ty+pd);doc.line(cpR,ty,cpR,ty+pd);
    doc.setFontSize(4);doc.setFont("helvetica","bold");
    doc.setTextColor(C_CARPORT[0],C_CARPORT[1],C_CARPORT[2]);
    doc.text("WIATA",(cpL+cpR)/2,cy+1,{align:"center"});
    doc.setTextColor(0,0,0);
    drawDimH(doc,cpL,cpR,ty+pd+8,fmtM(carportWidthCm));
  }

  // Roof direction — ridge centered on combined structure.
  setDraw(doc,C_ROOF);doc.setLineWidth(0.3);doc.setLineDashPattern([2,1],0);
  const rcx=cx;
  if(roofGeo.type==="dual"){
    if(roof==="dwuspad") doc.line(rcx,ty+2,rcx,ty+pd-2);
    else doc.line(lx+2,cy,rx-2,cy);
  } else if(roofGeo.type==="single") {
    const high=shw(garage.roof);
    let ax2=rcx,ay2=ty+2;
    if(high==="back"){ax2=rcx;ay2=ty+pd-2;}
    if(high==="left"){ax2=lx+2;ay2=cy;}
    if(high==="right"){ax2=rx-2;ay2=cy;}
    doc.line(rcx,cy,ax2,ay2);
    const a=Math.atan2(ay2-cy,ax2-rcx);
    doc.line(ax2,ay2,ax2-3*Math.cos(a-0.4),ay2-3*Math.sin(a-0.4));
    doc.line(ax2,ay2,ax2-3*Math.cos(a+0.4),ay2-3*Math.sin(a+0.4));
  }
  doc.setLineDashPattern([],0);

  // Gate/door/window marks on edges (on garage portion only).
  const pm={przod:"front","przód":"front",tyl:"back","tył":"back",lewo:"left",prawo:"right"};
  const gc=parseInt(garage.gateCount)||0;
  for(let i=1;i<=Math.min(3,gc);i++){
    const gwCm=(parseFloat(garage[`gateWidth${i}`])||0)*100,gpCm=parseFloat(garage[`gatePositionValue${i}`])||0;
    if(gwCm<=0)continue;
    const ox=garageLx+(gpCm/10)*scale,ow=(gwCm/10)*scale;
    doc.setDrawColor(C_GATE[0],C_GATE[1],C_GATE[2]);doc.setLineWidth(1.2);
    doc.line(ox,ty+pd,ox+ow,ty+pd);
  }
  doc.setLineWidth(0.5);
  doors.forEach(d=>{
    const wk=pm[d.position]||d.position,dp=parseFloat(d.positionValue)||0,[dw]=(d.size||"80x190").split("x").map(Number);
    const oMm=(dp/10)*scale,wMm=(dw/10)*scale;
    doc.setDrawColor(C_DOOR[0],C_DOOR[1],C_DOOR[2]);doc.setLineWidth(1);
    if(wk==="front")doc.line(garageLx+oMm,ty,garageLx+oMm+wMm,ty);
    if(wk==="back")doc.line(garageLx+oMm,ty+pd,garageLx+oMm+wMm,ty+pd);
    if(wk==="left")doc.line(garageLx,ty+oMm,garageLx,ty+oMm+wMm);
    if(wk==="right")doc.line(garageLx+pw,ty+oMm,garageLx+pw,ty+oMm+wMm);
  });
  windows.forEach(w=>{
    const wk=pm[w.position]||w.position,wp=parseFloat(w.positionValue)||0,[ww]=(w.size||"80x60").split("x").map(Number);
    const oMm=(wp/10)*scale,wMm=(ww/10)*scale;
    doc.setDrawColor(C_WINDOW[0],C_WINDOW[1],C_WINDOW[2]);doc.setLineWidth(1);
    if(wk==="front")doc.line(garageLx+oMm,ty,garageLx+oMm+wMm,ty);
    if(wk==="back")doc.line(garageLx+oMm,ty+pd,garageLx+oMm+wMm,ty+pd);
    if(wk==="left")doc.line(garageLx,ty+oMm,garageLx,ty+oMm+wMm);
    if(wk==="right")doc.line(garageLx+pw,ty+oMm,garageLx+pw,ty+oMm+wMm);
  });

  drawDimH(doc,lx,rx,ty+pd+3,fmtM(totalWCm));
  drawDimV(doc,lx-4,ty,ty+pd,fmtM(depthCm));
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
      if(gpCm>0) drawDimH(doc,wLx,ox,wBy+12+(i-1)*6,`${gpCm}cm`);
    }
  }

  const wallDoors = doors.filter(d=>(pm[d.position]||d.position)===wall);
  const wallWindows = windows.filter(w=>(pm[w.position]||w.position)===wall);
  const gateCount = wall==="front" ? Math.min(3, parseInt(garage.gateCount)||0) : 0;
  const baseY = wBy + 8 + gateCount * 6;

  wallDoors.forEach((d,idx)=>{
    const[dw,dh]=(d.size||"80x190").split("x").map(Number),dp=parseFloat(d.positionValue)||0;
    const ox=wLx+(dp/10)*scale,ow=(dw/10)*scale,oh=(dh/10)*scale,oy=wBy-oh;
    doc.setDrawColor(C_DOOR[0],C_DOOR[1],C_DOOR[2]);doc.setLineWidth(0.6);
    doc.setFillColor(C_DOOR_FILL[0],C_DOOR_FILL[1],C_DOOR_FILL[2]);doc.rect(ox,oy,ow,oh,"FD");
    doc.setFontSize(4);doc.setFont("helvetica","bold");doc.setTextColor(C_DOOR[0],C_DOOR[1],C_DOOR[2]);
    doc.text(`D${idx+1}`,ox+ow/2,oy+oh/2+1,{align:"center"});doc.setTextColor(0,0,0);
    // Width
    drawDimH(doc,ox,ox+ow,baseY+idx*5,`${dw}cm`);
    // Position from left wall
    drawDimH(doc,wLx,ox,baseY+(wallDoors.length)+idx*5,`${dp}cm`);
  });

  const doorBase = baseY + wallDoors.length * 2 * 5;
  wallWindows.forEach((w,idx)=>{
    const[ww,wh]=(w.size||"80x60").split("x").map(Number),wp=parseFloat(w.positionValue)||0;
    const ox=wLx+(wp/10)*scale,ow=(ww/10)*scale,oh=(wh/10)*scale,winBotMm=(150/10)*scale,oy=wBy-winBotMm;
    doc.setDrawColor(C_WINDOW[0],C_WINDOW[1],C_WINDOW[2]);doc.setLineWidth(0.6);
    doc.setFillColor(C_WIN_FILL[0],C_WIN_FILL[1],C_WIN_FILL[2]);doc.rect(ox,oy,ow,oh,"FD");
    doc.setFontSize(4);doc.setFont("helvetica","bold");doc.setTextColor(C_WINDOW[0],C_WINDOW[1],C_WINDOW[2]);
    doc.text(`O${idx+1}`,ox+ow/2,oy+oh/2+1,{align:"center"});doc.setTextColor(0,0,0);
    // Width
    drawDimH(doc,ox,ox+ow,doorBase+idx*5,`${ww}cm`);
    // Position from left wall
    drawDimH(doc,wLx,ox,doorBase+wallWindows.length+idx*5,`${wp}cm`);
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
  doc.setFillColor(255,255,255);doc.rect(lx,y-1.8,tw,3.6,"F");doc.text(label,lx+1,y+0.8);
}
function drawDimV(doc,x,y1,y2,label) {
  if(Math.abs(y2-y1)<3)return;
  setDraw(doc,C_DIM);doc.setLineWidth(0.2);
  doc.line(x-0.5,y1,x+1.5,y1);doc.line(x-0.5,y2,x+1.5,y2);doc.line(x,y1,x,y2);
  doc.line(x,y1,x-0.4,y1+1.2);doc.line(x,y1,x+0.4,y1+1.2);
  doc.line(x,y2,x-0.4,y2-1.2);doc.line(x,y2,x+0.4,y2-1.2);
  doc.setFontSize(5);doc.setFont("helvetica","normal");
  const tw=doc.getTextWidth(label)+2,mid=(y1+y2)/2;
  doc.setFillColor(255,255,255);doc.rect(x-tw/2,mid-1.8,tw,3.6,"F");doc.text(label,x-tw/2+1,mid+0.8);
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
