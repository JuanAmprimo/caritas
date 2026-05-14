import { Table, Form, Button } from 'react-bootstrap';
import { Edit2, Trash2, Image as ImageIcon } from 'lucide-react';

export default function ProductTable({ products, updateQuantity, calculateSubtotal, calculateTotal, editProduct, deleteProduct }) {
  return (
    <div className="table-responsive">
      <Table striped bordered hover>
        <thead className="table-light">
          <tr>
            <th>Imagen</th>
            <th>Producto</th>
            <th>Descripción</th>
            <th>Precio Unit.</th>
            <th>Stock</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td style={{ width: '80px' }}>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                    className="rounded"
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center bg-light rounded"
                    style={{ width: '60px', height: '60px' }}
                  >
                    <ImageIcon size={24} className="text-muted" />
                  </div>
                )}
              </td>
              <td>{product.name}</td>
              <td>{product.description || '-'}</td>
              <td>${product.price.toFixed(2)}</td>
              <td>{product.stock}</td>
              <td style={{ width: '120px' }}>
                <Form.Control
                  type="number"
                  size="sm"
                  value={product.quantity}
                  onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                  min="0"
                  max={product.stock}
                />
              </td>
              <td className="fw-bold">${calculateSubtotal(product).toFixed(2)}</td>
              <td style={{ width: '120px' }}>
                <Button
                  size="sm"
                  className="me-1"
                  style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                  onClick={() => editProduct(product)}
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  size="sm"
                  style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                  onClick={() => deleteProduct(product.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#d1fae5' }}>
            <td colSpan={6} className="text-end fw-bold fs-5">TOTAL:</td>
            <td className="fw-bold fs-5" colSpan={2} style={{ color: '#10b981' }}>
              ${calculateTotal().toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </Table>
    </div>
  );
}
