import { useState, useRef, useEffect } from 'react';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'thismonth', label: 'This month' },
  { value: 'thisyear', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

export default function PeriodSelect({ value, onChange, 'aria-label': ariaLabel = 'Report period' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = PERIOD_OPTIONS.find((o) => o.value === value) ?? PERIOD_OPTIONS[0];

  return (
    <div className="dash-period-select-wrap" ref={ref}>
      <button
        type="button"
        className="dash-period-select"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="dash-period-select__label">{selected.label}</span>
      </button>
      {open && (
        <ul className="dash-period-select__menu" role="listbox" aria-label={ariaLabel}>
          {PERIOD_OPTIONS.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              className={`dash-period-select__option${value === opt.value ? ' dash-period-select__option--active' : ''}`}
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
