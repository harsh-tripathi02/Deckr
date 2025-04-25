// api.js
// Set your backend URL here (update as needed for Docker/production)
export const API_BASE_URL = "http://localhost:5000";

export async function apiFetch(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  return response;
}
