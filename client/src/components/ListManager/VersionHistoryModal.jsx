import { Button, ListGroup, Modal } from "react-bootstrap";
import { RotateCcw, Trash2 } from "lucide-react";

const formatDate = (dateValue) => {
  if (!dateValue) return "Sin fecha";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

export default function VersionHistoryModal({ show, onHide, versions, onRestore, onDelete }) {
  const sortedVersions = [...(Array.isArray(versions) ? versions : [])].sort(
    (a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0),
  );

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Historial de versiones</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {sortedVersions.length === 0 ? (
          <p className="text-muted mb-0">Todavia no hay versiones guardadas.</p>
        ) : (
          <ListGroup>
            {sortedVersions.map((version, index) => (
              <ListGroup.Item
                key={version._id || version.savedAt || index}
                className="d-flex justify-content-between align-items-center gap-3"
              >
                <div>
                  <div className="fw-semibold">{version.title || "Lista sin nombre"}</div>
                  <div className="text-muted small">
                    {formatDate(version.savedAt)} - {version.items?.length || 0} items
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="d-flex align-items-center gap-1"
                    onClick={() => onDelete?.(version)}
                  >
                    <Trash2 size={14} /> Eliminar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="d-flex align-items-center gap-1"
                    onClick={() => onRestore(version)}
                  >
                    <RotateCcw size={14} /> Restaurar
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
