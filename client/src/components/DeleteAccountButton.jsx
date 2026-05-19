import { Button } from "react-bootstrap";
import { apiFetch, clearTokens } from "../utils/auth.js";

export default function DeleteAccountButton() {
  const deleteAccount = async () => {
    if (!window.confirm("¡Atención! Esto eliminará permanentemente tu cuenta y todos tus datos. ¿Deseas continuar?")) {
      return;
    }

    try {
      const res = await apiFetch(`/.netlify/functions/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        clearTokens();
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        window.location.href = "/register";
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
