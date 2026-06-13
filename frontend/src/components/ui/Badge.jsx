const tones = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  accent: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
};

const Badge = ({ tone = 'default', className = '', children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>
    {children}
  </span>
);

export default Badge;
