import { useState } from 'react';
import { Calendar, Clock3, Laptop, Mail, PencilLine, Shield, ShieldCheck, Smartphone } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import Card from '../components/ui/Card.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { useToast } from '../context/ToastContext.jsx';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { pushToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const createdAt = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Available after login';

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name });
      updateUser(data.user);
      pushToast({ tone: 'success', title: 'Profile updated', message: data.message });
      setEditing(false);
      setName(data.user.name);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ui-accent)]">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--ui-text)]">Account and security</h1>
            <p className="mt-2 text-sm text-[var(--ui-text-muted)]">Profile data comes from the secured `/auth/profile` endpoint.</p>
          </div>
          <Button variant="secondary" onClick={() => setEditing((current) => !current)}>
            <PencilLine size={16} /> {editing ? 'Close editor' : 'Edit profile'}
          </Button>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={user?.name} className="h-16 w-16 rounded-3xl text-xl" />
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{user?.name}</h2>
                <p className="mt-1 break-all text-sm text-[var(--ui-text-muted)]">{user?.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="accent">Verified</Badge>
                  <Badge tone="success">Protected session</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                <Mail className="text-[var(--ui-accent)]" size={20} />
                <p className="mt-3 text-xs font-medium uppercase text-[var(--ui-text-muted)]">Email</p>
                <p className="mt-1 break-all text-sm font-semibold">{user?.email}</p>
              </div>
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                <Shield className="text-emerald-500" size={20} />
                <p className="mt-3 text-xs font-medium uppercase text-[var(--ui-text-muted)]">Role</p>
                <p className="mt-1 text-sm font-semibold capitalize">{user?.role}</p>
              </div>
              <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4">
                <Calendar className="text-slate-500" size={20} />
                <p className="mt-3 text-xs font-medium uppercase text-[var(--ui-text-muted)]">Created</p>
                <p className="mt-1 text-sm font-semibold">{createdAt}</p>
              </div>
            </div>

            {editing ? (
              <form className="mt-6 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-4" onSubmit={saveProfile}>
                <p className="text-sm font-semibold">Edit profile</p>
                <div className="mt-3">
                  <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Display name" />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="submit" variant="primary" disabled={saving}>
                    Save changes
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => { setEditing(false); setName(user?.name || ''); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : null}
          </Card>

          <div className="space-y-4">
            <Card>
              <h2 className="text-lg font-semibold">Security</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Password</p>
                    <p className="text-sm text-[var(--ui-text-muted)]">Encrypted at rest with bcrypt.</p>
                  </div>
                  <ShieldCheck size={18} className="text-emerald-500" />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Session</p>
                    <p className="text-sm text-[var(--ui-text-muted)]">JWT session remains active until logout.</p>
                  </div>
                  <Clock3 size={18} className="text-[var(--ui-accent)]" />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Session devices</h2>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Laptop size={18} />
                    <div>
                      <p className="text-sm font-semibold">Desktop session</p>
                      <p className="text-xs text-[var(--ui-text-muted)]">Current browser</p>
                    </div>
                  </div>
                  <Badge tone="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Smartphone size={18} />
                    <div>
                      <p className="text-sm font-semibold">Mobile session</p>
                      <p className="text-xs text-[var(--ui-text-muted)]">Available when signed in</p>
                    </div>
                  </div>
                  <Badge tone="accent">Ready</Badge>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Profile;
