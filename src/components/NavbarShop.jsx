import { Container, Nav, Navbar, Form, Button, Badge } from 'react-bootstrap';
import { Search, List, Calculator } from 'lucide-react';

export default function NavbarShop({ activeTab, setActiveTab, searchTerm, setSearchTerm }) {
  return (
    <Navbar expand="lg" className="shadow-sm" style={{ backgroundColor: '#6366f1' }}>
      <Container fluid>
        <Navbar.Brand
          href="#"
          className="fw-bold text-white d-flex align-items-center"
          style={{ fontSize: '1.5rem' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 30" fill="white">
            <rect x="10" y="4" width="4" height="30" />
            <rect x="4" y="10" width="16" height="4" />
          </svg>
          Caritas
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" className="border-white" />

        <Navbar.Collapse id="navbar-nav">
          {/* Buscador */}
          <Form className="d-flex mx-auto my-2 my-lg-0" style={{ maxWidth: '500px', width: '100%' }}>
            <Form.Control
              type="search"
              placeholder="Buscar persona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="me-2"
              style={{ borderRadius: '25px' }}
            />
            <Button variant="light" style={{ borderRadius: '25px', minWidth: '100px' }}>
              <Search size={18} className="me-1" />
              Buscar
            </Button>
          </Form>

          {/* Navegación */}
          <Nav className="ms-auto">
            <Nav.Link
              onClick={() => setActiveTab('lists')}
              className={`text-white fw-semibold mx-2 ${activeTab === 'lists' ? 'border-bottom border-3 border-warning' : ''}`}
            >
              <List size={20} className="me-1" />
              Gestión de Listas
            </Nav.Link>
            <Nav.Link
              onClick={() => setActiveTab('calculator')}
              className={`text-white fw-semibold mx-2 ${activeTab === 'calculator' ? 'border-bottom border-3 border-warning' : ''}`}
            >
              <Calculator size={20} className="me-1" />
              Calculadora
            </Nav.Link>
            <Nav.Link className="text-white position-relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 30" fill="white">
                <rect x="10" y="4" width="4" height="30" />
                <rect x="4" y="10" width="16" height="4" />
              </svg>
              <Badge
                bg="danger"
                className="position-absolute top-0 start-100 translate-middle rounded-pill"
                style={{ fontSize: '0.65rem' }}
              >
                
              </Badge>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
