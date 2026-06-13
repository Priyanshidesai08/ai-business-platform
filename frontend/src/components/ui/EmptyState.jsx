import Button from './Button.jsx';

const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="rounded-2xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface)] p-8 text-center">
    <p className="text-base font-semibold text-[var(--ui-text)]">{title}</p>
    <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--ui-text-muted)]">{description}</p>
    {actionLabel ? <Button className="mt-5" variant="secondary" onClick={onAction}>{actionLabel}</Button> : null}
  </div>
);

export default EmptyState;
