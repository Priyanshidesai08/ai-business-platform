import { Bot, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import Button from './ui/Button.jsx';
import { MoonStar, SunMedium } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => (
  <main className="grid min-h-screen bg-[var(--ui-background)] text-[var(--ui-text)] lg:grid-cols-[0.9fr_1.1fr]">
    <section className="hidden border-r border-[var(--ui-border)] bg-[var(--ui-surface)] px-12 py-10 text-[var(--ui-text)] lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--ui-accent)] text-white">
          <Bot size={24} />
        </div>
        <div>
          <p className="text-sm text-[var(--ui-text-muted)]">Multi-Agent Platform</p>
          <h1 className="text-xl font-semibold">AI Business Automation</h1>
        </div>
      </div>

      <div className="max-w-md">
        <ShieldCheck className="mb-6 text-[var(--ui-accent)]" size={44} />
        <h2 className="text-4xl font-semibold leading-tight">Secure foundation for intelligent operations.</h2>
        <p className="mt-5 text-base leading-7 text-[var(--ui-text-muted)]">
          Phase 1 connects user identity, protected APIs, persistent sessions, and the first agent overview surface.
        </p>
      </div>
    </section>

    <section className="flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-[var(--ui-accent)] text-white">
            <Bot size={24} />
          </div>
          <p className="text-sm font-medium text-[var(--ui-accent)]">AI Business Automation</p>
        </div>
        <AuthThemeToggle />
        <h2 className="text-3xl font-semibold text-[var(--ui-text)]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ui-text-muted)]">{subtitle}</p>
        <div className="mt-8 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-soft backdrop-blur-xl">{children}</div>
      </div>
    </section>
  </main>
);

export default AuthLayout;

const AuthThemeToggle = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <div className="mb-4 flex justify-end">
      <Button type="button" variant="secondary" onClick={toggleTheme}>
        {mode === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
        {mode === 'dark' ? 'Light' : 'Dark'}
      </Button>
    </div>
  );
};
