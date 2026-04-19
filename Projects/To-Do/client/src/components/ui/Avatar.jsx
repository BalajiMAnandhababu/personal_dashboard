export default function Avatar({ person, size = 'sm', className = '' }) {
  const sizes = { xs: 'w-5 h-5 text-[9px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm' };
  if (!person) {
    return (
      <div className={`${sizes[size]} rounded-full bg-slate-700 flex items-center justify-center shrink-0 ${className}`}>
        <span className="text-slate-400 font-medium">B</span>
      </div>
    );
  }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center shrink-0 font-medium ${className}`}
      style={{ backgroundColor: person.avatar_color || '#334155' }}
      title={person.name}
    >
      <span className="text-white">{person.initials}</span>
    </div>
  );
}
