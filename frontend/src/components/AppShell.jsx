import { Bot, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: UserRound }
];

const AppShell = ({ children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main className="min-h-screen bg-panel text-ink">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-line bg-white px-5 py-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
              <Bot size={22} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Platform</p>
              <p className="font-semibold">AI Business</p>
            </div>
          </div>

          <nav className="mt-8 flex gap-2 lg:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-8 hidden rounded-lg border border-line bg-panel p-4 lg:block">
            <p className="text-xs font-medium uppercase text-slate-500">Signed in</p>
            <p className="mt-2 truncate font-semibold">{user?.name}</p>
            <p className="truncate text-sm text-slate-600">{user?.email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:bg-slate-50 lg:justify-start"
          >
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        <section className="px-5 py-6 sm:px-8 lg:px-10">{children}</section>
      </div>
    </main>
  );
};

export default AppShell;
