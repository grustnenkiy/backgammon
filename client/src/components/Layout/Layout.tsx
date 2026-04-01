import { Outlet } from 'react-router-dom';
import { ThemeSwitcher } from '../ThemeSwitcher';

export function Layout() {
  return (
    <div className="app-shell">
      <ThemeSwitcher />
      <Outlet />
    </div>
  );
}
