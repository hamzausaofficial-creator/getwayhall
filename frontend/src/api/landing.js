import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:8000/api');

/** Public landing CMS - no auth required. */
export const getLandingContent = () =>
  axios.get(`${API_BASE}/landing/`).then((r) => r.data);

/** Live hero metrics - polled for realtime counters. */
export const getLandingLiveStats = () =>
  axios.get(`${API_BASE}/landing/stats/`).then((r) => r.data);
