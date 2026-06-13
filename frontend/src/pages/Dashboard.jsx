import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  MessageSquareText,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const agents = [
  { name: 'Sales Agent', status: 'Ready', detail: 'Lead capture and scoring', tone: 'success', icon: Users, last: 'Live on demand' },
  { name: 'Marketing Agent', status: 'Ready', detail: 'Campaign generation', tone: 'accent', icon: Sparkles, last: 'Templates synced' },
  { name: 'Support Agent', status: 'Ready', detail: 'Chat and ticket flow', tone: 'warning', icon: MessageSquareText, last: 'Queue monitored' },
  { name: 'Analytics Agent', status: 'Ready', detail: 'Conversion reporting', tone: 'accent', icon: TrendingUp, last: 'Metrics available' }
];

const activities = [
  'JWT profile resolved successfully',
  'Dashboard route protected by auth guard',
  'Agent overview loaded for the workspace'
];

const Dashboard = () => {
  const { user, loading } = useAuth();
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="h-28 animate-pulse rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]" />
            <div className="h-28 animate-pulse rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]" />
            <div className="h-28 animate-pulse rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <EmptyState title="Dashboard unavailable" description="We could not resolve the authenticated session. Please sign in again." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(15,159,143,0.1),_transparent_34%)]" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <Badge tone="accent">Dashboard</Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ui-text)] sm:text-4xl">
                  Good to see you, {user?.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ui-text-muted)]">
                  Your secure workspace is live. The platform is ready for sales, marketing, support, analytics, and collaboration flows.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button variant="primary" aria-label="Open command search">
                    <Search size={16} /> Command search
                  </Button>
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 text-sm font-semibold text-[var(--ui-text)] transition hover:-translate-y-0.5 hover:bg-[var(--ui-surface-muted)]"
                    to="/collaboration"
                  >
                    <ArrowRight size={16} /> Open orchestration
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[340px]">
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
                    <CalendarDays size={14} /> Today
                  </p>
                  <p className="mt-2 text-lg font-semibold">{today}</p>
                </div>
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
                    <Gauge size={14} /> Workspace
                  </p>
                  <p className="mt-2 text-lg font-semibold">Protected</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} />
              <div>
                <p className="text-sm font-semibold text-[var(--ui-text)]">{user?.name}</p>
                <p className="text-sm text-[var(--ui-text-muted)]">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
                <p className="text-xs uppercase text-[var(--ui-text-muted)]">Role</p>
                <p className="mt-2 font-semibold capitalize">{user?.role}</p>
              </div>
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3">
                <p className="text-xs uppercase text-[var(--ui-text-muted)]">Status</p>
                <p className="mt-2 font-semibold text-emerald-500">Active</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
              <p className="text-sm font-semibold">Quick scan</p>
              <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Authentication, dashboard access, and agent surfaces are online.</p>
            </div>
          </Card>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total leads" value="Ready" detail="Lead capture module is available" icon={Users} tone="accent" />
          <StatCard label="Active campaigns" value="Ready" detail="Marketing generation is online" icon={Sparkles} tone="success" />
          <StatCard label="Open tickets" value="Ready" detail="Support workspace is connected" icon={MessageSquareText} tone="warning" />
          <StatCard label="AI usage" value="Connected" detail="Shared Gemini layer is configured" icon={Bot} tone="accent" />
          <StatCard label="Conversion" value="Tracked" detail="Analytics reporting is available" icon={TrendingUp} tone="success" />
          <StatCard label="Revenue" value="Protected" detail="Role-based access is enforced" icon={Wallet} tone="accent" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Agent status</h2>
                <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Every module is staged for the current workspace.</p>
              </div>
              <Badge tone="success">Healthy</Badge>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {agents.map((agent) => {
                const Icon = agent.icon;
                return (
                  <article key={agent.name} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4 transition hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--ui-surface)] text-[var(--ui-accent)]">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-semibold">{agent.name}</p>
                          <p className="text-sm text-[var(--ui-text-muted)]">{agent.detail}</p>
                        </div>
                      </div>
                      <Badge tone={agent.tone}>{agent.status}</Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
                      <span>{agent.last}</span>
                      <span>Live</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent activity</h2>
                <Clock3 size={18} className="text-[var(--ui-text-muted)]" />
              </div>
              <div className="mt-4 space-y-3">
                {activities.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-3">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-500" />
                    <p className="text-sm text-[var(--ui-text)]">{item}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Workspace notes</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                  <p className="text-sm font-semibold">Security</p>
                  <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Protected routes and JWT session refresh remain intact.</p>
                </div>
                <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                  <p className="text-sm font-semibold">AI layer</p>
                  <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Every module continues to route through the shared backend services.</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Dashboard;
