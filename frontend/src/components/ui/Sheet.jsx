const Sheet = ({ open, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] bg-[var(--ui-overlay)] lg:hidden">
      <div className="absolute inset-y-0 left-0 w-[min(88vw,20rem)] border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
};

export default Sheet;
