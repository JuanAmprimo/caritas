import { useState } from 'react';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import { Plus } from 'lucide-react';
import FieldBadge from './FieldBadge';
import AddFieldModal from './AddFieldModal';
import EditItemModal from './EditItemModal';
import ItemForm from './ItemForm';
import ItemTable from './ItemTable';

export default function ListManager({ searchTerm }) {
  const [fields, setFields] = useState([
    { id: '1', name: 'nombre', type: 'text' },
    { id: '2', name: 'cantidad', type: 'number' },
  ]);
  const [items, setItems] = useState([]);
  const [showAddField, setShowAddField] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({});

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

  const addItem = () => {
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

  // 🔹 Filtrar items según el searchTerm
  const filteredItems = items.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm border-0">
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

          {/* Tabla Items filtrados */}
          <ItemTable
            fields={fields}
            items={filteredItems}
            openEditItem={openEditItem}
            deleteItem={deleteItem}
          />
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
