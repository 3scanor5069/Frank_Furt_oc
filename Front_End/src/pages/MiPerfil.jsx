import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/UserProfile.css';


// ===================================================================
// COMPONENTE: TOAST NOTIFICATION
// ===================================================================
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-icon">
                {type === 'success' ? '✓' : '✕'}
            </div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
};

// ===================================================================
// COMPONENTE: MODAL DE CONFIRMACIÓN
// ===================================================================
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'warning' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className={`modal-header modal-header-${type}`}>
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className={`btn-${type}`} onClick={onConfirm}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

// ===================================================================
// COMPONENTE: MODAL DE VERIFICACIÓN FINAL (Con Input)
// ===================================================================
const FinalVerificationModal = ({ isOpen, onClose, onConfirm, userEmail }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError('');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (!password.trim()) {
            setError('Debe ingresar su contraseña');
            return;
        }
        onConfirm(password);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-danger" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header modal-header-danger">
                    <h3>⚠️ Verificación Final</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="verification-warning">
                        <p className="warning-text">
                            <strong>Esta acción es IRREVERSIBLE</strong>
                        </p>
                        <p>Se eliminará permanentemente:</p>
                        <ul>
                            <li>Tu cuenta de usuario</li>
                            <li>Toda tu información personal</li>
                            <li>Tu historial de actividad</li>
                        </ul>
                        <p className="user-email">Cuenta: <strong>{userEmail}</strong></p>
                    </div>
                    
                    <div className="verification-input-group">
                        <label htmlFor="password-verify">
                            Ingresa tu contraseña para confirmar:
                        </label>
                        <input
                            id="password-verify"
                            type="password"
                            className="verification-input"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            onKeyPress={handleKeyPress}
                            autoFocus
                        />
                        {error && <span className="error-message">{error}</span>}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button 
                        className="btn-danger" 
                        onClick={handleConfirm}
                        disabled={!password.trim()}
                    >
                        Eliminar Mi Cuenta Permanentemente
                    </button>
                </div>
            </div>
        </div>
    );
};

