import { Table, Button } from 'react-bootstrap';
import { Edit2, Trash2 } from 'lucide-react';

export default function ItemTable({ fields, items, openEditItem, deleteItem }) {
  return (
    <div>
      <h5>Items de la Lista</h5>
      {items.length === 0 ? (
        <p className="text-muted">No hay items en la lista. Agrega uno arriba.</p>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-light">
              <tr>
                {fields.map(field => (
                  <th key={field.id} className="text-capitalize">{field.name}</th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  {fields.map(field => (
                    <td key={field.id}>{item[field.name] || '-'}</td>
                  ))}
                  <td>
                    <Button
                      size="sm"
                      className="me-2"
                      style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                      onClick={() => openEditItem(item)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
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
