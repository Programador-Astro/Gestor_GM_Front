import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./DashboardLayout.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />

      <div className="content-area">
        <Navbar />

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
