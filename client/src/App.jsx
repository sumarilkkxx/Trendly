import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Keywords from './pages/Keywords';
import Hotspots from './pages/Hotspots';
import Sources from './pages/Sources';
import Settings from './pages/Settings';
import About from './pages/About';

const nav = [
  { to: '/', label: '仪表盘', end: true },
  { to: '/hotspots', label: '热点列表', end: false },
  { to: '/keywords', label: '关键词', end: false },
  { to: '/sources', label: '消息源', end: false },
  { to: '/settings', label: '通知设置', end: false },
  { to: '/about', label: '关于', end: false },
];

function Layout({ children }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-cyber-border/50 bg-cyber-card/50 p-4 flex flex-col">
        <h1 className="font-display text-lg font-semibold text-cyber-accent mb-6 px-2">
          Trendly
        </h1>
        <nav className="flex-1 space-y-1">
          {nav.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-cyber-accent/20 text-cyber-accent border-l-2 border-cyber-accent -ml-[2px] pl-[14px]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hotspots" element={<Hotspots />} />
          <Route path="/keywords" element={<Keywords />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
