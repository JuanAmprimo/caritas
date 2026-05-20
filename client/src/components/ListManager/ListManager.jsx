import { useState, useEffect, useRef } from "react";
import { Container, Card, Row, Col, Button } from "react-bootstrap";
import { Plus } from "lucide-react";
import FieldBadge from "./FieldBadge";
import AddFieldModal from "./AddFieldModal";
import EditItemModal from "./EditItemModal";
import ItemForm from "./ItemForm";
import ItemTable from "./ItemTable";
import { apiFetch } from "../../utils/auth.js";

const DRAFT_STORAGE_KEY = "caritas_autosaved_list";

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

  const saveTimer = useRef(null);
  const isLoadingList = useRef(false);
  const ignoreNextAutoSave = useRef(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    let parsed = null;
    if (savedDraft) {
      try {
        parsed = JSON.parse(savedDraft);
      } catch (err) {
        console.error("Error al recuperar borrador de lista:", err);
      }
    }

    const loadedDraftKey = parsed?.draftKey || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setDraftKey(loadedDraftKey);

    if (
      parsed &&
      (parsed.title || (Array.isArray(parsed.fields) && parsed.fields.length > 0) ||
        (Array.isArray(parsed.items) && parsed.items.length > 0))
    ) {
      ignoreNextAutoSave.current = true;
      setFields(parsed.fields || []);
      setItems(parsed.items || []);
      setListTitle(parsed.title || "");
      setCurrentListId(parsed.currentListId || null);
      setAutoSaveStatus("Recuperado guardado automático");
    }
  }, []);

  useEffect(() => {
    if (!draftKey) return;
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ title: listTitle, fields, items, currentListId, draftKey }),
    );
  }, [fields, items, listTitle, currentListId, draftKey]);

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

    setAutoSaveStatus("Guardando...");
    saveTimer.current = setTimeout(() => {
      updateList(false);
    }, 900);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [fields, items, listTitle, draftKey]);

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
        const { [fieldToRemove.name]: _, ...rest } = item;
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

    await updateList(true);
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

  const updateList = async (showAlerts = false) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    if (!fields.length && !items.length && !listTitle.trim()) {
      setAutoSaveStatus("Sin cambios");
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
  };

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

          {/* Guardar lista */}
          <Button
            className="list-button fw-semibold mt-3"
            style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
            onClick={saveList}
          >
            Guardar Lista
          </Button>
          <div className="mt-2 text-muted small">{autoSaveStatus}</div>
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
