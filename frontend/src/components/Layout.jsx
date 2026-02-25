import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

export default function Layout() {
  return (
    <div className="min-h-screen newspaper-bg">
      <div className="relative z-10">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
}
