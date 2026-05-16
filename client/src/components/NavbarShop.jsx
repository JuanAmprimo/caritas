import { Container, Nav, Navbar, Form, Button, Badge } from 'react-bootstrap';
import { Search, List, Calculator } from 'lucide-react';
import CaritasLogo from '../assets/caritas-logo.png'; // Asegúrate de tener el logo en esta ruta

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
            src={CaritasLogo}  // ruta de tu logo
            style={{ width: '40px', height: '40px', marginRight: '10px' }}
          />
          Caritas, parroquia nuestra <br/> señora del carmen
        </Navbar.Brand>


        <Navbar.Toggle aria-controls="navbar-nav" className="border-white" />

        <Navbar.Collapse id="navbar-nav">
          {/* Buscador */}
          <Form 
            className="d-flex mx-auto my-2 my-lg-0" 
            style={{ maxWidth: '500px', width: '100%' }}
            onSubmit={handleSearch} // 🔹 evita reload y busca
          >
            <Form.Control
              type="search"
              placeholder="Buscar donación..." // 🔹 nuevo placeholder
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
