import { createContext, useEffect, useState, useContext } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = carregando
  const [loading, setLoading] = useState(true);

  // LOG (pode remover depois)
  console.log("[AuthProvider] RENDER user:", user, "loading:", loading);

  useEffect(() => {
  const isLoginPage = window.location.pathname === "/login";

  if (isLoginPage) {
    setLoading(false);
    return;
  }

  async function loadUser() {
  try {
    const res = await api.get("/auth/me/", { withCredentials: true });

    // padronizar user
    const formattedUser = {
      id: res.data.id,
      email: res.data.email,
      username: res.data.username,
      setor: res.data.perfil.setor,   
      cargo: res.data.perfil.cargo,
    };

    setUser(formattedUser);
  } catch (e) {
    setUser(null);
  } finally {
    setLoading(false);
  }
}


  loadUser();
}, []);

  async function login(email, senha) {
  await api.post("/auth/login/", { email, senha }, { withCredentials: true });

  const res = await api.get("/auth/me/", { withCredentials: true });

  const formattedUser = {
    id: res.data.id,
    email: res.data.email,
    username: res.data.username,
    setor: res.data.perfil.setor,
    cargo: res.data.perfil.cargo,
  };

  setUser(formattedUser);

  return formattedUser;
}

  function logout() {
    console.log("[logout()]");
    api.post("/auth/logout/");
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