// ===================================================================
// COMPONENTE PRINCIPAL: USER PROFILE
// ===================================================================
const UserProfile = () => {
    const navigate = useNavigate();
    const { user: contextUser, isAuthenticated, logout } = useAuth();

    // Estados principales
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados del formulario
    const [formData, setFormData] = useState({
        telefono: '',
        direccion: ''
    });
    const [originalData, setOriginalData] = useState({
        telefono: '',
        direccion: ''
    });
    const [errors, setErrors] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    // Estados de notificaciones y modales
    const [toast, setToast] = useState(null);
    const [showFirstModal, setShowFirstModal] = useState(false);
    const [showFinalModal, setShowFinalModal] = useState(false);

    // ===================================================================
    // VERIFICAR AUTENTICACIÓN
    // ===================================================================
    useEffect(() => {
        if (!isAuthenticated) {
            showToast('Debes iniciar sesión para ver tu perfil', 'error');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            fetchProfile();
        }
    }, [isAuthenticated, navigate]);

    // ===================================================================
    // DETECTAR CAMBIOS EN EL FORMULARIO
    // ===================================================================
    useEffect(() => {
        const changed = 
            formData.telefono !== originalData.telefono ||
            formData.direccion !== originalData.direccion;
        setHasChanges(changed);
    }, [formData, originalData]);

    // ===================================================================
    // FUNCIÓN: OBTENER PERFIL
    // ===================================================================
    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                showToast('No hay sesión activa. Por favor inicia sesión.', 'error');
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 2000);
                return;
            }

            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                const initialFormData = {
                    telefono: data.user.telefono || '',
                    direccion: data.user.direccion || ''
                };
                setFormData(initialFormData);
                setOriginalData(initialFormData);
            } else {
                showToast(data.message || 'Error al cargar el perfil', 'error');
                if (response.status === 401) {
                    setTimeout(() => {
                        logout();
                        navigate('/login');
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            showToast('Error de conexión al cargar el perfil', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ===================================================================
    // FUNCIÓN: MOSTRAR TOAST
    // ===================================================================
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    // ===================================================================
    // FUNCIÓN: VALIDAR TELÉFONO
    // ===================================================================
    const validatePhone = (phone) => {
        if (!phone || phone.trim() === '') return true; // Opcional
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone.trim());
    };

    // ===================================================================
    // FUNCIÓN: VALIDAR DIRECCIÓN
    // ===================================================================
    const validateAddress = (address) => {
        if (!address || address.trim() === '') return true; // Opcional
        return address.trim().length <= 200;
    };

    // ===================================================================
    // FUNCIÓN: MANEJAR CAMBIOS EN INPUTS
    // ===================================================================
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validación en tiempo real
        let newErrors = { ...errors };
        
        if (name === 'telefono') {
            if (value && !validatePhone(value)) {
                newErrors.telefono = 'Formato de teléfono inválido';
            } else {
                delete newErrors.telefono;
            }
        }

        if (name === 'direccion') {
            if (value && !validateAddress(value)) {
                newErrors.direccion = 'La dirección es demasiado larga (máx. 200 caracteres)';
            } else {
                delete newErrors.direccion;
            }
        }

        setErrors(newErrors);
    };

    // ===================================================================
    // FUNCIÓN: GUARDAR CAMBIOS
    // ===================================================================
    const handleSave = async () => {
        // Validar antes de enviar
        if (errors.telefono || errors.direccion) {
            showToast('Por favor corrige los errores antes de guardar', 'error');
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile/update', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showToast('✓ Perfil actualizado exitosamente', 'success');
                setOriginalData(formData);
                setUser(prev => ({
                    ...prev,
                    telefono: formData.telefono,
                    direccion: formData.direccion
                }));
            } else {
                showToast(data.message || 'Error al actualizar el perfil', 'error');
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            showToast('Error de conexión al guardar cambios', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ===================================================================
    // FUNCIÓN: CANCELAR EDICIÓN
    // ===================================================================
    const handleCancel = () => {
        setFormData(originalData);
        setErrors({});
    };

    // ===================================================================
    // FUNCIÓN: ABRIR PRIMER MODAL DE ELIMINACIÓN
    // ===================================================================
    const handleDeleteClick = () => {
        setShowFirstModal(true);
    };

    // ===================================================================
    // FUNCIÓN: CONFIRMAR PRIMER MODAL
    // ===================================================================
    const handleFirstModalConfirm = () => {
        setShowFirstModal(false);
        setShowFinalModal(true);
    };

    // ===================================================================
    // FUNCIÓN: ELIMINAR CUENTA (VERIFICACIÓN FINAL)
    // ===================================================================
    const handleFinalDeleteConfirm = async (password) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile/delete', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Cuenta eliminada exitosamente', 'success');
                setShowFinalModal(false);
                
                // Limpiar y redirigir usando el contexto
                setTimeout(() => {
                    logout();
                    navigate('/login');
                }, 2000);
            } else {
                showToast(data.message || 'Error al eliminar la cuenta', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar cuenta:', error);
            showToast('Error de conexión al eliminar la cuenta', 'error');
        }
    };

    // ===================================================================
    // FUNCIÓN: OBTENER INICIALES
    // ===================================================================
    const getUserInitial = (nombre) => {
        if (!nombre) return 'U';
        const nameParts = nombre.trim().split(' ');
        if (nameParts.length >= 2) {
            return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
        }
        return nombre.charAt(0).toUpperCase();
    };

    // ===================================================================
    // RENDERIZADO CONDICIONAL: LOADING
    // ===================================================================
    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    // ===================================================================
    // RENDERIZADO CONDICIONAL: NO HAY USUARIO
    // ===================================================================
    if (!user) {
        return (
            <div className="profile-container">
                <div className="error-state">
                    <h2>Error al cargar el perfil</h2>
                    <p>No se pudo obtener la información del usuario</p>
                    <button onClick={fetchProfile} className="btn-primary">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    // ===================================================================
    // RENDERIZADO PRINCIPAL
    // ===================================================================
    return (
        <div className="profile-container">
            {/* TOASTS */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* HEADER */}
            <div className="profile-header">
                <div className="profile-avatar-large">
                    {getUserInitial(user.nombre)}
                </div>
                <div className="profile-header-info">
                    <h1>{user.nombre}</h1>
                    <p className="profile-role">{user.rol ? user.rol.toUpperCase() : 'USUARIO'}</p>
                    <p className="profile-email">{user.correo}</p>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL - DOS COLUMNAS */}
            <div className="profile-content">
                {/* COLUMNA IZQUIERDA: INFORMACIÓN NO EDITABLE */}
                <div className="profile-section info-section">
                    <h2>Información Personal</h2>
                    
                    <div className="info-card">
                        <div className="info-item">
                            <span className="info-label">Nombre Completo:</span>
                            <span className="info-value">{user.nombre}</span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Correo Electrónico:</span>
                            <span className="info-value">{user.correo}</span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Rol:</span>
                            <span className="info-value role-badge">{user.rol || 'cliente'}</span>
                        </div>

                        <div className="info-item">
                            <span className="info-label">Fecha de Registro:</span>
                            <span className="info-value">
                                {user.fecha_registro ? 
                                    new Date(user.fecha_registro).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 
                                    'N/A'
                                }
                            </span>
                        </div>

                        {user.ultimo_acceso && (
                            <div className="info-item">
                                <span className="info-label">Último Acceso:</span>
                                <span className="info-value">
                                    {new Date(user.ultimo_acceso).toLocaleString('es-ES')}
                                </span>
                            </div>
                        )}

                        <div className="info-item">
                            <span className="info-label">Estado de Cuenta:</span>
                            <span className={`status-badge ${user.activo ? 'active' : 'inactive'}`}>
                                {user.activo ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: FORMULARIO EDITABLE */}
                <div className="profile-section edit-section">
                    <h2>Actualizar Información</h2>
                    
                    <div className="edit-card">
                        <div className="form-group">
                            <label htmlFor="telefono">
                                Teléfono
                                <span className="optional-label">(opcional)</span>
                            </label>
                            <input
                                type="text"
                                id="telefono"
                                name="telefono"
                                className={errors.telefono ? 'input-error' : ''}
                                placeholder="+57 300 123 4567"
                                value={formData.telefono}
                                onChange={handleInputChange}
                            />
                            {errors.telefono && (
                                <span className="error-message">{errors.telefono}</span>
                            )}
                            <span className="input-hint">
                                Formato: números, espacios, guiones, paréntesis
                            </span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="direccion">
                                Dirección
                                <span className="optional-label">(opcional)</span>
                            </label>
                            <textarea
                                id="direccion"
                                name="direccion"
                                rows="3"
                                className={errors.direccion ? 'input-error' : ''}
                                placeholder="Calle 123 #45-67, Ciudad"
                                value={formData.direccion}
                                onChange={handleInputChange}
                                maxLength="200"
                            />
                            {errors.direccion && (
                                <span className="error-message">{errors.direccion}</span>
                            )}
                            <span className="input-hint">
                                {formData.direccion.length}/200 caracteres
                            </span>
                        </div>

                        <div className="form-actions">
                            <button
                                className="btn-secondary"
                                onClick={handleCancel}
                                disabled={!hasChanges || saving}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSave}
                                disabled={!hasChanges || saving || Object.keys(errors).length > 0}
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONA DE PELIGRO: ELIMINAR CUENTA */}
            <div className="danger-zone">
                <h2>Zona de Peligro</h2>
                <div className="danger-card">
                    <div className="danger-content">
                        <h3>Eliminar mi Cuenta</h3>
                        <p>
                            Una vez eliminada tu cuenta, no hay vuelta atrás. 
                            Esta acción eliminará permanentemente toda tu información.
                        </p>
                    </div>
                    <button className="btn-danger" onClick={handleDeleteClick}>
                        Eliminar mi Cuenta
                    </button>
                </div>
            </div>

            {/* MODALES */}
            <ConfirmModal
                isOpen={showFirstModal}
                onClose={() => setShowFirstModal(false)}
                onConfirm={handleFirstModalConfirm}
                title="¿Estás seguro?"
                message="Esta acción eliminará permanentemente tu cuenta y toda tu información. Esta acción NO se puede deshacer."
                type="danger"
            />

            <FinalVerificationModal
                isOpen={showFinalModal}
                onClose={() => setShowFinalModal(false)}
                onConfirm={handleFinalDeleteConfirm}
                userEmail={user.correo}
            />
        </div>
    );
};

export default UserProfile;