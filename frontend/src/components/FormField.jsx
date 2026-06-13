const FormField = ({ label, id, error, ...props }) => (
  <label className="block" htmlFor={id}>
    <span className="text-sm font-medium text-[var(--ui-text)]">{label}</span>
    <input
      id={id}
      className="mt-2 min-h-11 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-[var(--ui-text)] outline-none transition placeholder:text-[var(--ui-text-muted)] focus:border-[var(--ui-focus)] focus:ring-4 focus:ring-blue-100/50"
      {...props}
    />
    {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
  </label>
);

export default FormField;
