import { Modal, Form, Button } from 'react-bootstrap';

export default function EditItemModal({
  show,
  setShow,
  fields,
  editingItem,
  setEditingItem,
  saveEditItem
}) {
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
              type={field.type === 'alphanumeric' ? 'text' : field.type}
              value={editingItem[field.name] || ''}
              onChange={(e) =>
                setEditingItem({ ...editingItem, [field.name]: e.target.value })
              }
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
