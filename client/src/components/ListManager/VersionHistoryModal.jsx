import { useState, useEffect } from "react";
import { Modal, Button, ListGroup, Spinner, Alert } from "react-bootstrap";
import { apiFetch } from "../../utils/auth.js";

export default function VersionHistoryModal({ show, setShow, listId, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show || !listId) return;
    setLoading(true);
    setError("");

    apiFetch(`/.netlify/functions/getVersions/${listId}`, { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCurrentData({
            title: data.currentTitle,
            fields: data.currentFields,
            items: data.currentItems,
          });
          setVersions(data.versions || []);
        }
      })
      .catch((err) => setError("Error al cargar versiones"))
      .finally(() => setLoading(false));
  }, [show, listId]);

  const handleRestore = async (versionIndex) => {
    if (!window.confirm("¿Restaurar esta versión? Se guardará la versión actual como backup.")) return;

    try {
      const res = await apiFetch(`/.netlify/functions/restoreVersion/${listId}/${versionIndex}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        onRestore(data);
        setShow(false);
      } else {
        alert(data.error || "Error al restaurar versión");
      }
    } catch (err) {
      alert("Error al restaurar versión");
    }
  };

  const formatDate = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Modal show={show} onHide={() => setShow(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>📜 Historial de Versiones</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="mt-2">Cargando versiones...</p>
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && !error && (
          <>
            {/* Versión actual */}
            {currentData && (
              <div className="mb-4 p-3 border rounded bg-light">
                <h6 className="text-success mb-2">
                  ✅ Versión Actual (v{versions.length})
                </h6>
                <p className="mb-1"><strong>Título:</strong> {currentData.title}</p>
                <p className="mb-1">
                  <strong>Campos:</strong> {currentData.fields?.length || 0} |{" "}
                  <strong>Items:</strong> {currentData.items?.length || 0}
                </p>
              </div>
            )}

            {/* Versiones anteriores */}
            <h6>Versiones Anteriores:</h6>
            {versions.length === 0 ? (
              <p className="text-muted">Aún no hay versiones anteriores.</p>
            ) : (
              <ListGroup>
                {versions.map((v, i) => (
                  <ListGroup.Item
                    key={i}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>v{v.versionIndex}</strong> - {v.title}
                      <br />
                      <small className="text-muted">
                        {formatDate(v.timestamp)} — {v.fields?.length || 0} campos,{" "}
                        {v.items?.length || 0} items
                      </small>
                    </div>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleRestore(v.versionIndex)}
                    >
                      Restaurar
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShow(false)}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}