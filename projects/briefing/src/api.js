// Every call to the server goes through this file.

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? 'Something went wrong.');
  }
  return data;
}

export const api = {
  /** filters: { topic, q, page }. Empty values are left out of the URL. */
  listStories: (filters) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    return request('GET', `/stories?${params}`);
  },
  listTopics: () => request('GET', '/topics'),
  getStory: (slug) => request('GET', `/stories/${encodeURIComponent(slug)}`),
  summarize: (slug) => request('POST', `/stories/${encodeURIComponent(slug)}/summary`, {}),
  subscribe: (email) => request('POST', '/subscribers', { email }),
};
