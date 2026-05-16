import { Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { Plus } from 'lucide-react';

export default function DonationForm({ formData, handleInputChange, handleImageUpload, addOrUpdateDonation, cancelEdit, editingId }) {
  return (
    <Row>
      <Col md={6} lg={3} className="mb-3">
        <Form.Group>
          <Form.Label>Nombre de la Donación*</Form.Label>
          <Form.Control
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ej: ropa"
            required
          />
        </Form.Group>
      </Col>

      <Col md={6} lg={2} className="mb-3">
        <Form.Group>
          <Form.Label>Precio *</Form.Label>
          <InputGroup>
            <InputGroup.Text>$</InputGroup.Text>
            <Form.Control
              type="number"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
              placeholder="0.00"
              step="0.01"
              required
            />
          </InputGroup>
        </Form.Group>
      </Col>

      <Col md={6} lg={2} className="mb-3">
        <Form.Group>
          <Form.Label>Talle</Form.Label>
          <Form.Control
            type="text"
            value={formData.size || ''}
            onChange={(e) => handleInputChange('size', e.target.value)}
            placeholder="Ej: M, L, XL"
          />
        </Form.Group>
      </Col>

      <Col md={6} lg={2} className="mb-3">
        <Form.Group>
          <Form.Label>Cantidad</Form.Label>
          <Form.Control
            type="number"
            value={formData.quantity || 1}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
            placeholder="1"
          />
        </Form.Group>
      </Col>

      <Col md={12} lg={3} className="mb-3">
        <Form.Group>
          <Form.Label>Imagen de la Donación (opcional)</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </Form.Group>
      </Col>

      <Col md={12} className="mb-3">
        <Form.Group>
          <Form.Label>Descripción</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descripción opcional de la donación"
          />
        </Form.Group>
      </Col>

      <Col xs={12}>
        <Button
          style={{ backgroundColor: editingId ? '#f59e0b' : '#10b981', borderColor: editingId ? '#f59e0b' : '#10b981' }}
          onClick={addOrUpdateDonation}
          className="me-2 list-button fw-semibold"
        >
          <Plus size={16} className="me-1" />
          {editingId ? 'Actualizar Donación' : 'Agregar Donación'}
        </Button>
        {editingId && (
          <Button variant="secondary" onClick={cancelEdit} className="list-button fw-semibold">
            Cancelar
          </Button>
        )}
      </Col>
    </Row>
  );
}
