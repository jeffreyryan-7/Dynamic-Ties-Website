// Utility function to handle path resolution consistently across development and production
export const getBasePath = (path) => {
  // Remove leading slash if it exists to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In development, we want to use the root path
  // In production, we use the base URL from Vite
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}; 