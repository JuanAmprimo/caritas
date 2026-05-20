import { Row, Col, Form, Button } from 'react-bootstrap';
import { Plus } from 'lucide-react';

const formatDateInput = (value) => {
  const numeric = value.replace(/\D/g, '').slice(0, 8);
  const day = numeric.slice(0, 2);
  const month = numeric.slice(2, 4);
  const year = numeric.slice(4, 8);
  return [day, month, year].filter(Boolean).join('/');
};

export default function ItemForm({ fields, newItem, setNewItem, addItem }) {
  const handleFieldChange = (name, type, value) => {
    if (type === 'date') {
      setNewItem({ ...newItem, [name]: formatDateInput(value) });
    } else {
      setNewItem({ ...newItem, [name]: value });
    }
  };

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
                  type={field.type === 'alphanumeric' ? 'text' : field.type === 'date' ? 'text' : field.type}
                  inputMode={field.type === 'date' ? 'numeric' : undefined}
                  value={newItem[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, field.type, e.target.value)}
                  placeholder={field.type === 'date' ? 'dd/mm/yyyy' : `Ingresa ${field.name}`}
                  maxLength={field.type === 'date' ? 10 : undefined}
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
