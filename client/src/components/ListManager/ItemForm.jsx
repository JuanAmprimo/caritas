import { Row, Col, Form, Button } from 'react-bootstrap';
import { Plus } from 'lucide-react';

export default function ItemForm({ fields, newItem, setNewItem, addItem }) {
  return (
    <Row className="mb-4">
      <Col>
        <h5>Agregar Nuevo Item</h5>
        <Row>
          {fields.map(field => (
            <Col md={6} lg={4} key={field.id} className="mb-3">
              <Form.Group>
                <Form.Label className="text-capitalize">{field.name}</Form.Label>
                <Form.Control
                  type={field.type === 'alphanumeric' ? 'text' : field.type === 'date' ? 'date' : field.type}
                  value={newItem[field.name] || ''}
                  onChange={(e) =>
                    setNewItem({ ...newItem, [field.name]: e.target.value })
                  }
                  placeholder={field.type === 'date' ? 'Selecciona una fecha' : `Ingresa ${field.name}`}
                />
              </Form.Group>
            </Col>
          ))}
          <Col xs={12}>
            <p className="text-muted small mb-2">
              Una vez añadido los campos toca el botón verde de abajo
            </p>
            <Button
              className='list-button fw-semibold'
              style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
              onClick={addItem}
            >
              <Plus size={16} className="me-1" /> Agregar Item
            </Button>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}
