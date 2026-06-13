import AppShell from '../components/AppShell.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Bell, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';

const Settings = () => (
  <AppShell>
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ui-accent)]">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold">Workspace preferences</h1>
        <p className="mt-2 text-sm text-[var(--ui-text-muted)]">Tune notifications, security posture, and interface preferences.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Interface</h2>
            <SlidersHorizontal size={18} className="text-[var(--ui-text-muted)]" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
              <p className="font-semibold">Theme</p>
              <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Use the sidebar toggle to switch modes instantly.</p>
            </div>
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
              <p className="font-semibold">Density</p>
              <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Current layout is optimized for dense SaaS workflows.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Security</h2>
            <ShieldCheck size={18} className="text-emerald-500" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">JWT access</p>
                  <p className="text-sm text-[var(--ui-text-muted)]">Authentication is preserved.</p>
                </div>
                <Badge tone="success">Enabled</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Notifications</p>
                  <p className="text-sm text-[var(--ui-text-muted)]">Workspace alerts and orchestration updates.</p>
                </div>
                <Badge tone="accent">Ready</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">AI preferences</h2>
              <p className="mt-1 text-sm text-[var(--ui-text-muted)]">Shared prompt settings power every module through the same AI layer.</p>
            </div>
            <Sparkles size={18} className="text-[var(--ui-accent)]" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary"><Bell size={16} /> Notification rules</Button>
            <Button variant="secondary"><Sparkles size={16} /> Prompt templates</Button>
          </div>
        </Card>
      </div>
    </div>
  </AppShell>
);

export default Settings;
