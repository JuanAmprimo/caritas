import { Button } from "react-bootstrap";

export default function DeleteAccountButton() {
  const deleteAccount = async () => {
    if (!window.confirm("¿Seguro que quieres eliminar tu cuenta? Esta acción es irreversible.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3001/api/auth/delete", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        localStorage.removeItem("token"); // 🔹 cerrar sesión
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
