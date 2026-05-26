import type { AppData } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function loadData(): Promise<AppData> {
  const res = await fetch(`${API_BASE}/data`);
  if (!res.ok) throw new Error('Failed to load data');
  return res.json();
}

export async function saveData(data: AppData): Promise<void> {
  const res = await fetch(`${API_BASE}/data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save data');
}
