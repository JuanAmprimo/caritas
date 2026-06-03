import { Container, Card, Row, Col, Button, Spinner } from "react-bootstrap";
import { History, Plus } from "lucide-react";
import FieldBadge from "./FieldBadge";
import AddFieldModal from "./AddFieldModal";
import EditItemModal from "./EditItemModal";
import ItemForm from "./ItemForm";
import ItemTable from "./ItemTable";
import VersionHistoryModal from "./VersionHistoryModal";
import { apiFetch } from "../../utils/auth.js";
import { useState, useEffect, useRef } from "react";   // ✅ Importar hooks
import { jsPDF } from "jspdf";       

const DRAFT_STORAGE_KEY = "caritas_autosaved_list";

const createDraftKey = () => `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getScopedStorageKey = () => {
  const userId = localStorage.getItem("userId") || "anonymous";
  return `${DRAFT_STORAGE_KEY}:${userId}`;
};

const normalizeLoadedItems = (loadedItems, listId) => {
  if (!Array.isArray(loadedItems)) return [];

  return loadedItems.map((item, index) => {
    const normalizedItem = item && typeof item === "object" ? item : { value: item };
    return {
      ...normalizedItem,
      id: normalizedItem.id || `${listId || "loaded"}_${index}`,
    };
  });
};

const getCurrentFields = (list) => {
  if (Array.isArray(list?.currentFields) && (list.currentFields.length > 0 || !Array.isArray(list?.fields))) {
    return list.currentFields;
  }
  return Array.isArray(list?.fields) ? list.fields : [];
};

const getCurrentItems = (list) => {
  if (Array.isArray(list?.currentItems) && (list.currentItems.length > 0 || !Array.isArray(list?.items))) {
    return list.currentItems;
  }
  return Array.isArray(list?.items) ? list.items : [];
};

const getVersionHistory = (list) => (
  Array.isArray(list?.versionHistory) ? list.versionHistory : []
);

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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isSavingList, setIsSavingList] = useState(false);
  const [isLoadingListData, setIsLoadingListData] = useState(false);
  const [deletingListId, setDeletingListId] = useState(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const draftStorageKey = useRef(getScopedStorageKey());
  const listsRef = useRef([]);
  const saveTimer = useRef(null);
  const isLoadingList = useRef(false);
  const ignoreNextAutoSave = useRef(false);

  const syncSavedList = (savedList) => {
    if (!savedList || savedList.isAutosaved) return;

    const nextLists = listsRef.current.some((list) => list._id === savedList._id)
      ? listsRef.current.map((list) => (list._id === savedList._id ? savedList : list))
      : [...listsRef.current, savedList];

    listsRef.current = nextLists;
    setLists(nextLists);
  };

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

    const loadedDraftKey = parsed?.draftKey || createDraftKey();
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
      setFields(parsed.currentFields || parsed.fields || []);
      setItems(normalizeLoadedItems(parsed.currentItems || parsed.items || [], parsed.currentListId || loadedDraftKey));
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

  // Autoguardado en localStorage
  useEffect(() => {
    if (!draftKey) return;
    try {
      localStorage.setItem(
        draftStorageKey.current,
        JSON.stringify({
          title: listTitle,
          fields,
          items,
          currentFields: fields,
          currentItems: items,
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
            currentFields: fields,
            currentItems: items,
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

  useEffect(() => {
    if (!currentListId || !draftKey) return undefined;
    if (isLoadingList.current) return undefined;

    if (ignoreNextAutoSave.current) {
      ignoreNextAutoSave.current = false;
      return undefined;
    }

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    setAutoSaveStatus("Guardando cambios actuales...");

    saveTimer.current = setTimeout(async () => {
      try {
        const res = await apiFetch(`/.netlify/functions/updateList/${currentListId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: listTitle,
            fields,
            items,
            currentOnly: true,
            createSnapshot: false,
            isAutosaved: false,
          }),
        });
        const data = await res.json();

        if (res.ok) {
          syncSavedList(data);
          setAutoSaveStatus("Cambios actuales guardados");
        } else {
          console.error("Error en autoguardado de lista:", data.error);
          setAutoSaveStatus("Error en autoguardado");
        }
      } catch (err) {
        console.error("Error en autoguardado de lista:", err);
        setAutoSaveStatus("Error en autoguardado");
      } finally {
        saveTimer.current = null;
      }
    }, 900);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [currentListId, draftKey, fields, items, listTitle]);

  // Traer todas las listas desde MongoDB (usando ref para evitar stale closures)

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await apiFetch(`/.netlify/functions/getLists`, { method: "GET" });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          const saved = data.filter((l) => !l.isAutosaved);
          setLists(saved);
          listsRef.current = saved;
        } else {
          setLists([]);
          listsRef.current = [];
        }
      } catch (err) {
        console.error("Error de conexión:", err);
        setLists([]);
        listsRef.current = [];
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

  // ═══════════════════════════════════════════════════════
  // Botón Guardar Lista
  // ═══════════════════════════════════════════════════════
  const saveList = async () => {
    if (!listTitle.trim() && !fields.length && !items.length) {
      alert("Agrega campos o un título antes de guardar.");
      return;
    }

    setIsSavingList(true);
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const trimmedTitle = listTitle.trim();

    const currentList = currentListId
      ? listsRef.current.find((l) => l._id === currentListId)
      : null;
    const existingList = currentList || listsRef.current.find(
      (l) => l.title.toLowerCase() === trimmedTitle.toLowerCase()
    );

    try {
      if (existingList) {
        const res = await apiFetch(`/.netlify/functions/updateList/${existingList._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, fields, items, createSnapshot: true, isAutosaved: false }),
        });
        const data = await res.json();
        if (res.ok) {
          ignoreNextAutoSave.current = true;
          syncSavedList(data);
          setCurrentListId(data._id);
          setAutoSaveStatus("Lista guardada ✅");
          alert("Lista guardada con éxito ✅");
        } else {
          alert(data.error || "Error al guardar la lista");
        }
      } else {
        const res = await apiFetch(`/.netlify/functions/createList`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, fields, items, createSnapshot: true, isAutosaved: false }),
        });
        const data = await res.json();
        if (res.ok) {
          ignoreNextAutoSave.current = true;
          syncSavedList(data);
          setCurrentListId(data._id);
          setDraftKey(createDraftKey());
          setAutoSaveStatus("Lista guardada ✅");
          alert("Lista guardada con éxito ✅");
        } else {
          alert(data.error || "Error al guardar la lista");
        }
      }
    } finally {
      setIsSavingList(false);
    }
  };

  const deleteList = async (id) => {
    setDeletingListId(id);
    try {
      const res = await apiFetch(`/.netlify/functions/deleteList/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const nextLists = listsRef.current.filter((l) => l._id !== id);
        setLists(nextLists);
        listsRef.current = nextLists;
        if (currentListId === id) {
          setCurrentListId(null);
          setDraftKey(createDraftKey());
        }
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar la lista");
      }
    } catch (err) {
      console.error("Error al eliminar lista:", err);
    } finally {
      setDeletingListId(null);
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

  const startNewList = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setItems([]);
    setListTitle("");
    setCurrentListId(null);
    setDraftKey(createDraftKey());
    setNewItem({});
    setNewFieldName("");
    setNewFieldType("text");
    setEditingItem(null);
    setShowAddField(false);
    setShowEditItem(false);
    setAutoSaveStatus("Nueva lista");
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

    setIsDownloadingPDF(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

    doc.setFontSize(18);
    doc.setTextColor(139, 92, 246);
    doc.text(listTitle || "Lista sin nombre", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    if (fields.length > 0) {
      const colWidth = (pageWidth - 2 * margin) / fields.length;
      const rowHeight = 8;

      doc.setFillColor(139, 92, 246);
      doc.rect(margin, y - 4, pageWidth - 2 * margin, rowHeight, "F");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      fields.forEach((field, i) => {
        doc.text(field.name, margin + colWidth * i + 2, y + 2);
      });
      y += rowHeight;

      doc.setTextColor(0, 0, 0);
      if (items.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(136, 136, 136);
        doc.text("Sin elementos", pageWidth / 2, y + 5, { align: "center" });
        y += rowHeight;
      } else {
        items.forEach((item) => {
          if (y + rowHeight > 290) {
            doc.addPage();
            y = margin;
          }
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y - 4, pageWidth - 2 * margin, rowHeight, "F");
          doc.setDrawColor(200, 200, 200);
          fields.forEach((field, i) => {
            doc.rect(margin + colWidth * i, y - 4, colWidth, rowHeight, "S");
          });
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          fields.forEach((field, i) => {
            const val = item[field.name] || "";
            doc.text(String(val), margin + colWidth * i + 2, y + 2);
          });
          y += rowHeight;
        });
      }
    } else {
      doc.setFontSize(10);
      doc.setTextColor(136, 136, 136);
      doc.text("No se definieron campos para esta lista", pageWidth / 2, y + 5, { align: "center" });
    }

    y = Math.max(y + 10, 280);
    doc.setFontSize(8);
    doc.setTextColor(136, 136, 136);
    doc.text(`Generado el ${new Date().toLocaleString("es-AR")}`, pageWidth / 2, y, { align: "center" });
    doc.save(`${listTitle.trim() || "lista"}.pdf`);
  } finally {
      setIsDownloadingPDF(false);
    }
  };

  const filteredItems = items.filter((item) =>
    Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  // ═══════════════════════════════════════════════════════
  // Cargar lista: carga campos, items y titulo
  // ═══════════════════════════════════════════════════════
  const currentList = currentListId
    ? lists.find((list) => list._id === currentListId)
    : null;
  const currentVersionHistory = getVersionHistory(currentList);

  const deleteVersion = async (version) => {
    if (!currentListId) return;
    if (!window.confirm("¿Eliminar esta versión del historial?")) return;

    const versionId = version._id || version.savedAt;
    try {
      const res = await apiFetch(`/.netlify/functions/deleteVersion/${currentListId}/${versionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        syncSavedList(data);
      } else {
        alert(data.error || "Error al eliminar la versión");
      }
    } catch (err) {
      console.error("Error al eliminar versión:", err);
    }
  };

  const restoreVersion = (version) => {
    if (!version) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const versionKey = version._id || version.savedAt || "version";
    setFields(Array.isArray(version.fields) ? version.fields : []);
    setItems(normalizeLoadedItems(version.items || [], `${currentListId || "restored"}_${versionKey}`));
    setListTitle(version.title || listTitle);
    setNewItem({});
    setNewFieldName("");
    setNewFieldType("text");
    setEditingItem(null);
    setShowAddField(false);
    setShowEditItem(false);
    setShowVersionHistory(false);
    setAutoSaveStatus("Version cargada");
  };

  const loadListData = async (list) => {
    setIsLoadingListData(true);
    try {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      isLoadingList.current = true;
      const res = await apiFetch(`/.netlify/functions/getListById/${list._id}`, { method: "GET" });
      const data = await res.json();
      if (!res.ok) {
        console.error("Error al cargar lista:", data.error);
        return;
      }
      syncSavedList(data);
      setFields(getCurrentFields(data));
      setItems(normalizeLoadedItems(getCurrentItems(data), data._id));
      setListTitle(data.title || list.title || "");
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
        setIsLoadingListData(false);
      }, 0);
    }
  };


  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm border-0" style={{ backgroundColor: "#15e0e7" }}>
        <Card.Header style={{ backgroundColor: "#8b5cf6" }} className="text-white">
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
          <Row className="mb-3 mt-3">
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

          {/* Botones */}
          <div className="d-flex gap-2 align-items-start mt-3">
            <Button
              className="list-button fw-semibold"
              style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              onClick={saveList}
              disabled={isSavingList || isLoadingListData}
            >
              {isSavingList ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Guardando...
                </>
              ) : (
                "Guardar Lista"
              )}
            </Button>
            <Button
              className="list-button fw-semibold"
              variant="outline-secondary"
              onClick={startNewList}
              disabled={isSavingList || isLoadingListData}
            >
              <Plus size={16} className="me-1" /> Nueva Lista
            </Button>
            <Button
              className="list-button fw-semibold"
              variant="outline-dark"
              disabled={!currentListId || isLoadingListData || isSavingList}
              onClick={() => setShowVersionHistory(true)}
            >
              <History size={16} className="me-1" /> Historial
            </Button>
            <Button
              className="list-button fw-semibold"
              style={{ backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" }}
              onClick={downloadPDF}
              disabled={isDownloadingPDF || isSavingList || isLoadingListData}
            >
              {isDownloadingPDF ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generando...
                </>
              ) : (
                "Descargar Lista"
              )}
            </Button>
            <div className="text-muted small align-self-center">{autoSaveStatus}</div>
          </div>

          {/* Listas Guardadas */}
          <hr className="my-4" />
          <h5 className="mb-3">📁 Listas Guardadas</h5>
          {lists.length === 0 ? (
            <p className="text-muted small">No hay listas guardadas.</p>
          ) : (
            lists.map((list) => (
              <div
                key={list._id}
                className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                style={{
                  cursor: isLoadingListData ? "wait" : "pointer",
                  backgroundColor: "rgba(255,255,255,0.7)",
                }}
                onClick={() => {
                  if (!isLoadingListData) {
                    loadListData(list);
                  }
                }}
              >
                <span className="fw-bold small">{list.title}</span>
                <Button
                  size="sm"
                  variant="outline-danger"
                  style={{ padding: "0 6px", fontSize: "12px" }}
                  disabled={deletingListId === list._id || isSavingList || isLoadingListData}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteList(list._id);
                  }}
                >
                  {deletingListId === list._id ? "..." : "×"}
                </Button>
              </div>
            ))
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
      <VersionHistoryModal
        show={showVersionHistory}
        onHide={() => setShowVersionHistory(false)}
        versions={currentVersionHistory}
        onRestore={restoreVersion}
        onDelete={deleteVersion}
      />
    </Container>
  );
}
