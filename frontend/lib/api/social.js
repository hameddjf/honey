import { api, isAuthenticated } from "./client";

const enc = encodeURIComponent;

// Reads work for anyone; the token is only attached when the visitor is logged in
// (so "my reaction" and "can delete" are filled in).
export const fetchReactions = (slug) => api.get(`/products/${enc(slug)}/reactions/`, { auth: isAuthenticated() });
export const sendReaction = (slug, value) => api.post(`/products/${enc(slug)}/reactions/`, { value }, { auth: true });
export const fetchComments = (slug) => api.get(`/products/${enc(slug)}/comments/`, { auth: isAuthenticated() });
export const sendComment = (slug, body, parent = null) =>
  api.post(`/products/${enc(slug)}/comments/`, { body, parent }, { auth: true });
export const removeComment = (slug, id) => api.delete(`/products/${enc(slug)}/comments/${id}/`, { auth: true });
