import { useEffect, useRef, useState } from 'react';

/** Icon-free dropdown for Guest House filter bars. */
export default function GhFilterSelect({
  value,
  onChange,
  options,
  'aria-label': ariaLabel = 'Filter',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className={`gh-filter-select-wrap ${className}`.trim()} ref={ref}>
      <button
        type="button"
        className="gh-filter-select"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="gh-filter-select__label">{selected?.label}</span>
      </button>
      {open && (
        <ul className="gh-filter-select__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              className={`gh-filter-select__option${value === opt.value ? ' gh-filter-select__option--active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const GH_DATE_FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'date', label: 'Pick date' },
  { value: 'all', label: 'All time' },
];
