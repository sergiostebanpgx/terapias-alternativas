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
  ShieldCheck,
  BriefcaseBusiness,
  Workflow,
  Sparkles,
  Stethoscope,
  HandCoins,
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

  const navGroups = [
    {
      key: "gestion",
      title: "Gestión",
      icon: BriefcaseBusiness,
      items: [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/patients", label: "Pacientes", icon: Users },
        { path: "/weights", label: "Control Peso", icon: Scale },
      ],
    },
    {
      key: "operaciones",
      title: "Operaciones",
      icon: Workflow,
      items: [
        { path: "/inventory", label: "Inventario", icon: Package },
        { path: "/doctors", label: "Doctoras", icon: Stethoscope },
        { path: "/payments", label: "Pagos", icon: CreditCard },
        ...(isAdmin
          ? [{ path: "/receivables", label: "CxC", icon: HandCoins }]
          : []),
        { path: "/appointments", label: "Citas", icon: Calendar },
      ],
    },
  ];

  const userName = user?.name || "Usuario";
  const userInitial = userName[0]?.toUpperCase() || "U";
  const userEmail = user?.email || "usuario@alternativas.app";
  const userRole = user?.role || "Administrador";

  return (
    <>
      <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
        <Menu size={24} />
      </button>

      <aside
        className={`sidebar glass-panel ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <ShieldCheck size={28} color="var(--primary)" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="logo-text">Alternativas</h2>
                <p className="logo-subtitle">Panel Clínico</p>
              </div>
            )}
          </div>
          <button className="collapse-btn" onClick={toggleCollapsed}>
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <div className="user-profile">
          <div className="avatar">{userInitial}</div>
          {!isCollapsed && (
            <div className="user-info">
              <p className="user-name">{userName}</p>
              <p className="user-role">{userRole}</p>
              <p className="user-email">{userEmail}</p>
            </div>
          )}
          {!isCollapsed && (
            <div className="user-presence" title="Sesión activa">
              <Sparkles size={13} />
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.key} className="nav-group">
                {!isCollapsed && (
                  <p className="nav-group-title">
                    <GroupIcon size={13} />
                    {group.title}
                  </p>
                )}
                <div className="nav-group-items">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${isActive ? "active" : ""}`}
                        onClick={() => setIsOpen(false)}
                        title={isCollapsed ? item.label : ""}
                      >
                        <span className="nav-icon">
                          <Icon size={20} />
                        </span>
                        {!isCollapsed && (
                          <span className="nav-label">{item.label}</span>
                        )}
                        {isActive && <div className="active-dot" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={logout}
            className="btn-logout"
            title={isCollapsed ? "Cerrar Sesión" : ""}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="sidebar-overlay"
          role="button"
          tabIndex={0}
          aria-label="Cerrar menú lateral"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(false);
            }
          }}
        ></div>
      )}
    </>
  );
}
