import { Calendar, Mail, Shield } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const Profile = () => {
  const { user } = useAuth();
  const createdAt = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Available after login';

  return (
    <AppShell>
      <header className="border-b border-line pb-6">
        <p className="text-sm font-medium text-accent">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Account details</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Profile data is loaded from the secured `/auth/profile` endpoint.
        </p>
      </header>

      <section className="mt-8 max-w-3xl rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-ink text-2xl font-semibold text-white">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{user?.name}</h2>
            <p className="mt-1 break-all text-sm text-slate-600">{user?.email}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-panel p-4">
            <Mail className="text-accent" size={20} />
            <p className="mt-3 text-xs font-medium uppercase text-slate-500">Email</p>
            <p className="mt-1 break-all text-sm font-semibold">{user?.email}</p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <Shield className="text-mint" size={20} />
            <p className="mt-3 text-xs font-medium uppercase text-slate-500">Role</p>
            <p className="mt-1 text-sm font-semibold capitalize">{user?.role}</p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <Calendar className="text-slate-600" size={20} />
            <p className="mt-3 text-xs font-medium uppercase text-slate-500">Created</p>
            <p className="mt-1 text-sm font-semibold">{createdAt}</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Profile;
