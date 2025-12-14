import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SecureRoute({ children, allowed }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;

  // 🔥 Não logado
  if (!user) return <Navigate to="/login" />;

  // 🔥 Não tem permissão
  if (allowed && !allowed.includes(user.setor)) {
    return <Navigate to="/sem-permissao" replace />;
  }

  return children;
}
