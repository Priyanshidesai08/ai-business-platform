const StatCard = ({ label, value, detail, icon: Icon, tone = 'accent' }) => (
  <article className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-[var(--ui-shadow)] backdrop-blur-xl">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-[var(--ui-text)]">{value}</p>
        <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{detail}</p>
      </div>
      {Icon ? (
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone === 'success' ? 'bg-emerald-500/12 text-emerald-500' : tone === 'warning' ? 'bg-amber-500/12 text-amber-500' : 'bg-blue-500/12 text-blue-500'}`}>
          <Icon size={18} />
        </div>
      ) : null}
    </div>
  </article>
);

export default StatCard;
