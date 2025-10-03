// Ensure backend URL doesn't have trailing slash to prevent double slashes
export const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:4000'
export const currency = '₹'
