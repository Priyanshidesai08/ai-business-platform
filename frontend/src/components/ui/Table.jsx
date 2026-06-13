const Table = ({ columns, rows }) => (
  <div className="overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)]">
    <table className="min-w-full divide-y divide-[var(--ui-border)] text-sm">
      <thead className="bg-[var(--ui-surface-muted)]">
        <tr>
          {columns.map((column) => (
            <th key={column.key} className="px-4 py-3 text-left font-semibold text-[var(--ui-text-muted)]">{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--ui-border)]">
        {rows.map((row) => (
          <tr key={row.id}>{columns.map((column) => <td key={column.key} className="px-4 py-3 text-[var(--ui-text)]">{row[column.key]}</td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Table;
