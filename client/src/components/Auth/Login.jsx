import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Card, Form, Button, Toast, ToastContainer } from "react-bootstrap";
import { saveTokens } from "../../utils/auth.js";

export default function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showToast, setShowToast] = useState(false);        // 🔹 estado para mostrar el toast
  const [toastMessage, setToastMessage] = useState("");     // 🔹 mensaje del toast
  const [toastVariant, setToastVariant] = useState("success"); // 🔹 color del toast (success/danger)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Formato de email inválido";
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    if (storedToken) {
      navigate("/lists");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const res = await fetch("http://localhost:3001/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        const data = await res.json();

        if (res.ok) {
            saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
            if (setIsLoggedIn) setIsLoggedIn(true);
            setToastMessage("Login exitoso ✅. Bienvenido!");
            setToastVariant("success");
            setShowToast(true);
            navigate("/lists");
        } else {
          setToastMessage(data.error || "Error al iniciar sesión");
          setToastVariant("danger");
          setShowToast(true);
        }
      } catch (err) {
        console.error("Error en login:", err);
        setToastMessage("Error de conexión con el servidor");
        setToastVariant("danger");
        setShowToast(true);
      }
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <Card className="shadow-lg border-0" style={{ width: "100%", maxWidth: "400px" }}>
        <Card.Header style={{ backgroundColor: "#6366f1" }}>
          <h4 className="fw-bold text-white mb-0">Iniciar Sesión</h4>
        </Card.Header>
        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@email.com"
                required
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ingresa tu contraseña"
                required
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            </Form.Group>

            <Button type="submit" className="w-100 fw-semibold list-button" style={{ backgroundColor: "#10b981", border: "none" }}>
              Ingresar
            </Button>
          </Form>

          <div className="mt-3 text-center">
            <span>¿No tienes cuenta? </span>
            <Link to="/register">Regístrate aquí</Link>
          </div>
        </Card.Body>
      </Card>

      {/* 🔹 Toast de feedback */}
      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toastVariant} show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide>
          <Toast.Header>
            <strong className="me-auto">Sistema</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
