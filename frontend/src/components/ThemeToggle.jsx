import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', size = 20, showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="theme-toggle__icon" aria-hidden>
        {isDark ? <Sun size={size} /> : <Moon size={size} />}
      </span>
      {showLabel && (
        <span className="theme-toggle__label">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
};

export default ThemeToggle;
