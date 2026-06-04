import { Search } from 'lucide-react';

/**
 * Premium search field — visible border, icon, focus ring.
 * @param {'default'|'header'|'inset'} variant — header = dashboard top bar; inset = on muted page background
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  variant = 'default',
  iconSize = 18,
  ...rest
}) {
  const variantClass =
    variant === 'header' ? 'search-field--header' : variant === 'inset' ? 'search-field--inset' : '';

  return (
    <div className={`search-field ${variantClass} ${className}`.trim()}>
      <Search size={iconSize} className="search-field__icon" aria-hidden />
      <input
        type="search"
        className="search-field__input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        spellCheck={false}
        {...rest}
      />
    </div>
  );
}
