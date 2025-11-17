export const API_BASE = process.env.REACT_APP_API_URL || '';

export async function getHello() {
  const response = await fetch(`${API_BASE}/api/hello`);
  if (!response.ok) {
    throw new Error('Failed to fetch hello message');
  }
  return response.json();
}

