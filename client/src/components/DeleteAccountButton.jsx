import { Button } from "react-bootstrap";
import { refreshAccessToken } from "../utils/auth.js"; // asegúrate de importar

export default function DeleteAccountButton() {
  const deleteAccount = async () => {
    if (!window.confirm("¡Atención! Esto eliminará permanentemente tu cuenta y todos tus datos. ¿Deseas continuar?")) {
      return;
    }

    try {
      let token = localStorage.getItem("accessToken");
      let res = await fetch(`/.netlify/functions/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      // 🔹 Si el accessToken venció, lo renovamos
      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(`/.netlify/functions/delete`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
      }

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken"); // 🔹 limpiar ambos tokens
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        window.location.href = "/register"; // 🔹 redirigir al registro
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Error al eliminar cuenta:", err);
    }
  };

  return (
    <Button 
      variant="danger" 
      className="fw-semibold mt-3 list-button" 
      onClick={deleteAccount}
    >
      Eliminar Cuenta
    </Button>
  );
}
