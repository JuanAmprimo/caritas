import { Modal, Form, Button } from 'react-bootstrap';

export default function AddFieldModal({
  show,
  setShow,
  newFieldName,
  setNewFieldName,
  newFieldType,
  setNewFieldType,
  addField
}) {
  return (
    <Modal show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Agregar Nuevo Campo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Nombre del Campo</Form.Label>
          <Form.Control
            type="text"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="Ej: descripción, nombre, fecha, etc."
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Tipo de Campo</Form.Label>
          <Form.Select
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value)}
          >
            <option value="text">Texto</option>
            <option value="number">Número</option>
            <option value="date">Fecha</option>
            <option value="alphanumeric">numero y letra</option>
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShow(false)}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={addField}>
          Agregar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
