import { Container, Row, Col } from 'react-bootstrap';
import { Phone, Mail } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="mt-5">
      <div style={{ backgroundColor: '#6366f1' }} className="text-white py-4">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="mb-3 mb-md-0">
              <p className="mb-0">
                © 2026 Mi Tienda Premium. Todos los derechos reservados.
              </p>
            </Col>

            <Col md={6}>
              <div className="d-flex flex-column flex-md-row justify-content-md-end align-items-start align-items-md-center gap-3">
                <a href="#" className="text-white d-flex align-items-center gap-2">
                  <FaInstagram size={24} />
                  <span>@mitienda</span>
                </a>
                <div className="d-flex align-items-center gap-2">
                  <Phone size={18} />
                  <span className="small">(123) 456-7890</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Mail size={18} />
                  <span className="small">info@tiendasample.com</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </footer>
  );
}
