import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { menuConfig } from "./menuConfig";
import "./Sidebar.css";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const { pathname } = useLocation();

  // Detecta o setor automaticamente pela URL
  const currentSector = useMemo(() => {
    const sector = pathname.split("/")[1];
    return sector || null;
  }, [pathname]);

  const menu = menuConfig[currentSector] || [];

  return (
    
    <div className={`sidebar ${open ? "open" : "closed"}`}>
      <div className="sidebar-top">
        <button className="toggle-btn" onClick={() => setOpen(!open)}>
          {open ? "⬅" : "➡"}
        </button>
      </div>

      <nav className="menu">
        {menu.length > 0 ? (
          menu.map((item, index) => (
            <Link key={index} to={item.path} className="menu-item">
              <span className="icon">{item.icon}</span>
              {open && <span className="label">{item.label}</span>}
            </Link>
          ))
        ) : (
          <div className="menu-empty">
            {open ? "Nenhum menu disponível aqui" : "⚠"}
          </div>
        )}
      </nav>
    </div>
  );
}
