import { useState } from 'react';
import { Container, Card, Form } from 'react-bootstrap';
import DonationForm from './DonationForm';
import DonationTable from './DonationTable';

export default function PriceCalculator() {
  const [donations, setDonations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    quantity: 1,
    description: '',
    image: '',
    size: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (field, value) => setFormData({ ...formData, [field]: value });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const addOrUpdateDonation = () => {
    if (!formData.name || !formData.price) {
      alert('Por favor completa el nombre y precio de la donación');
      return;
    }
    if (editingId) {
      setDonations(donations.map(d => d.id === editingId ? { ...d, ...formData } : d));
      setEditingId(null);
    } else {
      const newDonation = { id: Date.now().toString(), ...formData };
      setDonations([...donations, newDonation]);
    }
    setFormData({ name: '', price: 0, quantity: 1, description: '', image: '', size: '' });
  };

  const editDonation = (donation) => { setFormData(donation); setEditingId(donation.id); };
  const deleteDonation = (id) => setDonations(donations.filter(d => d.id !== id));
  const updateQuantity = (id, quantity) => {
    if (quantity < 0) return;
    setDonations(donations.map(d => d.id === id ? { ...d, quantity } : d));
  };

  const calculateTotal = () => donations.reduce((sum, d) => sum + (d.price * d.quantity), 0);
  const calculateSubtotal = (d) => d.price * d.quantity;
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', price: 0, quantity: 1, description: '', image: '', size: '' });
  };

  // 🔹 Buscador con resaltado amarillo y animación
  const handleSearch = (e) => {
    e.preventDefault();
    const found = document.querySelectorAll(
      `[data-name*="${searchTerm.toLowerCase()}"]`
    );
    found.forEach(el => {
      el.classList.add("highlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.classList.remove("highlight"), 2000);
    });
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
            addOrUpdateDonation={addOrUpdateDonation}
            cancelEdit={cancelEdit}
            editingId={editingId}
          />
        </Card.Body>
      </Card>

      {/* Tabla + Buscador */}
      <Card className="shadow-sm border-0">
        <Card.Header style={{ backgroundColor: '#6366f1' }} className="text-white">
          <h4 className="mb-0">🛒 Lista de Donaciones y Cálculo Final</h4>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch} className="mb-3">
            <Form.Control
              type="text"
              placeholder="Buscar donación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form>

          {donations.length === 0 ? (
            <p className="text-muted">No hay donaciones agregadas. Agrega una arriba para comenzar.</p>
          ) : (
            <div
              style={{
                maxHeight: donations.length > 3 ? "300px" : "none",
                overflowY: donations.length > 3 ? "auto" : "visible",
                border: donations.length > 3 ? "1px solid #ccc" : "none",
                padding: donations.length > 3 ? "10px" : "0",
              }}
            >
              <DonationTable
                donations={donations}
                updateQuantity={updateQuantity}
                calculateSubtotal={calculateSubtotal}
                calculateTotal={calculateTotal}
                editDonation={editDonation}
                deleteDonation={deleteDonation}
              />
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
