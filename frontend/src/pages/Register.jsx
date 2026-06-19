import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
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
  if (status === 409) return message || 'Email already registered';
  if (status === 400) return message || 'Please fix the highlighted fields';
  if (status >= 500) return 'Server error';
  return message || fallback;
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      await register(form);
      pushToast({ tone: 'success', title: 'Account created', message: 'You can log in with your new credentials.' });
      navigate('/login');
    } catch (apiError) {
      console.error('Register failed', {
        status: apiError.response?.status,
        message: apiError.response?.data?.message,
        details: apiError.response?.data?.details
      });
      const message = getAuthErrorMessage(apiError, 'Registration failed');
      const validationMessage = Array.isArray(apiError.response?.data?.details)
        ? apiError.response.data.details.map((detail) => detail.message).join(' ')
        : '';
      setError(validationMessage || message);
      pushToast({ tone: 'error', title: message, message: validationMessage || apiError.response?.data?.message || 'Please review the form and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Register a workspace user with secure access to the platform.">
      <Card className="border-0 bg-transparent p-0 shadow-none">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">{error}</div> : null}
          <FormField
            id="name"
            label="Full name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={updateField}
            required
          />
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
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={updateField}
            required
          />
          <Button type="submit" variant="primary" className="w-full">
            <UserPlus size={16} />
            {submitting ? 'Creating account...' : 'Register'}
          </Button>
        </form>
      </Card>
      <p className="mt-5 text-center text-sm text-[var(--ui-text-muted)]">
        Already registered?{' '}
        <Link className="font-semibold text-[var(--ui-accent)] hover:text-[var(--ui-accent-strong)]" to="/login">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
