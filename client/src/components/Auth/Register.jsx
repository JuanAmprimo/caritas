import { useState } from "react";
import { Container, Card, Form, Button, Toast, ToastContainer } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({ username: "", email: "", confirmEmail: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [showToast, setShowToast] = useState(false);       // 🔹 estado para mostrar el toast
  const [toastMessage, setToastMessage] = useState("");    // 🔹 mensaje del toast
  const [toastVariant, setToastVariant] = useState("success"); // 🔹 color del toast (success/danger)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username || formData.username.length < 4) {
      newErrors.username = "El nombre de usuario debe tener al menos 4 caracteres";
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Formato de email inválido";
    }
    if (!formData.confirmEmail || formData.confirmEmail !== formData.email) {
      newErrors.confirmEmail = "Los emails no coinciden";
    }
    // password length will be validated by the strength regex below
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    // Password strength: min 8, one uppercase, one number, one symbol
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(formData.password)) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un símbolo";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const payload = { username: formData.username, email: formData.email.trim().toLowerCase(), confirmEmail: formData.confirmEmail ? formData.confirmEmail.trim().toLowerCase() : formData.email.trim().toLowerCase(), password: formData.password };

        const res = await fetch(`/.netlify/functions/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
          setToastMessage("Registro exitoso ✅. Ahora puedes iniciar sesión.");
          setToastVariant("success");
          setShowToast(true);
        } else {
          setToastMessage(data.error || "Error al registrarse");
          setToastVariant("danger");
          setShowToast(true);
        }
      } catch (err) {
        setToastMessage("Error de conexión con el servidor");
        setToastVariant("danger");
        setShowToast(true);
      }
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <Card className="shadow-lg border-0" style={{ width: "100%", maxWidth: "400px" }}>
        <Card.Header style={{ backgroundColor: "#8b5cf6" }}>
          <h4 className="fw-bold text-white mb-0">Registrarse</h4>
        </Card.Header>
        <Card.Body>
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Nombre de Usuario</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ingresa tu nombre de usuario"
                required
                isInvalid={!!errors.username}
              />
              <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
            </Form.Group>

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

            <Form.Group className="mb-3" controlId="confirmEmail">
              <Form.Label>Confirmar Email</Form.Label>
              <Form.Control
                type="email"
                name="confirmEmail"
                value={formData.confirmEmail}
                onChange={handleChange}
                placeholder="Repite tu email"
                required
                isInvalid={!!errors.confirmEmail}
              />
              <Form.Control.Feedback type="invalid">{errors.confirmEmail}</Form.Control.Feedback>
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

            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Confirmar Contraseña</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                required
                isInvalid={!!errors.confirmPassword}
              />
              <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
            </Form.Group>

            <Button type="submit" className="w-100 fw-semibold list-button" style={{ backgroundColor: "#2563eb", border: "none" }}>
              Registrarse
            </Button>
          </Form>

          <div className="mt-3 text-center">
            <span>¿Ya tienes cuenta? </span>
            <Link to="/login">Inicia sesión aquí</Link>
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
