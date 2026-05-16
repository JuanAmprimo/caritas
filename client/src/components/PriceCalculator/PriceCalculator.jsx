import { useState, useEffect } from 'react';
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

  // 🔹 Traer donaciones del backend al cargar
  useEffect(() => {
    fetch("http://localhost:3001/api/donations?userId=12345")
      .then(res => res.json())
      .then(data => setDonations(data))
      .catch(err => console.error("Error al traer donaciones:", err));
  }, []);

  const handleInputChange = (field, value) => setFormData({ ...formData, [field]: value });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // 🔹 Crear o actualizar donación en backend
  const addOrUpdateDonation = async () => {
    if (!formData.name || !formData.price) {
      alert("Por favor completa el nombre y precio de la donación");
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`http://localhost:3001/api/donations/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        setDonations(donations.map(d => d._id === editingId ? data : d));
        setEditingId(null);
      } else {
        const res = await fetch("http://localhost:3001/api/donations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, userId: "12345" })
        });
        const data = await res.json();
        setDonations([...donations, data]);
      }

      setFormData({ name:'', price:0, quantity:1, description:'', image:'', size:'' });
    } catch (err) {
      console.error("Error al guardar donación:", err);
    }
  };

  const editDonation = (donation) => { setFormData(donation); setEditingId(donation._id); };
  const deleteDonation = async (id) => {
  try {
    await fetch(`http://localhost:3001/api/donations/${id}`, { method: "DELETE" });
    // 🔹 Usar _id en la comparación
    setDonations(donations.filter(d => d._id !== id));
  } catch (err) {
    console.error("Error al eliminar donación:", err);
  }
};


  const updateQuantity = (id, quantity) => {
    if (quantity < 0) return;
    setDonations(donations.map(d => d._id === id ? { ...d, quantity } : d));
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
