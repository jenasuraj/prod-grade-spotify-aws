import axios from 'axios';

// Same-origin '/api' goes through the Vite proxy in dev, so cookies are sent automatically
export const api = axios.create({ baseURL: '/api', withCredentials: true });

// For presigned S3 urls: absolute, authorised by their signature, and must not carry our cookies
export const s3 = axios.create();
