const base = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';

const variants = {
  primary: 'bg-[var(--ui-accent)] text-white shadow-lg shadow-blue-500/15 hover:-translate-y-0.5 hover:bg-[var(--ui-accent-strong)]',
  secondary: 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:-translate-y-0.5 hover:bg-[var(--ui-surface-muted)]',
  ghost: 'text-[var(--ui-text)] hover:-translate-y-0.5 hover:bg-[var(--ui-surface-muted)]',
  danger: 'bg-red-600 text-white hover:-translate-y-0.5 hover:bg-red-700'
};

const Button = ({ variant = 'secondary', className = '', ...props }) => (
  <button className={`${base} ${variants[variant]} ${className}`} {...props} />
);

export default Button;
