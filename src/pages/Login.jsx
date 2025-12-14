import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./login.css"; // ajuste o caminho se necessário

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");

    try {
      const usuario = await login(email, senha);

      // 🔥 Rota dinâmica baseada no setor
      const setor = usuario.setor.toLowerCase();
      const destino = `/${setor}/inicio`;

      navigate(destino, { replace: true });
    } catch (err) {
      setErro("Usuário ou senha inválidos.");
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">

        <h1 className="login-title">Acesso ao Sistema</h1>

        {erro && <p className="login-error">{erro}</p>}

        <form className="login-form" onSubmit={handleLogin}>

          <label>E-mail</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu e-mail"
          />

          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite sua senha"
          />

          <button type="submit" className="login-btn">
            Entrar
          </button>

        </form>
      </div>
    </div>
  );
}
