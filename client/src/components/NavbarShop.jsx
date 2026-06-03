import { Container, Nav, Navbar, Form, Button, NavDropdown } from 'react-bootstrap';
import { Search, List, Calculator, User, FileText } from 'lucide-react';
import CaritasLogo from '../assets/caritas-logo.png'; 
import { NavLink, useNavigate } from "react-router-dom";
import DeleteAccountButton from "./DeleteAccountButton"; // 🔹 importar el botón
import { apiFetch, clearTokens } from "../utils/auth.js";

export default function NavbarShop({ searchTerm, setSearchTerm, isLoggedIn, username, setIsLoggedIn, setUsername }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!window.confirm("¿Deseas cerrar sesión?")) return;

    try {
      await apiFetch(`/.netlify/functions/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }

    clearTokens();
    localStorage.removeItem('username');
    localStorage.removeItem('userId');

    setSearchTerm('');
    setIsLoggedIn(false);
    setUsername('');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const found = document.querySelectorAll(`[data-name*="${searchTerm.toLowerCase()}"]`);
    found.forEach(el => {
      el.querySelectorAll("td").forEach(td => {
        td.classList.add("highlight");
        setTimeout(() => td.classList.remove("highlight"), 2000);
      });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <Navbar expand="md" className="app-navbar shadow-sm" style={{ backgroundColor: '#6366f1' }}>
      <Container fluid>
        <Navbar.Brand
          href="#"
          className="fw-bold text-white d-flex align-items-center"
          style={{ fontSize: '1.0rem' }}
        >
          <img
            src={CaritasLogo}
            style={{ width: '40px', height: '40px', marginRight: '10px' }}
            alt="Caritas Logo"
          />
          Caritas, parroquia nuestra <br/> señora del carmen
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" className="border-white" />

        <Navbar.Collapse id="navbar-nav">
          {/* Buscador */}
          <Form 
            className="d-flex flex-column flex-md-row align-items-center gap-2 mx-auto my-2 my-lg-0" 
            style={{ maxWidth: '300px', width: '100%' }}
            onSubmit={handleSearch}
          >
            <Form.Control
              type="search"
              placeholder="Buscar donación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="me-md-2"
              style={{ borderRadius: '25px', flex: 1, minWidth: '0' }}
            />
            <Button 
              variant="light" 
              style={{ borderRadius: '25px', minWidth: '90px' }}
              type="submit"
            >
              <Search size={18} className="me-1" />
              Buscar
            </Button>
          </Form>

          {/* Navegación */}
          <Nav className="ms-auto">
            <Nav.Link
              as={NavLink}
              to="/lists"
              className="text-white fw-semibold mx-2 nav-link-custom"
            >
              <List size={20} className="me-1" />
              Gestión de Listas
            </Nav.Link>
            <Nav.Link
              as={NavLink}
              to="/calculator"
              className="text-white fw-semibold mx-2 nav-link-custom"
            >
              <Calculator size={20} className="me-1" />
              Calculadora
            </Nav.Link>
            <Nav.Link
              as={NavLink}
              to="/documents"
              className="text-white fw-semibold mx-2 nav-link-custom"
            >
              <FileText size={20} className="me-1" />
              Documentos
            </Nav.Link>

            {/* 🔹 Dropdown de Ingresar */}
            <NavDropdown
              title={<><User size={22} className="me-1" /> {isLoggedIn ? username || 'Usuario' : 'Ingresar'}</>}
              id="login-dropdown"
              align="end"
              className="login-nav-dropdown text-white nav-link-custom"
              renderMenuOnMount={true}
            >
              {!isLoggedIn && <NavDropdown.Item as={NavLink} to="/login">Iniciar Sesión</NavDropdown.Item>}
              {!isLoggedIn && <NavDropdown.Item as={NavLink} to="/register">Registrarse</NavDropdown.Item>}
              {isLoggedIn && <NavDropdown.Item onClick={handleLogout}>Cerrar Sesión</NavDropdown.Item>}
              {isLoggedIn && <NavDropdown.Divider />}
              {isLoggedIn && <DeleteAccountButton />}
            </NavDropdown>


          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
