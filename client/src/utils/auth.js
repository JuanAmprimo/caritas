// utils/auth.js
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function saveTokens({ accessToken, refreshToken }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function refreshAccessToken() {
  const res = await fetch("/.netlify/functions/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    return data.accessToken;
  } else {
    clearTokens();
    window.location.href = "/login";
    throw new Error(data.error || "No se pudo refrescar el token");
  }
}

export async function apiFetch(url, options = {}) {
  let token = getAccessToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  if (res.status === 401) {
    try {
      token = await refreshAccessToken();
      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
        credentials: "same-origin",
      });
    } catch {
      alert("Tu sesión expiró o hubo un error al renovar. Volvé a iniciar sesión.");
      window.location.href = "/login";
    }
  }

  return res;
}
