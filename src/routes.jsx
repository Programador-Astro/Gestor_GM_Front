import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import SecureRoute from "./components/SecureRoute";

{/* PRODUCAO */}
import ProducaoInicio from "./pages/producao/ProducaoInicio";
import ProducaoEditar from "./pages/producao/ProducaoEditar";
import CamaraFria from "./pages/estoque/CamaraFria";


{/* Estoque */}
import EstoqueInicio from "./pages/estoque/EstoqueInicio";
import EntradaInsumos from "./pages/estoque/EntradaInsumos";
import CamaraFriaEditar from "./pages/estoque/CamaraFriaEditar";



export default function AppRoutes() {
  return (
    <Routes>
      
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Root → Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Produção */}
      <Route
        path="/producao/inicio"
        element={
          <SecureRoute allowed={["PRODUCAO", "ADM"]}>
            <ProducaoInicio />
          </SecureRoute>
        }
      />
      <Route
        path="/producao/:id"
        element={
          <SecureRoute allowed={["PRODUCAO", "ADM"]}>
            <ProducaoEditar />
          </SecureRoute>
        }
      />



            {/* Estoque */}
      <Route path="estoque/" element={<Navigate to="inicio/" replace />} />
      <Route
        path="/Estoque/inicio"
        element={
          <SecureRoute allowed={["ESTOQUE", "ADM"]}>
            <EstoqueInicio />
          </SecureRoute>
        }
      />
      <Route
        path="/Estoque/Entrada"
        element={
          <SecureRoute allowed={["ESTOQUE", "ADM"]}>
            <EntradaInsumos />
          </SecureRoute>
        }
      />
      <Route
        path="/Estoque/camara-fria"
        element={
          <SecureRoute allowed={["ESTOQUE", "ADM"]}>
            <CamaraFria/>
          </SecureRoute>
        }
      />
      <Route
        path="/estoque/producao/:id"
        element={
          <SecureRoute allowed={["ESTOQUE", "ADM"]}>
            <CamaraFriaEditar />
          </SecureRoute>
        }
      />

      </Routes>
  );
}
