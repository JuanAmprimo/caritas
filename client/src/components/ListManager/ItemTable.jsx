import { Table, Button } from 'react-bootstrap';
import { Edit2, Trash2 } from 'lucide-react';
import  '/src/ItemTable.css';

import { useState } from 'react';
import { Table, Button } from 'react-bootstrap';
import { Edit2, Trash2 } from 'lucide-react';
import  '/src/ItemTable.css';

export default function ItemTable({ fields, items, openEditItem, deleteItem, moveItem }) {
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (event, index) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (event, index) => {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData('text/plain'));
    setDragOverIndex(null);
    if (!Number.isNaN(fromIndex)) {
      moveItem(fromIndex, index);
    }
  };

  return (
    <div>
      <h5 className="mb-3 text-primary fw-bold">📋 Items de la Lista</h5>

      {items.length === 0 ? (
        <p className="text-muted fst-italic">No hay items en la lista. Agrega uno arriba.</p>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover responsive className="custom-table align-middle text-center">
            <thead className="table-header">
              <tr>
                {fields.map(field => (
                  <th key={field.id} className="text-capitalize">{field.name}</th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  data-name={Object.values(item).join(" ").toLowerCase()}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={dragOverIndex === index ? 'drag-over-row' : ''}
                >
                  {fields.map(field => (
                    <td key={field.id}>{item[field.name] || '-'}</td>
                  ))}
                  <td>
                    <Button
                      size="sm"
                      className="me-2 btn-edit"
                      onClick={() => openEditItem(item)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      className="btn-delete"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
