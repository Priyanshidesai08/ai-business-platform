const Card = ({ className = '', children, ...props }) => (
  <section
    className={`rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5 shadow-[var(--ui-shadow)] backdrop-blur-xl transition duration-200 ease-out hover:-translate-y-0.5 ${className}`}
    {...props}
  >
    {children}
  </section>
);

export default Card;
