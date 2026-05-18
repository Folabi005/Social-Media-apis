const BASE_URL =
  (typeof process !== "undefined" && process.env?.API_BASE_URL) ||
  "http://localhost:5000";

export async function login({ email, password }) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Login failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getPosts(userId) {
  const url = new URL(`${BASE_URL}/posts/timeline/all`);
  if (userId) {
    url.searchParams.set("userId", userId);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load posts: ${response.status} ${errorText}`);
  }

  return response.json();
}
