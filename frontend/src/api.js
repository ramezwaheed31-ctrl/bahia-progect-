const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Remove square brackets, single quotes, and double quotes that might be wrapping the URL
export const API_BASE_URL = rawUrl.replace(/[\[\]'"]/g, '').trim();
