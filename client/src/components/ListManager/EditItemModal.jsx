import { Modal, Form, Button } from 'react-bootstrap';

const formatDateInput = (value) => {
  const numeric = value.replace(/\D/g, '').slice(0, 8);
  const day = numeric.slice(0, 2);
  const month = numeric.slice(2, 4);
  const year = numeric.slice(4, 8);
  return [day, month, year].filter(Boolean).join('/');
};

export default function EditItemModal({
  show,
  setShow,
  fields,
  editingItem,
  setEditingItem,
  saveEditItem
}) {
  const handleFieldChange = (name, type, value) => {
    if (type === 'date') {
      setEditingItem({ ...editingItem, [name]: formatDateInput(value) });
    } else {
      setEditingItem({ ...editingItem, [name]: value });
    }
  };

  return (
    <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Editar Item</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {editingItem && fields.map(field => (
          <Form.Group key={field.id} className="mb-3">
            <Form.Label className="text-capitalize">{field.name}</Form.Label>
            <Form.Control
              type={field.type === 'alphanumeric' ? 'text' : field.type === 'date' ? 'text' : field.type}
              inputMode={field.type === 'date' ? 'numeric' : undefined}
              value={editingItem[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, field.type, e.target.value)}
              placeholder={field.type === 'date' ? 'dd/mm/yyyy' : undefined}
              maxLength={field.type === 'date' ? 10 : undefined}
            />
          </Form.Group>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShow(false)}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={saveEditItem}>
          Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
