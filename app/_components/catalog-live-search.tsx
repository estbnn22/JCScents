"use client";

export function CatalogLiveSearch({
  query,
  onQueryChange,
  placeholder,
  srLabel,
  formClassName,
  labelClassName,
  inputClassName,
  buttonClassName,
  buttonText,
  onSubmitComplete,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  srLabel: string;
  formClassName: string;
  labelClassName: string;
  inputClassName: string;
  buttonClassName: string;
  buttonText: string;
  onSubmitComplete?: () => void;
}) {
  return (
    <form
      className={formClassName}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmitComplete?.();
      }}
    >
      <label className={labelClassName}>
        <span className="sr-only">{srLabel}</span>
        <input
          type="search"
          value={query}
          placeholder={placeholder}
          className={inputClassName}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <button type="submit" className={buttonClassName}>
        {buttonText}
      </button>
    </form>
  );
}
