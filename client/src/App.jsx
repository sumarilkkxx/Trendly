import { cloneElement } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard';
import Keywords from './pages/Keywords';
import Hotspots from './pages/Hotspots';
import Sources from './pages/Sources';
import Settings from './pages/Settings';
import About from './pages/About';
import { AuroraBackground } from './components/ui/AuroraBackground';

const nav = [
  { to: '/', label: '仪表盘', end: true },
  { to: '/hotspots', label: '热点', end: false },
  { to: '/keywords', label: '关键词', end: false },
  { to: '/sources', label: '消息源', end: false },
  { to: '/settings', label: '设置', end: false },
  { to: '/about', label: '关于', end: false },
];

const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/hotspots', element: <Hotspots /> },
  { path: '/keywords', element: <Keywords /> },
  { path: '/sources', element: <Sources /> },
  { path: '/settings', element: <Settings /> },
  { path: '/about', element: <About /> },
];

function AnimatedRoutes() {
  const location = useLocation();
  const path = location.pathname;
  const route = routes.find((r) => r.path === path);
  const Page = route?.element ?? routes[0].element;

  return (
    <AnimatePresence mode="wait">
      {Page ? cloneElement(Page, { key: path }) : null}
    </AnimatePresence>
  );
}

function Layout({ children }) {
  return (
    <AuroraBackground className="min-h-screen">
      <nav className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-6xl" aria-label="主导航">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1.5 backdrop-blur-xl">
          <span className="ml-3 font-display text-sm font-semibold text-cyber-accent">Trendly</span>
          <div className="mx-2 h-4 w-px bg-white/20" aria-hidden="true" />
          <div className="flex flex-1 gap-0.5">
            {nav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition-colors duration-200 min-h-[44px] flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyber-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e17] ${
                    isActive
                      ? 'bg-cyber-accent/20 text-cyber-accent'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="relative pt-20 pb-12 px-4 mx-auto max-w-6xl">
        {children}
      </main>
    </AuroraBackground>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/*" element={<AnimatedRoutes />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
