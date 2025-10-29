// src/pages/ForgotPassword.jsx
import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!correo.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!validateEmail(correo)) {
      setError('Por favor ingresa un correo válido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3006/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo: correo.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setCorreo('');
      } else {
        setError(data.message || 'Error al procesar la solicitud');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="decorative-circle circle-1"></div>
        <div className="decorative-circle circle-2"></div>

        <Link to="/Login" className="back-button">
          <ArrowLeft size={20} />
          <span>Volver al login</span>
        </Link>

        <div className="forgot-password-header">
          <div className="forgot-icon">
            <Mail className="icon" />
          </div>
          <h1 className="forgot-title">¿Olvidaste tu contraseña?</h1>
          <p className="forgot-subtitle">
            No te preocupes, te enviaremos instrucciones para recuperarla
          </p>
        </div>

        {error && (
          <div className="message-container error-message">
            <AlertCircle className="message-icon" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="success-container">
            <div className="success-icon-large">
              <CheckCircle size={64} />
            </div>
            <h2 className="success-title">¡Correo enviado!</h2>
            <p className="success-text">
              Si el correo existe en nuestro sistema, recibirás un enlace para
              restablecer tu contraseña.
            </p>
            <p className="success-subtext">
              Revisa tu bandeja de entrada y la carpeta de spam.
            </p>
            <div className="success-note">
              <p>⏱️ El enlace expirará en 15 minutos</p>
            </div>
            <Link to="/Login" className="btn-back-to-login">
              Volver al login
            </Link>
          </div>
        ) : (
          <form className="forgot-password-form" onSubmit={handleSubmit}>
            <div className="input-group-forgot">
              <div className="input-icon-forgot">
                <Mail className="icon-small" />
              </div>
              <input
                type="email"
                className="form-input"
                placeholder="tu@email.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn-submit-forgot"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <span>Enviando...</span>
                </div>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </button>
          </form>
        )}

        <div className="forgot-footer">
          <p className="footer-text">
            ¿Recordaste tu contraseña?{' '}
            <Link to="/Login" className="footer-link">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;