import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const topicsApi = {
  list: () => api.get('/topics'),
  create: (data: any) => api.post('/topics', data),
  update: (name: string, data: any) => api.put(`/topics/${name}`, data),
  delete: (name: string) => api.delete(`/topics/${name}`),
};

export const recipientsApi = {
  list: () => api.get('/recipients'),
  create: (data: any) => api.post('/recipients', data),
  update: (id: number, data: any) => api.put(`/recipients/${id}`, data),
  delete: (id: number) => api.delete(`/recipients/${id}`),
};

export const kafkaApi = {
  setup: () => api.post('/kafka/setup'),
  stats: () => api.get('/kafka/stats'),
  topics: () => api.get('/kafka/topics'),
};

export const feedApi = {
  list: (limit = 20) => api.get(`/feed/?limit=${limit}`),
};

export const healthApi = {
  check: () => api.get('/health'),
};
