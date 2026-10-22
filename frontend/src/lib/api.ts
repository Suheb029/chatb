const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('whatbot_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData: any) =>
      request<any>('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    demoLogin: (role: 'admin' | 'agent' = 'admin') =>
      request<any>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
    getMe: () => request<any>('/auth/me'),
  },

  // Dashboard Overview & Stats
  dashboard: {
    getOverview: () => request<any>('/dashboard/overview'),
  },

  // Live Chat & Conversations
  conversations: {
    getList: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      return request<any>(`/conversations?${q.toString()}`);
    },
    getById: (id: string) => request<any>(`/conversations/${id}`),
    sendMessage: (id: string, payload: { text?: string; messageType?: string; mediaUrl?: string; fileName?: string }) =>
      request<any>(`/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    simulateIncoming: (id: string, text: string) =>
      request<any>(`/conversations/${id}/simulate`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    updateStatus: (id: string, status: 'open' | 'pending' | 'resolved') =>
      request<any>(`/conversations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    assignAgent: (id: string, agentName: string) =>
      request<any>(`/conversations/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ agentName }),
      }),
    updateNotes: (id: string, internalNotes: string) =>
      request<any>(`/conversations/${id}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNotes }),
      }),
    resumeBot: (id: string) =>
      request<any>(`/conversations/${id}/resume-bot`, { method: 'POST' }),
    getSession: (id: string) =>
      request<any>(`/conversations/${id}/session`),
  },

  // Contacts Management
  contacts: {
    getList: (params?: { tag?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.tag) q.append('tag', params.tag);
      if (params?.search) q.append('search', params.search);
      return request<any>(`/contacts?${q.toString()}`);
    },
    create: (data: any) =>
      request<any>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/contacts/${id}`, { method: 'DELETE' }),
    getCsvExportUrl: () => `${API_BASE}/contacts/export/csv`,
  },

  // Chatbot Builder & Settings
  bot: {
    getSettings: () => request<any>('/bot/settings'),
    updateSettings: (settings: any) =>
      request<any>('/bot/settings', { method: 'PUT', body: JSON.stringify(settings) }),
    testSimulator: (message: string) =>
      request<any>('/bot/simulate', { method: 'POST', body: JSON.stringify({ message }) }),
  },

  // Automated Replies
  autoReplies: {
    getList: () => request<any>('/auto-replies'),
    create: (rule: any) =>
      request<any>('/auto-replies', { method: 'POST', body: JSON.stringify(rule) }),
    update: (id: string, rule: any) =>
      request<any>(`/auto-replies/${id}`, { method: 'PUT', body: JSON.stringify(rule) }),
    toggle: (id: string) =>
      request<any>(`/auto-replies/${id}/toggle`, { method: 'PATCH' }),
    delete: (id: string) =>
      request<any>(`/auto-replies/${id}`, { method: 'DELETE' }),
  },

  // FAQ Management
  faqs: {
    getList: (params?: { category?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.append('category', params.category);
      if (params?.search) q.append('search', params.search);
      return request<any>(`/faqs?${q.toString()}`);
    },
    create: (faq: any) =>
      request<any>('/faqs', { method: 'POST', body: JSON.stringify(faq) }),
    update: (id: string, faq: any) =>
      request<any>(`/faqs/${id}`, { method: 'PUT', body: JSON.stringify(faq) }),
    delete: (id: string) =>
      request<any>(`/faqs/${id}`, { method: 'DELETE' }),
  },

  // Message Templates
  templates: {
    getList: (params?: { category?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.append('category', params.category);
      if (params?.status) q.append('status', params.status);
      return request<any>(`/templates?${q.toString()}`);
    },
    create: (template: any) =>
      request<any>('/templates', { method: 'POST', body: JSON.stringify(template) }),
    update: (id: string, template: any) =>
      request<any>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(template) }),
    delete: (id: string) =>
      request<any>(`/templates/${id}`, { method: 'DELETE' }),
    submitApproval: (id: string) =>
      request<any>(`/templates/${id}/submit-approval`, { method: 'POST' }),
  },

  // Campaigns
  campaigns: {
    getList: () => request<any>('/campaigns'),
    create: (campaign: any) =>
      request<any>('/campaigns', { method: 'POST', body: JSON.stringify(campaign) }),
  },

  // WhatsApp API Settings
  settings: {
    getSettings: () => request<any>('/settings'),
    updateSettings: (settings: any) =>
      request<any>('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
    testConnection: () =>
      request<any>('/settings/test-connection', { method: 'POST' }),
    resetDemo: () =>
      request<any>('/settings/reset-demo', { method: 'POST' }),
  },

  // Business Profile & Assistant Configuration
  businessConfig: {
    get: () => request<any>('/business-config'),
    update: (data: any) =>
      request<any>('/business-config', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Catalog (Products, Services, Packages, Plans)
  catalog: {
    getList: (params?: { type?: string; category?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.append('type', params.type);
      if (params?.category) q.append('category', params.category);
      if (params?.search) q.append('search', params.search);
      return request<any>(`/catalog?${q.toString()}`);
    },
    getById: (id: string) => request<any>(`/catalog/${id}`),
    create: (data: any) =>
      request<any>('/catalog', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/catalog/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/catalog/${id}`, { method: 'DELETE' }),
  },

  // Bookings Management
  bookings: {
    getList: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      return request<any>(`/bookings?${q.toString()}`);
    },
    updateStatus: (id: string, status: string) =>
      request<any>(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    track: (ref: string) => request<any>(`/bookings/track/${ref}`),
  },

  // Orders Management
  orders: {
    getList: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      return request<any>(`/orders?${q.toString()}`);
    },
    updateStatus: (id: string, status: string) =>
      request<any>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    track: (ref: string) => request<any>(`/orders/track/${ref}`),
  },
};
