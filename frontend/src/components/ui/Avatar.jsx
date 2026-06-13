const Avatar = ({ name = '', className = '' }) => (
  <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-semibold text-white ${className}`}>
    {name ? name.charAt(0).toUpperCase() : 'A'}
  </div>
);

export default Avatar;
