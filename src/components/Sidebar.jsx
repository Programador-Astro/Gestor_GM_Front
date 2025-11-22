import { useState } from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <div className={`sidebar ${open ? "open" : "closed"}`}>
      <div className="sidebar-top">
        <button className="toggle-btn" onClick={() => setOpen(!open)}>
          {open ? "⬅" : "➡"}
        </button>
      </div>

      <nav className="menu">
        <Link to="/producao" className="menu-item">
          <span className="icon">📦</span>
          {open && <span className="label">Produção</span>}
        </Link>

        <Link to="/camara-fria" className="menu-item">
          <span className="icon">❄️</span>
          {open && <span className="label">Câmara Fria</span>}
        </Link>
      </nav>
    </div>
  );
}
