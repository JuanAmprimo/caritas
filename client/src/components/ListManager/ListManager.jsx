import { useCallback, useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import { Container, Card, Row, Col, Button } from "react-bootstrap";
import { Plus } from "lucide-react";
import FieldBadge from "./FieldBadge";
import AddFieldModal from "./AddFieldModal";
import EditItemModal from "./EditItemModal";
import ItemForm from "./ItemForm";
import ItemTable from "./ItemTable";
import { apiFetch } from "../../utils/auth.js";

const DRAFT_STORAGE_KEY = "caritas_autosaved_list";

const getScopedStorageKey = () => {
  const userId = localStorage.getItem("userId") || "anonymous";
  return `${DRAFT_STORAGE_KEY}:${userId}`;
};

export default function ListManager({ searchTerm }) {
  const [fields, setFields] = useState([]);
  const [items, setItems] = useState([]);
  const [lists, setLists] = useState([]);
  const [listTitle, setListTitle] = useState("");
  const [showAddField, setShowAddField] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({});
  const [currentListId, setCurrentListId] = useState(null);
  const [draftKey, setDraftKey] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState("Sin cambios");
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState(null);

  const draftStorageKey = useRef(getScopedStorageKey());
  const saveTimer = useRef(null);
  const isLoadingList = useRef(false);
  const ignoreNextAutoSave = useRef(false);

  useEffect(() => {
    const scopedDraft = localStorage.getItem(draftStorageKey.current);
    const legacyDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    const savedDraft = scopedDraft || legacyDraft;
    let parsed = null;
    if (savedDraft) {
      try {
        parsed = JSON.parse(savedDraft);
        if (!scopedDraft && legacyDraft) {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch (err) {
        console.error("Error al recuperar borrador de lista:", err);
      }
    }

    const loadedDraftKey = parsed?.draftKey || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setDraftKey(loadedDraftKey);

    if (
      parsed &&
      (parsed.title || (Array.isArray(parsed.fields) && parsed.fields.length > 0) ||
        (Array.isArray(parsed.items) && parsed.items.length > 0) ||
        (parsed.newItem && Object.keys(parsed.newItem).length > 0) ||
        parsed.newFieldName ||
        parsed.editingItem)
    ) {
      ignoreNextAutoSave.current = true;
      setFields(parsed.fields || []);
      setItems(parsed.items || []);
      setListTitle(parsed.title || "");
      setCurrentListId(parsed.currentListId || null);
      setNewItem(parsed.newItem || {});
      setNewFieldName(parsed.newFieldName || "");
      setNewFieldType(parsed.newFieldType || "text");
      setEditingItem(parsed.editingItem || null);
      setShowAddField(Boolean(parsed.showAddField));
      setShowEditItem(Boolean(parsed.showEditItem && parsed.editingItem));
      setAutoSaveStatus("Recuperado guardado automático");
    }
  }, []);

  useEffect(() => {
    if (!draftKey) return;
    try {
      localStorage.setItem(
        draftStorageKey.current,
        JSON.stringify({
          title: listTitle,
          fields,
          items,
          currentListId,
          draftKey,
          newItem,
          newFieldName,
          newFieldType,
          editingItem,
          showAddField,
          showEditItem,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch (err) {
      console.error("Error guardando borrador de lista:", err);
    }
  }, [
    fields,
    items,
    listTitle,
    currentListId,
    draftKey,
    newItem,
    newFieldName,
    newFieldType,
    editingItem,
    showAddField,
    showEditItem,
  ]);

  useEffect(() => {
    if (!draftKey) return undefined;

    const saveBeforeLeaving = () => {
      try {
        localStorage.setItem(
          draftStorageKey.current,
          JSON.stringify({
            title: listTitle,
            fields,
            items,
            currentListId,
            draftKey,
            newItem,
            newFieldName,
            newFieldType,
            editingItem,
            showAddField,
            showEditItem,
            updatedAt: new Date().toISOString(),
          }),
        );
      } catch (err) {
        console.error("Error guardando borrador de lista:", err);
      }
    };

    window.addEventListener("pagehide", saveBeforeLeaving);
    return () => {
      saveBeforeLeaving();
      window.removeEventListener("pagehide", saveBeforeLeaving);
    };
  }, [
    fields,
    items,
    listTitle,
    currentListId,
    draftKey,
    newItem,
    newFieldName,
    newFieldType,
    editingItem,
    showAddField,
    showEditItem,
  ]);

  // 🔹 Traer listas desde MongoDB (Netlify Functions)
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await apiFetch(`/.netlify/functions/getLists`, { method: "GET" });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setLists(data);
        } else {
          console.error("Error al cargar listas:", data.error || data);
          setLists([]);
        }
      } catch (err) {
        console.error("Error de conexión:", err);
        setLists([]);
      }
    };

    fetchLists();
  }, []);

  const addField = () => {
    if (newFieldName.trim()) {
      const newField = {
        id: Date.now().toString(),
        name: newFieldName.trim().toLowerCase(),
        type: newFieldType,
      };
      setFields([...fields, newField]);
      setNewFieldName("");
      setShowAddField(false);
    }
  };

  const moveField = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const updatedFields = [...fields];
    const [movedField] = updatedFields.splice(fromIndex, 1);
    updatedFields.splice(toIndex, 0, movedField);
    setFields(updatedFields);
  };

  const removeField = (fieldId) => {
    const fieldToRemove = fields.find((f) => f.id === fieldId);
    if (fieldToRemove) {
      setFields(fields.filter((f) => f.id !== fieldId));
      const updatedItems = items.map((item) => {
        const rest = { ...item };
        delete rest[fieldToRemove.name];
        return rest;
      });
      setItems(updatedItems);
    }
  };

  const saveList = async () => {
    if (!listTitle.trim() && !fields.length && !items.length) {
      alert("Agrega campos o un título antes de guardar.");
      return;
    }

    // Al guardar manualmente permitimos crear la lista en el backend
    await updateList(true, true);
  };

  const deleteList = async (id) => {
    try {
      const res = await apiFetch(`/.netlify/functions/deleteList/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLists(lists.filter((l) => l._id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar la lista");
      }
    } catch (err) {
      console.error("Error al eliminar lista:", err);
    }
  };

  const addItem = () => {
    if (fields.length === 0) {
      alert("Primero debes agregar campos a la lista antes de añadir un item.");
      return;
    }

    const missingFields = fields.filter(
      (f) => !newItem[f.name] || newItem[f.name].toString().trim() === "",
    );

    if (missingFields.length > 0) {
      alert(
        `Completa todos los campos antes de agregar el item. Faltan: ${missingFields
          .map((f) => f.name)
          .join(", ")}`,
      );
      return;
    }

    const item = { id: Date.now().toString(), ...newItem };
    const updatedItems = [...items, item];
    setItems(updatedItems);
    setNewItem({});
  };

  const deleteItem = (id) => {
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);
  };

  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setItems(updatedItems);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setShowEditItem(true);
  };

  const saveEditItem = () => {
    if (editingItem) {
      const updatedItems = items.map((item) =>
        item.id === editingItem.id ? editingItem : item,
      );
      setItems(updatedItems);
      setShowEditItem(false);
      setEditingItem(null);
    }
  };

  const downloadPDF = () => {
    if (!listTitle.trim() && !fields.length && !items.length) {
      alert("No hay datos para descargar.");
      return;
    }

    // Build a clean HTML representation of the list
    const tableRows = items
      .map(
        (item) =>
          `<tr>${fields
            .map((field) => `<td style="border:1px solid #ccc;padding:6px;text-align:left;">${item[field.name] || ""}</td>`)
            .join("")}</tr>`,
      )
      .join("");

    const tableHeader = fields
      .map((field) => `<th style="border:1px solid #ccc;padding:8px;background:#8b5cf6;color:white;text-align:left;">${field.name}</th>`)
      .join("");

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto;">
        <h1 style="color:#8b5cf6;border-bottom:2px solid #8b5cf6;padding-bottom:10px;">${listTitle || "Lista sin nombre"}</h1>
        <table style="border-collapse:collapse;width:100%;margin-top:16px;">
          <thead><tr>${tableHeader}</tr></thead>
          <tbody>${tableRows || '<tr><td colspan="' + fields.length + '" style="padding:12px;text-align:center;color:#888;">Sin elementos</td></tr>'}</tbody>
        </table>
        <p style="margin-top:20px;font-size:12px;color:#888;">Generado el ${new Date().toLocaleString("es-AR")}</p>
      </div>
    `;

    const opt = {
      margin:       0.5,
      filename:     `${listTitle.trim() || "lista"}.pdf`,
      image:        { type: "jpeg", quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(htmlContent).save();
  };

  const filteredItems = items.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  const loadList = async (list) => {
    try {
      isLoadingList.current = true;
      const res = await apiFetch(`/.netlify/functions/getListById/${list._id}`, { method: "GET" });
      const data = await res.json();
      setFields(data.fields || []);
      setItems(data.items || []);
      setListTitle(data.title);
      setCurrentListId(data._id);
      setNewItem({});
      setNewFieldName("");
      setNewFieldType("text");
      setEditingItem(null);
      setShowAddField(false);
      setShowEditItem(false);
      ignoreNextAutoSave.current = true;
      setAutoSaveStatus("Lista cargada");
    } catch (err) {
      console.error("Error al cargar lista:", err);
    } finally {
      setTimeout(() => {
        isLoadingList.current = false;
      }, 0);
    }
  };

  const updateList = useCallback(async (showAlerts = false, allowCreate = true) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    if (!fields.length && !items.length && !listTitle.trim()) {
      setAutoSaveStatus("Sin cambios");
      return null;
    }

    // Si no se permite crear y no existe currentListId, evitamos llamar al backend.
    if (!allowCreate && !currentListId) {
      // Ya se guarda el borrador en localStorage por el efecto; solo actualizamos estado visible
      setAutoSaveStatus(showAlerts ? "Guardado local" : "Guardado automáticamente (borrador)");
      return null;
    }

    try {
      let res;
      if (currentListId) {
        res = await apiFetch(`/.netlify/functions/updateList/${currentListId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: listTitle, fields, items }),
        });
      } else {
        res = await apiFetch(`/.netlify/functions/createList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: listTitle.trim() || "Lista sin nombre",
            fields,
            items,
            draftKey,
          }),
        });
      }

      const data = await res.json();
      if (res.ok) {
        if (currentListId) {
          setLists((prev) => prev.map((l) => (l._id === currentListId ? data : l)));
        } else {
          setLists((prev) => [...prev, data]);
          setCurrentListId(data._id);
        }
        ignoreNextAutoSave.current = true;
        setAutoSaveStatus(showAlerts ? "Lista guardada ✅" : "Guardado automáticamente");

        if (showAlerts) {
          alert("Lista guardada con éxito ✅");
        }

        return data;
      } else if (res.status === 404 && currentListId) {
        // Lista no encontrada en backend: si es autoguardado, no intentamos crearla remotamente;
        // simplemente limpiamos currentListId y mantenemos el borrador local.
        if (!allowCreate) {
          setCurrentListId(null);
          setAutoSaveStatus(showAlerts ? "Guardado local" : "Guardado automáticamente (borrador)");
          return null;
        }

        // Si permitimos crear (guardado manual), intentamos crear la lista en su lugar.
        try {
          const createRes = await apiFetch(`/.netlify/functions/createList`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: listTitle.trim() || "Lista sin nombre", fields, items, draftKey }),
          });
          const createData = await createRes.json();
          if (createRes.ok) {
            setLists((prev) => [...prev, createData]);
            setCurrentListId(createData._id);
            ignoreNextAutoSave.current = true;
            setAutoSaveStatus(showAlerts ? "Lista guardada ✅" : "Guardado automáticamente");
            if (showAlerts) alert("Lista guardada con éxito ✅");
            return createData;
          } else {
            if (showAlerts) alert(createData.error || "Error al guardar la lista");
            setAutoSaveStatus("Error al guardar");
            return null;
          }
        } catch (err2) {
          console.error("Error creando lista tras 404:", err2);
          setAutoSaveStatus("Error al guardar");
          if (showAlerts) alert("Error al guardar la lista");
          return null;
        }
      } else {
        if (showAlerts) {
          alert(data.error || "Error al guardar la lista");
        }
        setAutoSaveStatus("Error al guardar");
        return null;
      }
    } catch (err) {
      console.error("Error al actualizar lista:", err);
      setAutoSaveStatus("Error al guardar");
      return null;
    }
  }, [currentListId, draftKey, fields, items, listTitle]);

  useEffect(() => {
    if (ignoreNextAutoSave.current) {
      ignoreNextAutoSave.current = false;
      return;
    }

    if (isLoadingList.current) return;
    if (!fields.length && !items.length && !listTitle.trim()) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      setAutoSaveStatus("Guardando...");
      // En autoguardado no crear nuevas listas en el backend: solo actualizar si ya existe
      updateList(false, false);
    }, 900);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [fields, items, listTitle, currentListId, draftKey, updateList]);

  return (
    <Container fluid className="py-4">
      <Card
        className="shadow-sm border-0"
        style={{ backgroundColor: "#15e0e7" }}
      >
        <Card.Header
          style={{ backgroundColor: "#8b5cf6" }}
          className="text-white"
        >
          <h4 className="mb-0">📋 Gestor de Listas</h4>
        </Card.Header>
        <Card.Body>
          {/* Campos */}
          <Row className="mb-4">
            <Col>
              <h5>Campos de la Lista</h5>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {fields.map((field, index) => (
                  <FieldBadge
                    key={field.id}
                    field={field}
                    index={index}
                    moveField={moveField}
                    dragOverIndex={dragOverFieldIndex}
                    setDragOverIndex={setDragOverFieldIndex}
                    removeField={removeField}
                  />
                ))}
                <Button
                  className="list-button fw-semibold"
                  style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" }}
                  size="sm"
                  onClick={() => setShowAddField(true)}
                >
                  <Plus size={16} className="me-1" /> Agregar Campo
                </Button>
              </div>
            </Col>
          </Row>

          {/* Formulario Items */}
          <ItemForm
            fields={fields}
            newItem={newItem}
            setNewItem={setNewItem}
            addItem={addItem}
          />

          {/* Tabla Items */}
          <div
            style={{
              height: "300px",
              overflowY: filteredItems.length > 0 ? "scroll" : "visible",
              border: filteredItems.length > 0 ? "1px solid #ccc" : "none",
              padding: filteredItems.length > 0 ? "10px" : "0",
              position: "relative",
              zIndex: 1,
            }}
          >
            <ItemTable
              fields={fields}
              items={items}
              openEditItem={openEditItem}
              deleteItem={deleteItem}
              moveItem={moveItem}
            />
          </div>

          {/* Nombre de la lista */}
          <Row className="mb-3">
            <Col>
              <label>Nombre de la Lista:</label>
              <input
                type="text"
                className="form-control"
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                placeholder="Ej: Lista de ropa"
              />
            </Col>
          </Row>

          {/* Guardar lista y Descargar lista */}
          <div className="d-flex gap-2 align-items-start mt-3">
            <Button
              className="list-button fw-semibold"
              style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              onClick={saveList}
            >
              Guardar Lista
            </Button>
            <Button
              className="list-button fw-semibold"
              style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" }}
              onClick={downloadPDF}
            >
              Descargar Lista
            </Button>
            <div className="text-muted small align-self-center">{autoSaveStatus}</div>
          </div>
        </Card.Body>
      </Card>

      {/* Mostrar listas guardadas */}
      <Card className="mt-4">
        <Card.Header>Listas Guardadas</Card.Header>
        <Card.Body>
          {Array.isArray(lists) ? (
            lists.map((list) => (
              <div
                key={list._id}
                className="d-flex justify-content-between align-items-center mb-2"
              >
                <span
                  style={{ cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => loadList(list)} // 🔹 carga la lista al hacer click
                >
                  {list.title}
                </span>
                <Button
                  className="list-button fw-semibold"
                  size="sm"
                  style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
                  onClick={() => deleteList(list._id)}
                >
                  Eliminar
                </Button>
              </div>
            ))
          ) : (
            <p>No hay listas disponibles</p>
          )}
        </Card.Body>
      </Card>

      {/* Modales */}
      <AddFieldModal
        show={showAddField}
        setShow={setShowAddField}
        newFieldName={newFieldName}
        setNewFieldName={setNewFieldName}
        newFieldType={newFieldType}
        setNewFieldType={setNewFieldType}
        addField={addField}
      />
      <EditItemModal
        show={showEditItem}
        setShow={setShowEditItem}
        fields={fields}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        saveEditItem={saveEditItem}
      />
    </Container>
  );
}
