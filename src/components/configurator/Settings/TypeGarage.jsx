import { assetPath } from '../../../utils/assetPath';

function TypeGarage({ selectedOptions, setSelectedOptions, o }) {
  const roofKey = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const garageTypes = [
    {name: "spad tył", url: assetPath("konfigurator/tyl.png") },
    {name: "dwuspad", url: assetPath("konfigurator/prawo-lewo.png") },
    {name: "spad przód", url: assetPath("konfigurator/przod.png") },
    {name: "spad w lewo", url: assetPath("konfigurator/lewo.png") },
    {name: "dwuspad przod-tył", url: assetPath("konfigurator/przod-tyl.png") },
    {name: "spad w prawo", url: assetPath("konfigurator/prawo.png") },
  ];

  return (
    <div className="py-2">
      <div className="flex gap-0 flex-wrap justify-between">
        {garageTypes.map((type) => (
          <img
            key={type.name}
            role="button"
            onClick={() => setSelectedOptions({
              ...selectedOptions,
              roof: type.name,
              height: roofKey(type.name) === "spad tyl" ? selectedOptions.height : (Number(selectedOptions.height) === 200 ? 213 : selectedOptions.height),
            })}
            className={`w-16 h-16 object-cover ${selectedOptions.roof === type.name ? "border-4" : null}`}
            src={type.url}
            alt={o(type.name)}
            title={o(type.name)}
          />
        ))}
      </div>
    </div>
  );
}

export default TypeGarage;
