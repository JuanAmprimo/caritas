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

  // Detectar respuesta que indica que el usuario no existe (por ejemplo, cuenta eliminada)
  try {
    const cloned = res.clone();
    const body = await cloned.json().catch(() => null);
    const msg = (body && (body.error || body.message || "")) || "";

    const indicatesMissingUser =
      res.status === 404 ||
      res.status === 410 ||
      /user|usuario|no encontrado|not found/i.test(msg);

    if (indicatesMissingUser) {
      clearTokens();
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      alert("Tu cuenta no fue encontrada. Se cerrará la sesión.");
      window.location.href = "/register";
      // No retornamos nada porque ya navegamos fuera; esto evita que el frontend siga en estado inválido.
    }
  } catch (err) {
    // Si no se pudo parsear JSON o ocurrió un error, ignoramos y devolvemos la respuesta original.
  }

  return res;
}
