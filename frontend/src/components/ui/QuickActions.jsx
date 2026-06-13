import { Plus, Sparkles, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickActions = () => (
  <div className="fixed bottom-4 right-4 z-[50] flex flex-col gap-2">
    <Link aria-hidden="true" tabIndex={-1} aria-label="Quick action open AI Studio" className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-sm font-semibold text-[var(--ui-text)] shadow-lg backdrop-blur-xl" to="/ai-studio">
      <Sparkles size={16} /> AI Studio
    </Link>
    <Link aria-hidden="true" tabIndex={-1} aria-label="Quick action open collaboration" className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3 text-sm font-semibold text-[var(--ui-text)] shadow-lg backdrop-blur-xl" to="/collaboration">
      <Workflow size={16} /> Collaboration
    </Link>
    <Link aria-hidden="true" tabIndex={-1} aria-label="Quick action create new lead" className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20" to="/leads">
      <Plus size={16} /> New lead
    </Link>
  </div>
);

export default QuickActions;
