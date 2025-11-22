import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await login(email, senha);
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Acesso ao Sistema</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            placeholder="Digite seu e-mail"
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Senha</label>
          <input
            type="password"
            value={senha}
            placeholder="Digite sua senha"
            onChange={(e) => setSenha(e.target.value)}
          />

          <button type="submit" className="login-btn">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
