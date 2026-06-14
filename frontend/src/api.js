const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Remove square brackets, single quotes, and double quotes that might be wrapping the URL
export const API_BASE_URL = rawUrl.replace(/[\[\]'"]/g, "").trim();

/**
 * Submits a mammogram image to the backend for direct classification.
 * @param {File} file - The image file to classify.
 * @param {string} token - The user authentication token.
 * @returns {Promise<Object>} - The JSON response with class, confidence, and raw probabilities.
 */
export async function predictMammogram(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error ${response.status}`);
  }

  return response.json();
}
