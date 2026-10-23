import { useCallback, useEffect, useState } from 'react';

export async function api(url, { method = 'GET', body } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Error'), { status: res.status });
  return data;
}

export function useApi(url) {
  const [data, setData] = useState(null);
  const load = useCallback(() => api(url).then(setData).catch(() => setData({})), [url]);
  useEffect(() => { load(); }, [load]);
  return { data, reload: load };
}
