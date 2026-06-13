import { Search, Sparkles } from 'lucide-react';
import Modal from './Modal.jsx';
import Input from './Input.jsx';
import Button from './Button.jsx';

const CommandPalette = ({ open, onClose, query, setQuery, items, onPick }) => {
  const filtered = items.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal open={open} onClose={onClose} title="Quick search">
      <div className="flex items-center gap-2">
        <Search size={16} className="text-[var(--ui-text-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && filtered[0]) {
              onPick(filtered[0]);
            }
            if (event.key === 'Escape') onClose();
          }}
          placeholder="Search pages and actions"
          autoFocus
          aria-label="Search pages and actions"
        />
      </div>
      <div className="mt-4 space-y-2" role="listbox" aria-label="Search results">
        {filtered.map((item) => (
          <button
            key={item.key}
            onClick={() => onPick(item)}
            role="option"
            className="flex w-full items-center justify-between rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-4 py-3 text-left transition hover:bg-[var(--ui-surface)]"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--ui-text)]">{item.label}</p>
              <p className="text-xs text-[var(--ui-text-muted)]">{item.hint}</p>
            </div>
            <Sparkles size={16} className="text-blue-500" />
          </button>
        ))}
        {!filtered.length ? <p className="px-1 py-3 text-sm text-[var(--ui-text-muted)]">No matches found.</p> : null}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export default CommandPalette;
