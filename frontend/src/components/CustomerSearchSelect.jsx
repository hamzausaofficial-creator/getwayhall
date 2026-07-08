import { useEffect, useMemo, useRef, useState } from 'react';
import { User, X } from 'lucide-react';
import SearchInput from './SearchInput';
import { customerDisplayName } from '../utils/customer';

const STATUS_LABELS = {
  WHITELISTED: 'Whitelisted',
  BLOCKLISTED: 'Blocklisted',
  NORMAL: 'Normal',
};

const formatCustomerLabel = (customer) => {
  const name = customerDisplayName(customer);
  return customer?.phone ? `${name} · ${customer.phone}` : name;
};

export default function CustomerSearchSelect({
  customers = [],
  value,
  onChange,
  placeholder = 'Search guest by name, phone, or CNIC…',
  disabled = false,
  excludeStatuses = [],
  priorityStatuses = [],
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const uniqueCustomers = useMemo(() => {
    const seen = new Set();
    const blockedStatuses = new Set((excludeStatuses || []).map((s) => String(s).toUpperCase()));
    const filteredUnique = customers.filter((c) => {
      if (!c?.id || seen.has(c.id)) return false;
      if (blockedStatuses.has(String(c.list_status || 'NORMAL').toUpperCase())) return false;
      seen.add(c.id);
      return true;
    });
    const priorities = new Set((priorityStatuses || []).map((s) => String(s).toUpperCase()));
    if (!priorities.size) return filteredUnique;
    return [...filteredUnique].sort((a, b) => {
      const aPriority = priorities.has(String(a.list_status || 'NORMAL').toUpperCase()) ? 0 : 1;
      const bPriority = priorities.has(String(b.list_status || 'NORMAL').toUpperCase()) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return customerDisplayName(a).localeCompare(customerDisplayName(b));
    });
  }, [customers, excludeStatuses, priorityStatuses]);

  const selected = useMemo(
    () => uniqueCustomers.find((c) => String(c.id) === String(value)),
    [uniqueCustomers, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return uniqueCustomers;
    return uniqueCustomers.filter((c) => {
      const name = customerDisplayName(c).toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const cnic = (c.cnic || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || cnic.includes(q) || email.includes(q);
    });
  }, [uniqueCustomers, query]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const pick = (customer) => {
    onChange(String(customer.id));
    setQuery('');
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setQuery('');
    setOpen(true);
  };

  const inputValue = open ? query : (selected ? formatCustomerLabel(selected) : '');

  return (
    <div ref={wrapRef} className="customer-search-select">
      <div className="customer-search-select__field">
        <SearchInput
          variant="inset"
          placeholder={placeholder}
          value={inputValue}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange('');
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {value && !disabled && (
          <button
            type="button"
            className="customer-search-select__clear"
            onClick={clear}
            aria-label="Clear selected guest"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && !disabled && (
        <ul className="customer-search-select__list" role="listbox">
          {filtered.length === 0 ? (
            <li className="customer-search-select__empty">No guests match your search</li>
          ) : (
            filtered.map((c) => {
              const active = String(c.id) === String(value);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`customer-search-select__option${active ? ' customer-search-select__option--active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(c)}
                  >
                    <span className="customer-search-select__avatar">
                      <User size={14} />
                    </span>
                    <span className="customer-search-select__meta">
                      <span className="customer-search-select__name">
                        {customerDisplayName(c)}
                        {(c.list_status || 'NORMAL') !== 'NORMAL' && (
                          <span className={`customer-search-select__status customer-search-select__status--${String(c.list_status || 'NORMAL').toLowerCase()}`}>
                            {STATUS_LABELS[c.list_status] || c.list_status}
                          </span>
                        )}
                      </span>
                      {c.phone && <span className="customer-search-select__phone">{c.phone}</span>}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
