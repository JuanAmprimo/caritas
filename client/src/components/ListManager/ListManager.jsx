import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import { Plus } from 'lucide-react';
import FieldBadge from './FieldBadge';
import AddFieldModal from './AddFieldModal';
import EditItemModal from './EditItemModal';
import ItemForm from './ItemForm';
import ItemTable from './ItemTable';

export default function ListManager({ searchTerm }) {
  const [fields, setFields] = useState([]);
  const [items, setItems] = useState([]);
  const [lists, setLists] = useState([]);
  const [listTitle, setListTitle] = useState(''); // 🔹 nombre de la lista
  const [showAddField, setShowAddField] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({});

  // 🔹 Traer listas desde MongoDB
  useEffect(() => {
    fetch("http://localhost:3001/api/lists?userId=12345")
      .then(res => res.json())
      .then(data => setLists(data))
      .catch(err => console.error("Error al traer listas:", err));
  }, []);

  const addField = () => {
    if (newFieldName.trim()) {
      const newField = {
        id: Date.now().toString(),
        name: newFieldName.trim().toLowerCase(),
        type: newFieldType,
      };
      setFields([...fields, newField]);
      setNewFieldName('');
      setShowAddField(false);
    }
  };

  const removeField = (fieldId) => {
    const fieldToRemove = fields.find(f => f.id === fieldId);
    if (fieldToRemove) {
      setFields(fields.filter(f => f.id !== fieldId));
      const updatedItems = items.map(item => {
        const { [fieldToRemove.name]: _, ...rest } = item;
        return rest;
      });
      setItems(updatedItems);
    }
  };

  // 🔹 Guardar lista en MongoDB con nombre
    const saveList = async () => {
      if (!listTitle.trim()) {
        alert("Debes poner un nombre a la lista antes de guardarla.");
        return;
      }

      try {
        const res = await fetch("http://localhost:3001/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: listTitle, userId: "12345", fields, items })
        });
        const data = await res.json();
        console.log("Respuesta del backend:", data);
        setLists([...lists, data]);
        // ❌ no borres items, fields ni title
      } catch (err) {
        console.error("Error al guardar lista:", err);
      }
    };



  const deleteList = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/lists/${id}`, { method: "DELETE" });
      setLists(lists.filter(l => l._id !== id));
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
      f => !newItem[f.name] || newItem[f.name].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      alert(`Completa todos los campos antes de agregar el item. Faltan: ${missingFields.map(f => f.name).join(", ")}`);
      return;
    }

    const item = { id: Date.now().toString(), ...newItem };
    setItems([...items, item]);
    setNewItem({});
  };

  const deleteItem = (id) => setItems(items.filter(item => item.id !== id));
  const openEditItem = (item) => { setEditingItem(item); setShowEditItem(true); };
  const saveEditItem = () => {
    if (editingItem) {
      setItems(items.map(item => item.id === editingItem.id ? editingItem : item));
      setShowEditItem(false);
      setEditingItem(null);
    }
  };

  const filteredItems = items.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

 const loadList = (list) => {
  setFields(list.fields || []);   // 🔹 usar los campos guardados
  setItems(list.items || []);     // 🔹 usar los ítems guardados
  setListTitle(list.title);       // 🔹 mostrar el nombre
};




  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm border-0" style={{ backgroundColor: '#15e0e7' }}>
        <Card.Header style={{ backgroundColor: '#8b5cf6' }} className="text-white">
          <h4 className="mb-0">📋 Gestor de Listas</h4>
        </Card.Header>
        <Card.Body>
          {/* Campos */}
          <Row className="mb-4">
            <Col>
              <h5>Campos de la Lista</h5>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {fields.map(field => (
                  <FieldBadge key={field.id} field={field} removeField={removeField} />
                ))}
                <Button
                  style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
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
              height:"150px",
              overflowY: filteredItems.length > 0 ? "scroll" : "visible",
              border: filteredItems.length > 0 ? "1px solid #ccc" : "none",
              padding: filteredItems.length > 0 ? "10px" : "0",
            }}
          >
            <ItemTable
              fields={fields}
              items={items}
              openEditItem={openEditItem}
              deleteItem={deleteItem}
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
            style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
            className="mt-3"
            onClick={saveList}
          >
            Guardar Lista
          </Button>
        </Card.Body>
      </Card>

      {/* Mostrar listas guardadas */}
      <Card className="mt-4">
        <Card.Header>Listas Guardadas</Card.Header>
        <Card.Body>
          {lists.map(list => (
            <div key={list._id} className="d-flex justify-content-between align-items-center mb-2">
              <span
                style={{ cursor: "pointer", fontWeight: "bold" }}
                onClick={() => loadList(list)} // 🔹 carga la lista al hacer click
              >
                {list.title}
              </span>
              <Button
                size="sm"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => deleteList(list._id)}
              >
                Eliminar
              </Button>
            </div>
          ))}
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
