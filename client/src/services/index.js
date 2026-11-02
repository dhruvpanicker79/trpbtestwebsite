import { api } from './api.js';

export { ApiError } from './api.js';

export const authApi = {
  me: () => api.get('/auth/me'),
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
  logout: () => api.post('/auth/logout'),
};

export const articlesApi = {
  list: (params, opts) => api.get('/articles', params, opts),
  featured: (limit = 5) => api.get('/articles/featured', { limit }),
  trending: (limit = 5) => api.get('/articles/trending', { limit }),
  get: (slug) => api.get(`/articles/${encodeURIComponent(slug)}`),
  related: (id, limit = 3) => api.get(`/articles/${id}/related`, { limit }),
  view: (id) => api.post(`/articles/${id}/view`),
  like: (id) => api.post(`/articles/${id}/like`),
  bookmark: (id) => api.post(`/articles/${id}/bookmark`),
  create: (body) => api.post('/articles', body),
  update: (id, body) => api.patch(`/articles/${id}`, body),
  remove: (id) => api.del(`/articles/${id}`),
};

export const commentsApi = {
  list: (articleId, params) => api.get(`/articles/${articleId}/comments`, params),
  create: (articleId, body) => api.post(`/articles/${articleId}/comments`, { body }),
  reply: (commentId, body) => api.post(`/comments/${commentId}/replies`, { body }),
  remove: (commentId) => api.del(`/comments/${commentId}`),
  report: (commentId, reason) => api.post(`/comments/${commentId}/report`, { reason }),
};

export const taxonomyApi = {
  categories: () => api.get('/categories'),
  category: (slug) => api.get(`/categories/${slug}`),
  tags: () => api.get('/tags'),
  createCategory: (b) => api.post('/categories', b),
  updateCategory: (id, b) => api.patch(`/categories/${id}`, b),
  deleteCategory: (id) => api.del(`/categories/${id}`),
  createTag: (b) => api.post('/tags', b),
  updateTag: (id, b) => api.patch(`/tags/${id}`, b),
  deleteTag: (id) => api.del(`/tags/${id}`),
};

export const searchApi = {
  search: (params, opts) => api.get('/search', params, opts),
};

export const usersApi = {
  profile: (username) => api.get(`/users/${encodeURIComponent(username)}`),
  updateMe: (body) => api.patch('/users/me', body),
  bookmarks: (params) => api.get('/users/me/bookmarks', params),
  moveBookmark: (articleId, list) => api.patch(`/users/me/bookmarks/${articleId}`, { list }),
};

export const pollsApi = {
  list: (params) => api.get('/polls', params),
  get: (id) => api.get(`/polls/${id}`),
  vote: (id, optionId) => api.post(`/polls/${id}/vote`, { optionId }),
  create: (b) => api.post('/polls', b),
  update: (id, b) => api.patch(`/polls/${id}`, b),
  remove: (id) => api.del(`/polls/${id}`),
};

export const playersApi = {
  list: (params) => api.get('/players', params),
  get: (slug) => api.get(`/players/${encodeURIComponent(slug)}`),
  rate: (id, score) => api.post(`/players/${id}/rate`, { score }),
  getById: (id) => api.get(`/admin/players/${id}`),
  create: (b) => api.post('/players', b),
  update: (id, b) => api.patch(`/players/${id}`, b),
  remove: (id) => api.del(`/players/${id}`),
};

export const adminApi = {
  analytics: () => api.get('/admin/analytics'),
  articles: (params) => api.get('/admin/articles', params),
  article: (id) => api.get(`/admin/articles/${id}`),
  setFeatured: (id, featured) => api.patch(`/admin/articles/${id}/featured`, { featured }),
  users: (params) => api.get('/admin/users', params),
  setRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  comments: (params) => api.get('/admin/comments', params),
  moderate: (id, body) => api.patch(`/admin/comments/${id}`, body),
  subscribers: (params) => api.get('/admin/subscribers', params),
};

export const miscApi = {
  subscribe: (email) => api.post('/newsletter', { email }),
  upload: (file, kind = 'article') => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post(kind === 'avatar' ? '/uploads/avatar' : '/uploads', fd);
  },
};
