import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import PillNav from './components/PillNav';
import { api, logout, BRAND } from './api';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

// Public pages get the pill header + footer. Dashboards do NOT (see routes below).
function Public({ session, children }) {
  const { pathname } = useLocation();
  const items = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    ...(session ? [{ label: 'Dashboard', href: '/dashboard' }]
                : [{ label: 'Log in', href: '/login' }, { label: 'Sign up', href: '/signup' }])
  ];
  return (
    <>
      <PillNav logo="/logo.svg" logoAlt={BRAND} items={items} activeHref={pathname} initialLoadAnimation={false}
        baseColor="#00D9FF" pillColor="#000000" pillTextColor="#00D9FF" hoveredPillTextColor="#000000" />
      {session && <button className="logout-float" onClick={logout}>Log out</button>}
      <main className="page">{children}</main>
      <footer>&copy; {new Date().getFullYear()} {BRAND}. All rights reserved.</footer>
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const [session, setSession] = useState(null);
  useEffect(() => { api('/api/session').then(setSession).catch(() => setSession(false)); }, [pathname]);
  const P = (el) => <Public session={session}>{el}</Public>;

  return (
    <Routes>
      <Route path="/" element={P(<Home />)} />
      <Route path="/about" element={P(<About />)} />
      <Route path="/contact" element={P(<Contact />)} />
      <Route path="/login" element={P(<Auth mode="login" session={session} />)} />
      <Route path="/signup" element={P(<Auth mode="signup" session={session} />)} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={P(<Home />)} />
    </Routes>
  );
}