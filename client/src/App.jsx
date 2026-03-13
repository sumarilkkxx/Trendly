import { cloneElement } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useMatch, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LayoutGrid, Flame, Settings, Info, Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Hotspots from './pages/Hotspots';
import SettingsPage from './pages/Settings';
import About from './pages/About';
import { ScanProvider } from './contexts/ScanContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const nav = [
  { to: '/', label: '仪表盘', end: true, icon: LayoutGrid },
  { to: '/hotspots', label: '热点', end: false, icon: Flame },
  { to: '/settings', label: '设置', end: false, icon: Settings },
  { to: '/about', label: '关于', end: false, icon: Info },
];

const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/hotspots', element: <Hotspots /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/about', element: <About /> },
  { path: '/keywords', element: <Navigate to="/settings" replace /> },
  { path: '/sources', element: <Navigate to="/settings" replace /> },
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

function NavItem({ to, end, label, icon: Icon }) {
  const match = useMatch({ path: to, end: end ?? to === '/' });
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match}>
        <NavLink to={to} end={end}>
          <Icon className="size-4" />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(0,212,170,0.2)]">
            <Activity className="size-5" />
            <div className="absolute inset-0 rounded-xl border border-primary/30" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold tracking-wider text-foreground">
              TRENDLY
            </span>
            <span className="text-[11px] tracking-wide text-primary/70">
              AI Signal Monitor
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/[0.06]">
        <div className="px-3 py-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] text-primary/80 tracking-wide">System Online</span>
          </div>
          <p className="text-[10px] text-muted-foreground/50 tracking-wide">
            OpenRouter · Twitter · Reddit · HN
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function Layout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] px-4 md:hidden bg-background/90 backdrop-blur-md">
          <SidebarTrigger />
          <span className="font-display text-sm font-semibold tracking-wider">TRENDLY</span>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <ScanProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/*" element={<AnimatedRoutes />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ScanProvider>
  );
}
