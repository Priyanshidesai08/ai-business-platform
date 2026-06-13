const Input = ({ className = '', ...props }) => (
  <input
    className={`min-h-11 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] outline-none transition placeholder:text-[var(--ui-text-muted)] focus:border-[var(--ui-focus)] focus:ring-4 focus:ring-blue-200/50 ${className}`}
    {...props}
  />
);

export default Input;
