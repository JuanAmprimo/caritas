export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  const res = await fetch("http://localhost:3001/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("accessToken", data.accessToken);
    return data.accessToken;
  } else {
    throw new Error(data.error || "No se pudo refrescar el token");
  }
};
