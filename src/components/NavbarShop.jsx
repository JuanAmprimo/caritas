import { Container, Nav, Navbar, Form, Button, Badge } from 'react-bootstrap';
import { ShoppingCart, Search, List, Calculator } from 'lucide-react';

export default function NavbarShop({ activeTab, setActiveTab }) {
  return (
    <Navbar expand="lg" className="shadow-sm" style={{ backgroundColor: '#6366f1' }}>
      <Container fluid>
        <Navbar.Brand
          href="#"
          className="fw-bold text-white d-flex align-items-center"
          style={{ fontSize: '1.5rem' }}
        >
          <ShoppingCart size={32} className="me-2" />
          Caritas
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" className="border-white" />

        <Navbar.Collapse id="navbar-nav">
          {/* Buscador */}
          <Form
            className="d-flex mx-auto my-2 my-lg-0"
            style={{ maxWidth: '500px', width: '100%' }}
          >
            <Form.Control
              type="search"
              placeholder="Buscar productos..."
              className="me-2"
              style={{ borderRadius: '25px' }}
            />
            <Button
              variant="light"
              style={{ borderRadius: '25px', minWidth: '100px' }}
            >
              <Search size={18} className="me-1" />
              Buscar
            </Button>
          </Form>

          {/* Navegación */}
          <Nav className="ms-auto">
            <Nav.Link
              onClick={() => setActiveTab('lists')}
              className={`text-white fw-semibold mx-2 ${
                activeTab === 'lists' ? 'border-bottom border-3 border-warning' : ''
              }`}
            >
              <List size={20} className="me-1" />
              Gestión de Listas
            </Nav.Link>
            <Nav.Link
              onClick={() => setActiveTab('calculator')}
              className={`text-white fw-semibold mx-2 ${
                activeTab === 'calculator' ? 'border-bottom border-3 border-warning' : ''
              }`}
            >
              <Calculator size={20} className="me-1" />
              Calculadora
            </Nav.Link>
            <Nav.Link className="text-white position-relative">
              <ShoppingCart size={24} />
              <Badge
                bg="danger"
                className="position-absolute top-0 start-100 translate-middle rounded-pill"
                style={{ fontSize: '0.65rem' }}
              >
                3
              </Badge>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
