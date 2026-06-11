import { Bot, ShieldCheck } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => (
  <main className="grid min-h-screen bg-panel lg:grid-cols-[0.9fr_1.1fr]">
    <section className="hidden bg-ink px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-white/10">
          <Bot size={24} />
        </div>
        <div>
          <p className="text-sm text-white/70">Multi-Agent Platform</p>
          <h1 className="text-xl font-semibold">AI Business Automation</h1>
        </div>
      </div>

      <div className="max-w-md">
        <ShieldCheck className="mb-6 text-mint" size={44} />
        <h2 className="text-4xl font-semibold leading-tight">Secure foundation for intelligent operations.</h2>
        <p className="mt-5 text-base leading-7 text-white/70">
          Phase 1 connects user identity, protected APIs, persistent sessions, and the first agent overview surface.
        </p>
      </div>
    </section>

    <section className="flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-ink text-white">
            <Bot size={24} />
          </div>
          <p className="text-sm font-medium text-accent">AI Business Automation</p>
        </div>
        <h2 className="text-3xl font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
        <div className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">{children}</div>
      </div>
    </section>
  </main>
);

export default AuthLayout;
