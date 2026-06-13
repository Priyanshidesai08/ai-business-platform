const Tooltip = ({ children, label }) => (
  <span className="group relative inline-flex">
    {children}
    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
      {label}
    </span>
  </span>
);

export default Tooltip;
