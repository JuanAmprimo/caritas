import { useState, useEffect } from "react";
import { Container, Card } from "react-bootstrap";
import DonationForm from "./DonationForm";
import DonationTable from "./DonationTable";

export default function PriceCalculator({ searchTerm }) {
  const [donations, setDonations] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    quantity: 1,
    description: "",
    image: "",
    size: "",
  });
  const [editingId, setEditingId] = useState(null);

  // 🔹 Traer donaciones del backend al cargar
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await fetch("/api/donations?userId=12345", {
          method: "GET",
          credentials: "include" // 🔹 cookies
        });

        const data = await res.json();
        setDonations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al traer donaciones:", err);
        setDonations([]);
      }
    };

    fetchDonations();
  }, []);

  const handleInputChange = (field, value) =>
    setFormData({ ...formData, [field]: value });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData({ ...formData, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // 🔹 Crear o actualizar donación
  const addOrUpdateDonation = async () => {
    if (!formData.name || !formData.price) {
      alert("Por favor completa el nombre y precio");
      return;
    }

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/donations/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include" // 🔹 cookies
        });
      } else {
        res = await fetch("/api/donations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, userId: "12345" }),
          credentials: "include" // 🔹 cookies
        });
      }

      const data = await res.json();
      if (res.ok) {
        setDonations(
          editingId
            ? donations.map((d) => (d._id === editingId ? data : d))
            : [...donations, data],
        );
        setEditingId(null);
        setFormData({
          name: "",
          price: 0,
          quantity: 1,
          description: "",
          image: "",
          size: "",
        });
      }
    } catch (err) {
      console.error("Error al guardar donación:", err);
    }
  };

  const editDonation = (donation) => {
    setFormData(donation);
    setEditingId(donation._id);
  };

  const deleteDonation = async (id) => {
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: "DELETE",
        credentials: "include" // 🔹 cookies
      });

      if (res.ok) {
        setDonations(donations.filter(d => d._id !== id));
      }
    } catch (err) {
      console.error("Error al eliminar donación:", err);
    }
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 0) return;
    setDonations(donations.map((d) => (d._id === id ? { ...d, quantity } : d)));
  };

  const calculateTotal = () =>
    donations.reduce((sum, d) => sum + d.price * d.quantity, 0);
  const calculateSubtotal = (d) => d.price * d.quantity;

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      price: 0,
      quantity: 1,
      description: "",
      image: "",
      size: "",
    });
  };

  // 🔹 Filtrar donaciones usando el searchTerm del Navbar
  const filteredDonations = donations.filter((d) =>
    Object.values(d).some((val) =>
      String(val || "")
        .toLowerCase()
        .includes((searchTerm || "").toLowerCase()),
    ),
  );

  return (
    <Container fluid className="py-4">
      {/* Formulario */}
      <Card className="shadow-sm mb-4 border-0">
        <Card.Header
          style={{ backgroundColor: "#10b981" }}
          className="text-white"
        >
          <h4 className="mb-0">💰 Calculadora de Precios de Donaciones</h4>
        </Card.Header>
        <Card.Body>
          <h5>{editingId ? "Modificar Donación" : "Nueva Donación"}</h5>
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

      {/* Tabla */}
      <Card className="shadow-sm border-0">
        <Card.Header
          style={{ backgroundColor: "#6366f1" }}
          className="text-white"
        >
          <h4 className="mb-0">🛒 Lista de Donaciones y Cálculo Final</h4>
        </Card.Header>
        <Card.Body>
          {filteredDonations.length === 0 ? (
            <p className="text-muted">
              No hay donaciones que coincidan con la búsqueda.
            </p>
          ) : (
            <div
              style={{
                maxHeight: filteredDonations.length > 3 ? "300px" : "none",
                overflowY: filteredDonations.length > 3 ? "auto" : "visible",
                border:
                  filteredDonations.length > 3 ? "1px solid #ccc" : "none",
                padding: filteredDonations.length > 3 ? "10px" : "0",
              }}
            >
              <DonationTable
                donations={filteredDonations}
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
