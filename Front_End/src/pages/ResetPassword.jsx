// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/Restablecer.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token inválido o no proporcionado');
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.password) {
      setError('La contraseña es requerida');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!formData.confirmPassword) {
      setError('Debes confirmar la contraseña');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3006/api/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/Login');
        }, 3000);
      } else {
        setError(data.message || 'Error al restablecer la contraseña');
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
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="decorative-circle circle-1"></div>
        <div className="decorative-circle circle-2"></div>

        <div className="reset-password-header">
          <div className="reset-icon">
            <Lock className="icon" />
          </div>
          <h1 className="reset-title">Restablecer Contraseña</h1>
          <p className="reset-subtitle">
            Ingresa tu nueva contraseña
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
            <h2 className="success-title">¡Contraseña actualizada!</h2>
            <p className="success-text">
              Tu contraseña ha sido restablecida exitosamente.
            </p>
            <p className="success-subtext">
              Serás redirigido al login en unos segundos...
            </p>
            <Link to="/Login" className="btn-back-to-login">
              Ir al login ahora
            </Link>
          </div>
        ) : (
          <form className="reset-password-form" onSubmit={handleSubmit}>
            <div className="input-group-reset">
              <div className="input-icon-reset">
                <Lock className="icon-small" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Nueva contraseña"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="input-group-reset">
              <div className="input-icon-reset">
                <Lock className="icon-small" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="form-input"
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="password-requirements">
              <p className="requirements-title">La contraseña debe tener:</p>
              <ul className="requirements-list">
                <li className={formData.password.length >= 6 ? 'valid' : ''}>
                  Al menos 6 caracteres
                </li>
                <li className={formData.password === formData.confirmPassword && formData.password ? 'valid' : ''}>
                  Las contraseñas deben coincidir
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn-submit-reset"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <span>Actualizando...</span>
                </div>
              ) : (
                'Restablecer contraseña'
              )}
            </button>
          </form>
        )}

        <div className="reset-footer">
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

export default ResetPassword;