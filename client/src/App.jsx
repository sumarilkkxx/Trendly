import { cloneElement } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useMatch, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LayoutGrid, Flame, Settings, Info } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Hotspots from './pages/Hotspots';
import SettingsPage from './pages/Settings';
import About from './pages/About';
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
      <SidebarHeader className="border-b border-sidebar-border dark:border-white/10">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_12px_rgba(0,212,170,0.3)]">
            <span className="font-display text-sm font-bold">T</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold">Trendly</span>
            <span className="text-xs text-muted-foreground">AI 热点监控</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border dark:border-white/10">
        <div className="px-2 py-3 text-xs text-muted-foreground">
          基于 OpenRouter · Twitter · Reddit
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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-4 md:hidden bg-background/80 backdrop-blur-sm">
          <SidebarTrigger />
          <span className="font-semibold">Trendly</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
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
