import { Container, Nav, Navbar, Form, Button } from 'react-bootstrap';
import { Search, List, Calculator, User } from 'lucide-react'; 
import CaritasLogo from '../assets/caritas-logo.png'; 
import { Link } from "react-router-dom";

export default function NavbarShop({ activeTab, setActiveTab, searchTerm, setSearchTerm }) {

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
    <Navbar expand="lg" className="shadow-sm" style={{ backgroundColor: '#6366f1' }}>
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
            className="d-flex mx-auto my-2 my-lg-0" 
            style={{ maxWidth: '500px', width: '100%' }}
            onSubmit={handleSearch}
          >
            <Form.Control
              type="search"
              placeholder="Buscar donación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="me-2"
              style={{ borderRadius: '25px' }}
            />
            <Button 
              variant="light" 
              style={{ borderRadius: '25px', minWidth: '100px' }}
              type="submit"
            >
              <Search size={18} className="me-1" />
              Buscar
            </Button>
          </Form>

          {/* Navegación */}
          <Nav className="ms-auto">
            
            <Nav.Link as={Link} to="/lists" className="text-white fw-semibold mx-2">
              <List size={20} className="me-1" />
              Gestión de Listas
            </Nav.Link>

            <Nav.Link as={Link} to="/calculator" className="text-white fw-semibold mx-2">
              <Calculator size={20} className="me-1" />
              Calculadora
            </Nav.Link>

            {/* Ícono de usuario (Login/Register) */}
            <Nav.Link as={Link} to="/login" className="text-white fw-semibold mx-2">
              <User size={22} className="me-1" />
              Ingresar
            </Nav.Link>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
