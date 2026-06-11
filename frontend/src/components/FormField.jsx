const FormField = ({ label, id, error, ...props }) => (
  <label className="block" htmlFor={id}>
    <span className="text-sm font-medium text-ink">{label}</span>
    <input
      id={id}
      className="mt-2 min-h-11 w-full rounded-md border border-line bg-white px-3 text-ink outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-blue-100"
      {...props}
    />
    {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
  </label>
);

export default FormField;
