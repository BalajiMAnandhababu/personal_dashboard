export default function CompanyFilterTabs({ companies, selected, onSelect }) {
  const tabs = [{ id: null, name: 'All', color: '#64748b' }, ...companies];

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 overflow-x-auto shrink-0">
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest mr-2 shrink-0">
        Command Dashboard
      </span>
      <div className="flex gap-1 ml-auto">
        {tabs.map((tab) => {
          const active = selected === tab.id;
          return (
            <button
              key={tab.id ?? 'all'}
              onClick={() => onSelect(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all
                ${active
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
              `}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tab.color }}
              />
              {tab.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
