
function TypeGarage({ selectedOptions, setSelectedOptions }) {
  const garageTypes = [
   
    {name: "spad tył", url: "./konfigurator/tyl.png"},
    {name: "dwuspad", url: "./konfigurator/prawo-lewo.png"},
    {name: "spad przód", url: "./konfigurator/przod.png"},
    {name: "spad w lewo", url: "./konfigurator/lewo.png"},
    {name: "dwuspad przod-tył", url: "./konfigurator/przod-tyl.png"},
    {name: "spad w prawo", url: "./konfigurator/prawo.png"},   
    
  ];
  return (
    <div className="py-2">      
      <div className="flex gap-0 flex-wrap justify-between">
        {garageTypes.map((type) => (
          <img key={type.name} role="button" onClick={() => setSelectedOptions({...selectedOptions, roof: type.name})}
            className={`w-16 h-16 object-cover ${selectedOptions.roof ===type.name ? "border-4" :null}  `}
            src={type.url}
            alt={type.name}
          />
        ))}
      </div>
    </div>
  );
}

export default TypeGarage;
