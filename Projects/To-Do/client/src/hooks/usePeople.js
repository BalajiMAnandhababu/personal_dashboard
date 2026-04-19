import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

export function usePeople({ includeInactive = false } = {}) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.people.list(includeInactive ? { include_inactive: 'true' } : {});
      setPeople(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => { fetch(); }, [fetch]);

  const createPerson = useCallback(async (body) => {
    const person = await api.people.create(body);
    setPeople(prev => [...prev, person].sort((a, b) => a.name.localeCompare(b.name)));
    return person;
  }, []);

  const updatePerson = useCallback(async (id, body) => {
    const person = await api.people.update(id, body);
    setPeople(prev => {
      const updated = prev.map(p => p.id === id ? person : p);
      return includeInactive ? updated : updated.filter(p => p.is_active);
    });
    return person;
  }, [includeInactive]);

  return { people, loading, refetch: fetch, createPerson, updatePerson };
}
