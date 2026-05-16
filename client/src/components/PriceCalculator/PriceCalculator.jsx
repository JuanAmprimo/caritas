import { useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import DonationForm from './DonationForm';
import DonationTable from './DonationTable';

export default function PriceCalculator() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    quantity: 1,
    description: '',
    image: '',
    size: '',
  });
  const [editingId, setEditingId] = useState(null);

  const handleInputChange = (field, value) => setFormData({ ...formData, [field]: value });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const addOrUpdateProduct = () => {
    if (!formData.name || !formData.price) {
      alert('Por favor completa el nombre y precio del producto');
      return;
    }
    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? { ...p, ...formData } : p));
      setEditingId(null);
    } else {
      const newProduct = { id: Date.now().toString(), ...formData };
      setProducts([...products, newProduct]);
    }
    setFormData({ name: '', price: 0, stock: 0, quantity: 1, description: '', image: '' });
  };

  const editProduct = (product) => { setFormData(product); setEditingId(product.id); };
  const deleteProduct = (id) => setProducts(products.filter(p => p.id !== id));
  const updateQuantity = (id, quantity) => {
    if (quantity < 0) return;
    setProducts(products.map(p => p.id === id ? { ...p, quantity: Math.min(quantity, p.stock) } : p));
  };

  const calculateTotal = () => products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const calculateSubtotal = (p) => p.price * p.quantity;
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', price: 0, stock: 0, quantity: 1, description: '', image: '' });
  };

  return (
    <Container fluid className="py-4">
      {/* Formulario */}
      <Card className="shadow-sm mb-4 border-0">
        <Card.Header style={{ backgroundColor: '#10b981' }} className="text-white">
          <h4 className="mb-0">💰 Calculadora de Precios de Donaciones</h4>
        </Card.Header>
        <Card.Body>
          <h5>{editingId ? 'Modificar Donación' : 'Nueva Donación'}</h5>
          <DonationForm 
            formData={formData}
            handleInputChange={handleInputChange}
            handleImageUpload={handleImageUpload}
            addOrUpdateProduct={addOrUpdateProduct}
            cancelEdit={cancelEdit}
            editingId={editingId}
          />
        </Card.Body>
      </Card>

      {/* Tabla */}
      <Card className="shadow-sm border-0">
        <Card.Header style={{ backgroundColor: '#6366f1' }} className="text-white">
          <h4 className="mb-0">🛒 Lista de Productos y Cálculo Final</h4>
        </Card.Header>
          <Card.Body>
            {products.length === 0 ? (
              <p className="text-muted">No hay productos agregados. Agrega uno arriba para comenzar.</p>
            ) : (
              <div
                style={{
                  maxHeight: products.length > 3 ? "300px" : "none",
                  overflowY: products.length > 3 ? "auto" : "visible",
                  border: products.length > 3 ? "1px solid #ccc" : "none",
                  padding: products.length > 3 ? "10px" : "0",
                }}
              >
                <DonationTable
                  products={products}
                  updateQuantity={updateQuantity}
                  calculateSubtotal={calculateSubtotal}
                  calculateTotal={calculateTotal}
                  editProduct={editProduct}
                  deleteProduct={deleteProduct}
                />
            </div>
          )}
        </Card.Body>

      </Card>
    </Container>
  );
}
