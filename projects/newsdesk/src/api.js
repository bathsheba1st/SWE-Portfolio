// Every call to the server goes through this file.

/** An error from the API. `fields` holds per-field validation messages. */
export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  // 204 means "done, nothing to send back".
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.error ?? 'Something went wrong.', response.status, data?.fields);
  }
  return data;
}

export const api = {
  me: () => request('GET', '/auth/me'),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  logout: () => request('POST', '/auth/logout', {}),

  listStories: ({ status, mine }) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (mine) params.set('mine', '1');
    return request('GET', `/stories?${params}`);
  },
  getStory: (id) => request('GET', `/stories/${id}`),
  createStory: (story) => request('POST', '/stories', story),
  updateStory: (id, story) => request('PUT', `/stories/${id}`, story),
  setStatus: (id, status) => request('POST', `/stories/${id}/status`, { status }),
  deleteStory: (id) => request('DELETE', `/stories/${id}`, {}),
};
