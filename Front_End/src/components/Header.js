// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram,
  FaBars, FaTimes, FaUser, FaShoppingCart, 
} from 'react-icons/fa';
import { Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [avatarVisible, setAvatarVisible] = useState(false);

  const userMenuRef = useRef(null);
  const userMenuTimeoutRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        setAvatarVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAvatarVisible(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    return () => {
      if (userMenuTimeoutRef.current) {
        clearTimeout(userMenuTimeoutRef.current);
      }
    };
  }, []);

  const handleLinkClick = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setAvatarVisible(false);
    setMobileOpen(false);
    navigate('/login');
  };

  const handleUserMenuEnter = () => {
    if (userMenuTimeoutRef.current) {
      clearTimeout(userMenuTimeoutRef.current);
    }
    setUserMenuOpen(true);
  };

  const handleUserMenuLeave = () => {
    userMenuTimeoutRef.current = setTimeout(() => {
      setUserMenuOpen(false);
    }, 150);
  };

  const handleKeyDown = (event, menuType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (menuType === 'user') {
        setUserMenuOpen(!userMenuOpen);
      } else if (menuType === 'dropdown') {
        setOpenDropdown(openDropdown === menuType ? null : menuType);
      }
    } else if (event.key === 'Escape') {
      setUserMenuOpen(false);
      setOpenDropdown(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getMenuLink = (section) => {
    return location.pathname === '/menu' ? `#${section}` : `/menu#${section}`;
  };

  const getUserInitial = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const MobileUserSection = () => (
    <div className="mobile-actions">
      {isAuthenticated && user ? (
        <>
          <div className="mobile-user-info epic-mobile">
            <div className="mobile-avatar">
              {getUserInitial(user.nombre)}
            </div>
            <div className="mobile-user-details">
              <span className="mobile-user-name">{user.nombre}</span>
              <span className="mobile-user-rol">{user.rol}</span>
            </div>
          </div>
          
        </>
      ) : (
        <>
          <Link to="/login" className="mobile-btn auth-btn" onClick={handleLinkClick}>
            Iniciar Sesión
          </Link>
          <Link to="/register" className="mobile-btn auth-btn secondary" onClick={handleLinkClick}>
            Registrarse
          </Link>
        </>
      )}
    </div>
  );

  return (
    <header className={`header ${isAuthenticated ? 'logged-in' : ''}`}>
      <div className="contact-bar">
        <div className="container">
          <div className="contact-info">
          </div>
          <div className="social-links">
            <span className="social-text">📞 +57 300 123 4567</span>
            <span className="social-text">✉️ contacto@frankfurt.com</span>

            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      <nav className="main-nav" role="navigation" aria-label="Navegación principal">
        <div className="container">
          <Link to="/" className="logo" onClick={handleLinkClick}>
            <Crown className="crown-icon" />
            <div className="logo-text">
              <span className="brand-name">FRANK FURT</span>
              <span className="brand-tagline">Sabor Auténtico</span>
            </div>
          </Link>

          <div className={`nav-wrapper ${mobileOpen ? 'nav-open' : ''}`}>
            <ul className="nav-menu" role="menubar">
              <li className="nav-item" role="none">
                <Link 
                  to="/" 
                  className={`nav-link ${isActiveLink('/') ? 'active' : ''}`} 
                  onClick={handleLinkClick}
                  role="menuitem"
                >
                  Inicio
                </Link>
              </li>
              
              <li 
                className={`nav-item dropdown ${openDropdown === 'pages' ? 'active' : ''}`}
                onMouseEnter={() => setOpenDropdown('pages')}
                onMouseLeave={() => setOpenDropdown(null)}
                role="none"
              >
                <span 
                  className="nav-link"
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={openDropdown === 'pages'}
                  tabIndex="0"
                  onKeyDown={(e) => handleKeyDown(e, 'pages')}
                >
                  Páginas
                </span>
                <ul className="dropdown-menu" role="menu" aria-label="Submenú de páginas">
                  <li role="none">
                    <Link to="/about" onClick={handleLinkClick} role="menuitem">
                      Nosotros
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/equipo" onClick={handleLinkClick} role="menuitem">
                      Equipo
                    </Link>
                  </li>
                  <li role="none">
                    <Link to="/servicios" onClick={handleLinkClick} role="menuitem">
                      Servicios
                    </Link>
                  </li>
                </ul>
              </li>

              <li 
                className={`nav-item dropdown ${openDropdown === 'menu' ? 'active' : ''}`}
                onMouseEnter={() => setOpenDropdown('menu')}
                onMouseLeave={() => setOpenDropdown(null)}
                role="none"
              >
                <Link 
                  to="/menu" 
                  className={`nav-link ${isActiveLink('/menu') ? 'active' : ''}`}
                  onClick={handleLinkClick}
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={openDropdown === 'menu'}
                >
                  Menú
                </Link>
                <ul className="dropdown-menu" role="menu" aria-label="Submenú del menú">
                  <li role="none">
                    <a href={getMenuLink('platos-principales')} onClick={handleLinkClick} role="menuitem">
                      Platos Principales
                    </a>
                  </li>
                  <li role="none">
                    <a href={getMenuLink('bebidas')} onClick={handleLinkClick} role="menuitem">
                      Bebidas
                    </a>
                  </li>
                  <li role="none">
                    <a href={getMenuLink('postres')} onClick={handleLinkClick} role="menuitem">
                      Postres
                    </a>
                  </li>
                </ul>
              </li>

              <li className="nav-item" role="none">
                <Link 
                  to="/ubications" 
                  className={`nav-link ${isActiveLink('/ubications') ? 'active' : ''}`}
                  onClick={handleLinkClick}
                  role="menuitem"
                >
                  Ubicaciones
                </Link>
              </li>

              <li className="nav-actions" role="none">
                <Link 
                  to="/cart" 
                  className={`nav-link ${isActiveLink('/cart') ? 'active' : ''}`}
                  onClick={handleLinkClick}
                  role="menuitem"
                >
                  <FaShoppingCart /> Carrito
                </Link>
              </li>
            </ul>

            <MobileUserSection />
          </div>

          <div className="header-actions">
            {isAuthenticated && user ? (
              <div 
                className="user-menu-container epic-style" 
                ref={userMenuRef}
                onMouseEnter={handleUserMenuEnter}
                onMouseLeave={handleUserMenuLeave}
              >
                <button 
                  className={`user-menu-trigger ${avatarVisible ? 'avatar-visible' : ''}`}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onKeyDown={(e) => handleKeyDown(e, 'user')}
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                  aria-label={`Menú de usuario de ${user.nombre}`}
                >
                  <div className="user-avatar">
                    {getUserInitial(user.nombre)}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.nombre}</span>
                    <span className="user-rol">{user.rol}</span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown-menu" role="menu">
                    <div className="user-dropdown-header">
                      <div className="dropdown-avatar">
                        {getUserInitial(user.nombre)}
                      </div>
                      <div className="dropdown-user-info">
                        <span className="dropdown-name">{user.nombre}</span>
                        <span className="dropdown-rol">{user.rol}</span>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <Link 
                      to="/MiPerfil" 
                      className="dropdown-item" 
                      onClick={handleLinkClick}
                      role="menuitem"
                    >
                      <FaUser /> Mi Perfil
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item logout-item" 
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-login" onClick={handleLinkClick}>
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="btn-register" onClick={handleLinkClick}>
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;