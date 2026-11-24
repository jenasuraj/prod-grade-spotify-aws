import axios from 'axios';

// Same-origin '/api' goes through the Vite proxy in dev, so cookies are sent automatically
export const api = axios.create({ baseURL: '/api', withCredentials: true });
