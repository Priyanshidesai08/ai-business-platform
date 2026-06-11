import { Activity, Bot, CheckCircle2, Clock, Cpu, ShieldCheck } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const agentCards = [
  { name: 'Sales Agent', status: 'Ready', metric: '0 workflows', icon: Bot },
  { name: 'Support Agent', status: 'Ready', metric: '0 tickets', icon: CheckCircle2 },
  { name: 'Finance Agent', status: 'Planned', metric: 'Phase 2', icon: Cpu },
  { name: 'Operations Agent', status: 'Planned', metric: 'Phase 2', icon: Activity }
];

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <AppShell>
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-accent">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Welcome, {user?.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Your secured workspace is ready for future AI automation modules.
          </p>
        </div>
        <div className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-slate-700">
          <ShieldCheck size={18} className="text-mint" />
          Authenticated
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {agentCards.map((agent) => {
          const Icon = agent.icon;
          return (
            <article key={agent.name} className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-accent">
                  <Icon size={20} />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {agent.status}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-ink">{agent.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{agent.metric}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <p className="mt-1 text-sm text-slate-600">Platform events will appear here as modules come online.</p>
            </div>
            <Clock size={20} className="text-slate-500" />
          </div>
          <div className="mt-6 space-y-3">
            {['User account secured', 'Dashboard initialized', 'Agent overview loaded'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-line bg-panel px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                <span className="text-sm font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">User Info</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Name</dt>
              <dd className="mt-1 font-semibold text-ink">{user?.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Email</dt>
              <dd className="mt-1 break-all font-semibold text-ink">{user?.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Role</dt>
              <dd className="mt-1 font-semibold capitalize text-ink">{user?.role}</dd>
            </div>
          </dl>
        </div>
      </section>
    </AppShell>
  );
};

export default Dashboard;
