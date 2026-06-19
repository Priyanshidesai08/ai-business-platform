import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, RotateCcw } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if ((form.password || '').length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password: form.password });
      pushToast({ tone: 'success', title: 'Password updated successfully', message: data.message || 'Your password has been reset.' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (requestError) {
      console.error('Reset password failed', {
        status: requestError.response?.status,
        message: requestError.response?.data?.message
      });
      const message = requestError.response?.data?.message || 'Could not reset password.';
      setError(message);
      pushToast({ tone: 'error', title: 'Reset failed', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new secure password for your account.">
      <Card className="border-0 bg-transparent p-0 shadow-none">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">{error}</div> : null}
          <div className="relative">
            <FormField
              id="new-password"
              label="New Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-[2.45rem] rounded-full p-2 text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-surface-muted)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <FormField
            id="confirm-password"
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            value={form.confirmPassword}
            onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            required
          />
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            <LockKeyhole size={16} />
            {submitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </Card>
      <p className="mt-5 text-center text-sm text-[var(--ui-text-muted)]">
        <Link className="inline-flex items-center gap-2 font-semibold text-[var(--ui-accent)] hover:text-[var(--ui-accent-strong)]" to="/login">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-[var(--ui-text-muted)]">
        Token will expire shortly for security.
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
