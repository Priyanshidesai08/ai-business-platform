import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

const ForgotPassword = () => {
  const { pushToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      pushToast({ tone: 'success', title: 'Password reset link sent.', message: data.message || 'Check your email for next steps.' });
    } catch (requestError) {
      console.error('Forgot password failed', {
        status: requestError.response?.status,
        message: requestError.response?.data?.message
      });
      setError(requestError.response?.data?.message || 'Could not send reset link.');
      pushToast({ tone: 'error', title: 'Reset failed', message: requestError.response?.data?.message || 'Could not send reset link.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="We’ll send you a secure reset link if the account exists.">
      <Card className="border-0 bg-transparent p-0 shadow-none">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">{error}</div> : null}
          <FormField
            id="forgot-email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            <Send size={16} />
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </Card>
      <p className="mt-5 text-center text-sm text-[var(--ui-text-muted)]">
        <Link className="inline-flex items-center gap-2 font-semibold text-[var(--ui-accent)] hover:text-[var(--ui-accent-strong)]" to="/login">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-[var(--ui-text-muted)]">
        If the email exists, a reset link will arrive shortly.
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
