import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Scale,
  Package,
  CreditCard,
  Calendar,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  HandCoins,
  X,
  Leaf,
} from "lucide-react";
import { useAuth } from "../../AuthContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const toggleCollapsed = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newVal));
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/patients", label: "Pacientes", icon: Users },
    { path: "/weights", label: "Control Peso", icon: Scale },
    { path: "/inventory", label: "Inventario", icon: Package },
    { path: "/doctors", label: "Doctoras", icon: Stethoscope },
    { path: "/payments", label: "Pagos", icon: CreditCard },
    ...(isAdmin ? [{ path: "/receivables", label: "CxC", icon: HandCoins }] : []),
    { path: "/appointments", label: "Citas", icon: Calendar },
  ];

  const userName = user?.name || "Usuario";
  const userInitial = userName[0]?.toUpperCase() || "U";
  const userRole = user?.role || "Administrador";

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-logo">
          <Leaf size={20} />
          <span>Alternativas</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <Link to="/dashboard" className="logo-link">
            <div className="logo-icon">
              <Leaf size={24} />
            </div>
            {!isCollapsed && (
              <div className="logo-text">
                <span className="logo-title">Alternativas</span>
                <span className="logo-subtitle">Panel Clinico</span>
              </div>
            )}
          </Link>
          
          <button 
            className="collapse-btn desktop-only" 
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          
          <button 
            className="close-btn mobile-only" 
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile */}
        <div className="user-card">
          <div className="user-avatar">
            {userInitial}
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{userRole}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="nav-icon">
                  <Icon size={20} />
                </span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {isActive && <span className="nav-indicator" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            onClick={logout}
            className="logout-btn"
            title={isCollapsed ? "Cerrar Sesion" : undefined}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Cerrar Sesion</span>}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
