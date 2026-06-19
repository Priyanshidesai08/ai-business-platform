import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { useToast } from '../context/ToastContext.jsx';

const getAuthErrorMessage = (apiError, fallback) => {
  if (!apiError) return fallback;
  if (!apiError.response) return 'Cannot connect to backend';
  const status = apiError.response.status;
  const message = apiError.response.data?.message;
  if (status === 401) return message || 'Invalid email or password';
  if (status >= 500) return 'Server error';
  return message || fallback;
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(form);
      pushToast({ tone: 'success', title: 'Welcome back', message: 'You are now signed in.' });
      navigate('/dashboard');
    } catch (apiError) {
      console.error('Login failed', {
        status: apiError.response?.status,
        message: apiError.response?.data?.message,
        details: apiError.response?.data?.details
      });
      const message = getAuthErrorMessage(apiError, 'Login failed');
      setError(message);
      pushToast({ tone: 'error', title: message, message: apiError.response?.data?.message || 'Please check your credentials.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue into the secure AI business workspace.">
      <Card className="border-0 bg-transparent p-0 shadow-none">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">{error}</div> : null}
          <FormField
            id="email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            required
          />
          <FormField
            id="password"
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={updateField}
            required
          />
          <div className="flex justify-end">
            <Link className="text-sm font-semibold text-[var(--ui-accent)] hover:text-[var(--ui-accent-strong)]" to="/forgot-password">
              Forgot Password?
            </Link>
          </div>
          <Button type="submit" variant="primary" className="w-full">
            <LogIn size={16} />
            {submitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>
      </Card>
      <p className="mt-5 text-center text-sm text-[var(--ui-text-muted)]">
        New here?{' '}
        <Link className="font-semibold text-[var(--ui-accent)] hover:text-[var(--ui-accent-strong)]" to="/register">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
