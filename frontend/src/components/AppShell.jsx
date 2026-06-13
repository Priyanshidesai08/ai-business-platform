import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  Command,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareText,
  MoonStar,
  Sparkles,
  Settings2,
  TrendingUp,
  UserRound,
  Users,
  Workflow
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Button from './ui/Button.jsx';
import Avatar from './ui/Avatar.jsx';
import Sheet from './ui/Sheet.jsx';
import Tooltip from './ui/Tooltip.jsx';
import CommandPalette from './ui/CommandPalette.jsx';
import { useToast } from '../context/ToastContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Overview and workspace health' },
  { to: '/leads', label: 'Leads', icon: Users, hint: 'Capture and qualify opportunities' },
  { to: '/marketing', label: 'Marketing', icon: Megaphone, hint: 'Generate campaign assets' },
  { to: '/support', label: 'Support', icon: MessageSquareText, hint: 'Handle chats and tickets' },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp, hint: 'Track performance and conversion' },
  { to: '/ai-studio', label: 'AI Studio', icon: Sparkles, hint: 'Prompt the shared AI layer' },
  { to: '/collaboration', label: 'Collaboration', icon: Workflow, hint: 'Orchestrate multi-agent runs' },
  { to: '/profile', label: 'Profile', icon: UserRound, hint: 'Account and security details' },
  { to: '/settings', label: 'Settings', icon: Settings2, hint: 'Preferences and workspace controls' }
];

const AppShell = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const { pushToast } = useToast();
  const [openMobile, setOpenMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === 'Escape') {
        setCommandOpen(false);
        setOpenMobile(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => setOpenMobile(false), [location.pathname]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1279px)');
    const syncCollapsed = () => setCollapsed(media.matches);
    syncCollapsed();
    media.addEventListener('change', syncCollapsed);
    return () => media.removeEventListener('change', syncCollapsed);
  }, []);

  const commandItems = useMemo(() => navItems.map((item) => ({
    key: item.to,
    label: item.label,
    hint: item.hint,
    onPick: () => navigate(item.to)
  })).concat([
    { key: 'theme', label: 'Toggle theme', hint: 'Switch between dark and light modes', onPick: toggleTheme }
  ]), [navigate, toggleTheme]);

  const handleLogout = async () => {
    await logout();
    pushToast({ tone: 'info', title: 'Logged out', message: 'Your session has been closed.' });
    navigate('/login');
  };

  const shell = (
    <main className="min-h-screen overflow-x-hidden bg-[var(--ui-background)] text-[var(--ui-text)]">
      <div className="grid min-h-screen lg:grid-cols-[clamp(92px,22vw,290px)_minmax(0,1fr)]">
        <aside className={`hidden border-r border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-4 backdrop-blur-xl lg:flex lg:flex-col ${collapsed ? 'lg:w-[92px]' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ui-accent)] text-white shadow-lg shadow-blue-500/20">
                <Bot size={22} />
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ui-text-muted)]">Workspace</p>
                  <p className="font-semibold">AI Business Platform</p>
                </div>
              ) : null}
            </div>
            <Button variant="ghost" type="button" onClick={() => setCollapsed((current) => !current)}>
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </div>

          {!collapsed ? (
            <div className="mt-5 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Workspace switcher</p>
              <p className="mt-2 text-sm font-semibold">Production Operations</p>
              <p className="text-xs text-[var(--ui-text-muted)]">Secure AI automation</p>
            </div>
          ) : null}

          <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.to} label={item.label}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition ${isActive ? 'bg-[var(--ui-accent)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)]'} ${collapsed ? 'justify-center' : ''}`
                    }
                  >
                    <Icon size={18} />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </NavLink>
                </Tooltip>
              );
            })}
          </nav>

          <div className="mt-4 space-y-3">
            {!collapsed ? (
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user?.name || 'A'} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user?.name}</p>
                    <p className="truncate text-xs text-[var(--ui-text-muted)]">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
                  <span>Signed in</span>
                  <span className="inline-flex items-center gap-1"><Bell size={12} /> Active</span>
                </div>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <Button variant="secondary" type="button" onClick={toggleTheme}>
                <MoonStar size={16} /> {mode === 'dark' ? 'Light' : 'Dark'}
              </Button>
              <Button variant="secondary" type="button" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </Button>
            </div>
          </div>
        </aside>

        <Sheet open={openMobile}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--ui-accent)] text-white">
                  <Bot size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Workspace</p>
                  <p className="font-semibold">AI Business Platform</p>
                </div>
              </div>
              <button className="rounded-xl border border-[var(--ui-border)] px-3 py-2" onClick={() => setOpenMobile(false)}>Close</button>
            </div>
            <nav className="mt-5 flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `rounded-2xl px-3 py-3 text-sm font-medium ${isActive ? 'bg-[var(--ui-accent)] text-white' : 'text-[var(--ui-text)] hover:bg-[var(--ui-surface-muted)]'}`}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </Sheet>

        <section className="relative min-w-0 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px]">
            <header className="glass sticky top-4 z-20 flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-3xl px-4 py-3">
              <div className="flex items-center gap-3">
                <Button variant="secondary" type="button" className="lg:hidden" onClick={() => setOpenMobile(true)}>Menu</Button>
                <div className="hidden min-w-0 items-center gap-3 md:flex">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">Command</p>
                    <p className="text-sm font-semibold">Ctrl or Cmd + K</p>
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Button variant="secondary" type="button" onClick={() => setCommandOpen(true)}>
                  <Command size={16} /> Search
                </Button>
                <Button variant="secondary" type="button" onClick={toggleTheme}>
                  <MoonStar size={16} /> Theme
                </Button>
              </div>
            </header>

            <div className="app-shell-enter pt-4">
              {children}
            </div>
          </div>
        </section>
      </div>
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        query={commandQuery}
        setQuery={setCommandQuery}
        items={commandItems}
        onPick={(item) => {
          item.onPick();
          setCommandOpen(false);
          setCommandQuery('');
        }}
      />
    </main>
  );

  return shell;
};

export default AppShell;
