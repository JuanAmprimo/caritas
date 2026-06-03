import { useEffect, useState } from "react";
import { Card, Container, Row, Col, Button, Form, Table, Spinner, Alert } from "react-bootstrap";
import { Eye, Trash2, Upload, FileText } from "lucide-react";
import { apiFetch } from "../../utils/auth.js";

export default function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewName, setPreviewName] = useState("");

  const loadDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/.netlify/functions/getDocuments", { method: "GET" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudieron cargar los documentos.");
      }
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocuments();
  }, []);

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
      reader.readAsDataURL(file);
    });

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Selecciona un archivo PDF antes de subir.");
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF.");
      return;
    }

    setError("");
    setMessage("");
    setUploading(true);

    try {
      const base64Data = await readFileAsBase64(selectedFile);
      const payload = {
        originalName: selectedFile.name,
        name: selectedFile.name,
        mimeType: selectedFile.type,
        data: base64Data,
      };
      const res = await apiFetch("/.netlify/functions/uploadDocument", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al subir el documento.");
      }

      setSelectedFile(null);
      setMessage("Documento subido correctamente.");
      await loadDocuments();
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (documentId) => {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch(`/.netlify/functions/getDocument/${documentId}`, { method: "GET" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al cargar el documento.");
      }
      const data = await res.json();
      const binary = atob(data.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return url;
      });
      setPreviewName(data.originalName || data.name || "Documento PDF");
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    const confirmed = window.confirm("¿Eliminar este recibo? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      const res = await apiFetch(`/.netlify/functions/deleteDocument/${documentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al eliminar el documento.");
      }
      setDocuments((prev) => prev.filter((doc) => doc._id !== documentId));
      setMessage("Documento eliminado correctamente.");
      setPreviewUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return "";
      });
      setPreviewName("");
    } catch (err) {
      setError(String(err.message || err));
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">📄 Documentos</h4>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Subir recibo (PDF)</Form.Label>
                <Form.Control
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </Form.Group>
              <div className="d-flex gap-2 align-items-center mb-3">
                <Button
                  className="list-button fw-semibold"
                  style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                  onClick={handleUpload}
                  disabled={uploading || loading}
                >
                  {uploading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="me-1" />
                      Subir recibo
                    </>
                  )}
                </Button>
                {selectedFile && (
                  <span className="text-muted small">Archivo listo: {selectedFile.name}</span>
                )}
              </div>
              {error && <Alert variant="danger">{error}</Alert>}
              {message && <Alert variant="success">{message}</Alert>}
            </Col>
          </Row>

          <hr />

          <Row>
            <Col>
              <h5>Recibos subidos</h5>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : documents.length === 0 ? (
                <p className="text-muted">No hay recibos guardados aún.</p>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover responsive className="align-middle text-center">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Fecha</th>
                        <th>Tamaño</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <tr key={document._id}>
                          <td>{document.originalName || document.name}</td>
                          <td>{new Date(document.createdAt).toLocaleString("es-AR")}</td>
                          <td>{Math.round((document.size || 0) / 1024)} KB</td>
                          <td>
                            <Button
                              size="sm"
                              className="me-2 btn-view"
                              onClick={() => handleView(document._id)}
                            >
                              <Eye size={14} /> Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDelete(document._id)}
                            >
                              <Trash2 size={14} /> Eliminar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Col>
          </Row>

          {previewUrl && (
            <Row className="mt-4">
              <Col>
                <Card className="shadow-sm border-0">
                  <Card.Header className="bg-secondary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <FileText size={18} className="me-2" />
                        Vista previa: {previewName}
                      </div>
                      <Button
                        size="sm"
                        variant="outline-light"
                        onClick={() => {
                          setPreviewUrl((currentUrl) => {
                            if (currentUrl) URL.revokeObjectURL(currentUrl);
                            return "";
                          });
                          setPreviewName("");
                        }}
                      >
                        Cerrar vista previa
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0" style={{ minHeight: "600px" }}>
                    <iframe
                      title="Vista previa de documento"
                      src={previewUrl}
                      width="100%"
                      height="600"
                      style={{ border: "none" }}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
