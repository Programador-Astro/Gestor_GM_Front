import "./ProducaoInicio.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function OutraPage() {
  const navigate = useNavigate();
  const [producoes, setProducoes] = useState([]);
  const [loading, setLoading] = useState(true);

  function novaProducao() {
    navigate("/producao/nova");
  }

  // Carrega produções do dia
  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get("api/producao/");
        const todas = res.data;

        // Filtrando pela data de hoje
        const hoje = new Date().toISOString().slice(0, 10);

        const filtradas = todas.filter((p) => p.data === hoje);

        setProducoes(filtradas);
      } catch (err) {
        console.error("Erro ao buscar produções:", err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  return (
    <div className="producao-container">
      <div className="header">
        <h1>Produção do Dia</h1>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : producoes.length === 0 ? (
        <p className="sem-registros">Nenhuma produção registrada hoje.</p>
      ) : (
        <div className="lista-producoes">
          {producoes.map((prod) => (
            <div
              key={prod.id}
              className="card-producao"
              onClick={() => navigate(`/producao/${prod.id}`)}
            >
              <h3>Produção #{prod.id}</h3>
              <p>Data: <strong>{prod.data}</strong></p>
              <p>Itens: <strong>{prod.itens.length}</strong></p>

              <span className={`status status-${prod.status.toLowerCase()}`}>
                {prod.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
