import { themes, useTheme } from '../../theme';
import './ThemeSwitcher.css';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher">
      {themes.map((t) => (
        <button
          key={t.name}
          type="button"
          className={`theme-switcher__btn${t.name === theme.name ? ' theme-switcher__btn--active' : ''}`}
          onClick={() => setTheme(t)}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
