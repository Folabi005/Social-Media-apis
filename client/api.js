const BASE_URL = window.location.origin;

async function request(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || response.statusText || "Request failed");
  }
  return body;
}

export function login({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function createPost(postData) {
  return request("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData),
  });
}

export function getPosts(userId, options = {}) {
  // if search provided, call public posts search endpoint
  if (options.search) {
    const q = encodeURIComponent(options.search);
    return fetch(`${BASE_URL}/posts?title=${q}`).then(async (response) => {
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message || response.statusText || "Request failed");
      }
      return body;
    });
  }

  const url = new URL("/posts/timeline/all", BASE_URL);
  if (userId) {
    url.searchParams.set("userId", userId);
  }
  return fetch(url.toString()).then(async (response) => {
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.message || response.statusText || "Request failed");
    }
    return body;
  });
}

export function getUser(userId) {
  return request(`/users/${userId}`);
}
