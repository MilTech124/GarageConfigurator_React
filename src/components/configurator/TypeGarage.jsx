
function TypeGarage({ selectedOptions, setSelectedOptions }) {
  const garageTypes = [
   
    {name: "spad tył", url: "./konfigurator/tyl.png"},
    {name: "dwuspad", url: "./konfigurator/dwuspadowy-lewo-prawo.png"},
    {name: "spad przód", url: "./konfigurator/przod.png"},
    {name: "spad w lewo", url: "./konfigurator/spadlewy.png"},
    {name: "dwuspad przod-tył", url: "./konfigurator/dwuspadowy.png"},
    {name: "spad w prawo", url: "./konfigurator/spadprawy.png"},   
    
  ];
  return (
    <div className="py-2">
      <h4 className="bg-slate-900 p-2">Typ garażu</h4>
      <div className="flex gap-0 flex-wrap justify-between">
        {garageTypes.map((type) => (
          <img key={type.name} onClick={() => setSelectedOptions({...selectedOptions, roof: type.name})}
            className={`w-32 h-16 object-cover ${selectedOptions.roof ===type.name ? "border-4" :null}  `}
            src={type.url}
            alt={type.name}
          />
        ))}
      </div>
    </div>
  );
}

export default TypeGarage;
