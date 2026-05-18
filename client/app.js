import { login, createPost, getPosts, getUser } from "./api.js";

const loginForm = document.getElementById("login-form");
const postForm = document.getElementById("post-form");
const authPanel = document.getElementById("auth-panel");
const postPanel = document.getElementById("post-panel");
const postsContainer = document.getElementById("posts-container");
const profileSummary = document.getElementById("profile-summary");
const logoutButton = document.getElementById("logout-button");
const messageBox = document.getElementById("message");

let currentUser = null;
const userCache = new Map();

// Initialize theme from localStorage
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

function showMessage(text, type = "success") {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  messageBox.classList.remove("hidden");
  setTimeout(() => messageBox.classList.add("hidden"), 4000);
}

function setAuthenticated(user) {
  currentUser = user;
  userCache.set(user._id, user);
  authPanel.classList.add("hidden");
  postPanel.classList.remove("hidden");
  profileSummary.innerHTML = `
    <div class="profile-card">
      <div class="avatar">${getAvatarInitial(user)}</div>
      <div>
        <p class="profile-name">${user.username || user.email}</p>
        <p class="profile-subtitle">Logged in as ${user.email}</p>
      </div>
    </div>
  `;
  loadPosts();
}

function resetUI() {
  currentUser = null;
  profileSummary.innerHTML = "";
  authPanel.classList.remove("hidden");
  postPanel.classList.add("hidden");
  postsContainer.innerHTML = "";
}

function getAvatarInitial(user) {
  if (user.profilePicture) {
    return `<img src="${user.profilePicture}" alt="avatar" class="avatar-img" />`;
  }
  const letter = (user.username || user.email || "?").charAt(0).toUpperCase();
  return `<span>${letter}</span>`;
}

async function loadPosts() {
  try {
    postsContainer.innerHTML = "<p>Loading posts...</p>";
    const searchInput = document.getElementById("search-input");
    const searchValue = searchInput ? searchInput.value.trim() : "";
    const response = await getPosts(currentUser?._id, { search: searchValue });
    const posts = Array.isArray(response) ? response : response.posts || [];
    if (posts.length === 0) {
      postsContainer.innerHTML = "<p>No posts available yet.</p>";
      return;
    }

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        let author = post.author || userCache.get(post.userId);
        if (!author && post.userId) {
          author = await getUser(post.userId);
          userCache.set(post.userId, author);
        }
        return { post, author };
      })
    );

    postsContainer.innerHTML = postsWithAuthors
      .map(({ post, author }) => `
      <article class="post-card">
        <div class="post-head">
          <div class="post-author-avatar">${getAvatarInitial(author)}</div>
          <div>
            <p class="post-author-name">${author.username || author.email}</p>
            <p class="post-author-meta">${new Date(post.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <p>${post.desc || "No text provided."}</p>
        ${post.img ? `<img src="${post.img}" alt="post image" />` : ""}
      </article>`
      )
      .join("");
  } catch (error) {
    postsContainer.innerHTML = "";
    showMessage(error.message, "error");
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const user = await login({ email, password });
    showMessage("Login successful!");
    setAuthenticated(user);
  } catch (error) {
    showMessage(error.message, "error");
  }
});

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(postForm);
  const desc = formData.get("desc");
  const img = formData.get("img");

  try {
    await createPost({ userId: currentUser._id, desc, img });
    showMessage("Post created!");
    postForm.reset();
    loadPosts();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

logoutButton.addEventListener("click", () => {
  resetUI();
  showMessage("Logged out.");
});

// search re-load
const searchInput = document.getElementById("search-input");
if (searchInput) {
  let timeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (currentUser) loadPosts();
    }, 400);
  });
}

// simple theme toggle with persistence
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    showMessage(isDark ? "Dark theme enabled" : "Light theme enabled");
  });
}
