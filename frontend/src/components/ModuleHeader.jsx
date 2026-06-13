const ModuleHeader = ({ eyebrow, title, description, actions = null }) => (
  <header className="relative overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 shadow-[var(--ui-shadow)] backdrop-blur-xl">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(15,159,143,0.08),_transparent_34%)]" />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ui-accent)]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--ui-text)] sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ui-text-muted)]">{description}</p>
      </div>
      {actions}
    </div>
  </header>
);

export default ModuleHeader;
