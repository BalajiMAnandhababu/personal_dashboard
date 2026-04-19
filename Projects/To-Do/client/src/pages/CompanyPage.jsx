import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function CompanyPage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.companies.get(id)
      .then(setCompany)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
  if (!company) return <div className="p-6 text-slate-500">Company not found.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <span
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: company.color }}
        />
        <h2 className="text-xl font-semibold text-slate-100">{company.name}</h2>
      </div>
      <p className="text-sm text-slate-500">{company.tasks?.length ?? 0} tasks</p>
    </div>
  );
}
