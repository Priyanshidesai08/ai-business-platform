const Tabs = ({ value, options, onChange }) => (
  <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-2">
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${value === option.value ? 'bg-[var(--ui-surface)] text-[var(--ui-text)] shadow-sm' : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default Tabs;
