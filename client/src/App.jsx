import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavbarShop from './components/NavbarShop';
import Footer from './components/Footer';
import ListManager from './components/ListManager/ListManager';
import PriceCalculator from './components/PriceCalculator/PriceCalculator';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { useState } from 'react';
import './index.css';
import './App.css';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Router>
      <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
        <NavbarShop
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <div className="flex-grow-1 container mt-4">
          <Routes>
            {/* Rutas principales */}
            <Route path="/lists" element={<ListManager searchTerm={searchTerm} />} />
            <Route path="/calculator" element={<PriceCalculator searchTerm={searchTerm} />} />

            {/* Autenticación */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Ruta por defecto */}
            <Route path="/" element={<ListManager searchTerm={searchTerm} />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}
