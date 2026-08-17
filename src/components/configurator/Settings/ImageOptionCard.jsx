function ImageOptionCard({ value, label, image, selected, onSelect, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={`group min-w-0 rounded-lg border bg-white p-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
        selected
          ? "border-slate-900 ring-2 ring-slate-900"
          : "border-slate-300 hover:border-slate-600"
      } ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
    >
      <img
        src={image}
        alt=""
        className="h-16 w-full rounded-md object-cover"
        loading="lazy"
      />
      <span className="mt-1 block text-center text-xs font-medium leading-tight text-slate-900">
        {label}
      </span>
    </button>
  );
}

export default ImageOptionCard;
