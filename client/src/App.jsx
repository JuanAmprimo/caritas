import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import NavbarShop from './components/NavbarShop';
import Footer from './components/Footer';
import ListManager from './components/ListManager/ListManager';
import PriceCalculator from './components/PriceCalculator/PriceCalculator';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { useState, useEffect } from 'react';
import { apiFetch, clearTokens, refreshAccessToken } from './utils/auth.js';
import './index.css';
import './App.css';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('accessToken'));
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    const keepSessionAlive = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;

      try {
        const res = await apiFetch(`/.netlify/functions/getUser`, { method: 'GET' });
        if (!res) return; // apiFetch may redirect

        if (res.status === 404) {
          clearTokens();
          localStorage.removeItem('username');
          localStorage.removeItem('userId');
          setIsLoggedIn(false);
          setUsername('');
          alert('Tu cuenta fue eliminada. Se cerrará la sesión.');
          window.location.href = '/register';
        }
      } catch (err) {
        console.error('Error verificando usuario:', err);
      }
    };

    const refreshSession = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;

      try {
        await refreshAccessToken();
      } catch (err) {
        console.error('Error al refrescar sesión en segundo plano:', err);
      }
    };

    keepSessionAlive();
    const keepAliveInterval = setInterval(keepSessionAlive, 10 * 60 * 1000); // cada 10 minutos
    const refreshInterval = setInterval(refreshSession, 50 * 60 * 1000); // cada 50 minutos

    return () => {
      cancelled = true;
      clearInterval(keepAliveInterval);
      clearInterval(refreshInterval);
    };
  }, [isLoggedIn, setIsLoggedIn, setUsername]);

  return (
    <Router>
      <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
        <NavbarShop
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoggedIn={isLoggedIn}
          username={username}
          setIsLoggedIn={setIsLoggedIn}
          setUsername={setUsername}
        />

        <div className="flex-grow-1 container mt-4">
          <Routes>
            {/* Rutas principales */}
            <Route
              path="/lists"
              element={
                isLoggedIn ? (
                  <ListManager searchTerm={searchTerm} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/calculator"
              element={
                isLoggedIn ? (
                  <PriceCalculator searchTerm={searchTerm} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Autenticación */}
            <Route
              path="/login"
              element={
                !isLoggedIn ? (
                  <Login setIsLoggedIn={setIsLoggedIn} setUsername={setUsername} />
                ) : (
                  <Navigate to="/lists" replace />
                )
              }
            />
            <Route
              path="/register"
              element={
                !isLoggedIn ? (
                  <Register />
                ) : (
                  <Navigate to="/lists" replace />
                )
              }
            />

            {/* Ruta por defecto */}
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <ListManager searchTerm={searchTerm} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}
