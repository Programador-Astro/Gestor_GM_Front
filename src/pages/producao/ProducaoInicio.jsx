// src/pages/ProducaoInicio.jsx
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import "./ProducaoInicio.css";

// ======== RECHARTS (gráfico) ========
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

// Função auxiliar para verificar se a data é hoje
const isToday = (dateString) => {
  if (!dateString) return false;
  // Assume que o item.data da API vem no formato "YYYY-MM-DD"
  const today = new Date().toISOString().split("T")[0];
  return dateString === today;
};

export default function ProducaoInicio() {
  const [producaoDoDia, setProducaoDoDia] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [observacao, setObservacao] = useState("");

  const [estoqueData, setEstoqueData] = useState([]);
  const [graficoLoading, setGraficoLoading] = useState(true);

  const navigate = useNavigate();

  // =======================
  // PRODUÇÃO DO DIA
  // =======================
  const fetchProducao = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/producao/");


      const producoesHojeOuEmAberto = data.filter(
        (item) => isToday(item.data) || item.status !== "FINALIZADO"
      );


      setProducaoDoDia(producoesHojeOuEmAberto);
    }
    catch (error) {
      console.error("Erro ao buscar produção:", error);
      setProducaoDoDia([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducao();
  }, []);

  const existeProducaoAberta = producaoDoDia.some(
    (p) => p.status !== "FINALIZADO"
  );

  const handleCreateProducao = async (e) => {
    e.preventDefault();

    const payload = {
      data: new Date().toISOString().split("T")[0],
      observacao: observacao || "",
      // Você pode querer adicionar um status inicial aqui, ex: status: "RASGELHO"
    };

    try {
      await api.post("/api/producao/", payload);
      setShowModal(false);
      setObservacao("");
      fetchProducao();
    } catch (error) {
      console.error("Erro ao criar produção:", error);
      alert("Erro ao criar produção.");
    }
  };

  const handleCardClick = (id) => {
    navigate(`/producao/${id}`);
  };

  // =======================
  // GRAFICO — ESTOQUE
  // =======================
  const CACHE_KEY = "grafico_estoque_cache_v1";
  const FIVE_MIN = 5 * 60 * 1000;

  async function fetchEstoque(force = false) {
    try {
      setGraficoLoading(true);

      const cache = localStorage.getItem(CACHE_KEY);
      const now = Date.now();

      if (!force && cache) {
        const parsed = JSON.parse(cache);
        if (parsed.ts && now - parsed.ts < FIVE_MIN) {
          setEstoqueData(parsed.data);
          setGraficoLoading(false);
          return;
        }
      }

      const res = await api.get("/api/estoque/produtos");

      const produtosNormalizados = res.data.map((p) => ({
        id: p.id,
        nome: p.nome,
        codigo: p.codigo,
        estoque: Number(String(p.estoque_atual).replace(",", ".")),
      }));

      // Ordena do menor para o maior estoque e pega os top 10
      const ordenados = [...produtosNormalizados].sort(
        (a, b) => a.estoque - b.estoque
      );

      const topN = ordenados.slice(0, 10);

      const chartData = topN.map((p) => ({
        id: p.id,
        name: `${p.codigo} - ${p.nome}`,
        estoque: p.estoque,
      }));

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: now, data: chartData })
      );

      setEstoqueData(chartData);
    } catch (err) {
      console.error("Erro ao buscar estoque:", err);
    } finally {
      setGraficoLoading(false);
    }
  }

  useEffect(() => {
    fetchEstoque();

    const interval = setInterval(() => {
      fetchEstoque();
    }, FIVE_MIN);

    return () => clearInterval(interval);
  }, []);

  // Função auxiliar para renderizar o status
  const renderStatus = (status) => {
    const statusClass = status.toLowerCase().replace(/ /g, '_');
    return (
      <span className={`status status-${statusClass}`}>
        {status}
      </span>
    );
  };

  // =======================
  // RENDER
  // =======================
  return (
    <div className="layout">
      <Sidebar />

      <div className="content">
        <Navbar title="Dashboard de Produção" />
        <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                ➕ Iniciar Nova Produção
        </button>
        <div className="page-content">

          {/* BOTÃO FLUTUANTE (Novo: fora do grid para destaque) */}
          <div style={{ marginBottom: "25px", display: 'flex', justifyContent: 'flex-end' }}>
            {/* Exibe o botão Nova Produção se não houver produção ou se a produção existente estiver FINALIZADA */}
            {!loading && (!existeProducaoAberta || producaoDoDia.length === 0) && (
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
              >
                ➕ Iniciar Nova Produção
              </button>
            )}
          </div>

          <div className="dashboard-grid">

            {/* ---------------- COLUNA 1: PRODUÇÃO DO DIA ---------------- */}
            <section className="producao-section">
              <h2 className="section-title">Produção de Hoje ({producaoDoDia.length})</h2>

              {loading ? (
                <p className="sem-registros">Carregando registros...</p>
              ) : producaoDoDia.length === 0 ? (
                <div className="sem-registros">
                  <p>Nenhum lote de produção iniciado hoje.</p>
                  <p className="hint">Clique em "Iniciar Nova Produção" acima para começar.</p>
                </div>
              ) : (
                <div className="lista-producao">
                  {producaoDoDia.map((item) => (
                    <div
                      key={item.id}
                      className="card-producao card-clickable"
                      onClick={() => handleCardClick(item.id)}
                    >
                      <h3>Lote: {new Date(item.data).toLocaleDateString("pt-BR")}</h3>

                      <p style={{ marginTop: '8px' }}>
                        <strong>Status:</strong> {renderStatus(item.status)}
                      </p>

                      {item.observacao && (
                        <p style={{ marginTop: '6px', fontSize: '14px', color: 'var(--muted)' }}>
                          Obs: {item.observacao.substring(0, 30)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ---------------- COLUNA 2: GRÁFICO DE ESTOQUE ---------------- */}
            <section className="grafico-section">
              <h2 className="section-title">📉 Produtos com Menor Estoque (Top 10)</h2>

              <div className="grafico-container">
                {graficoLoading ? (
                  <p>Carregando gráfico de estoque...</p>
                ) : estoqueData.length === 0 ? (
                  <p>Nenhum dado de estoque disponível.</p>
                ) : (
                  <div className="grafico-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={estoqueData}
                        margin={{ top: 10, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                          height={90}
                          tick={{ fontSize: 10, fill: 'var(--text-dark)' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: 'var(--muted)' }}
                        />
                        <Tooltip
                          formatter={(v) => [v.toFixed(2), "Estoque"]}
                          labelStyle={{ color: 'var(--text-dark)' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-sm)' }}
                        />
                        <Bar dataKey="estoque" barSize={30}>
                          {/* Cores que escalam do estoque mais baixo para o menos baixo (visualização de risco) */}
                          {estoqueData.map((entry, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={idx < 3 ? '#e74c3c' : '#f39c12'} // Vermelho para os 3 mais críticos, Laranja para o resto
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ------------------ MODAL ------------------ */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Novo Registro de Produção</h2>

            <form onSubmit={handleCreateProducao}>
              <label>Data do Registro:</label>
              <input
                type="text"
                value={new Date().toLocaleDateString("pt-BR")}
                readOnly
                className="input-readonly"
              />

              <label>Observação (opcional):</label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Adicionar detalhes sobre o lote (turno, equipe, etc.)"
              ></textarea>

              <p className="hint" style={{ marginBottom: '20px' }}>Você será redirecionado para adicionar os itens após salvar.</p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn btn-primary">
                  Salvar e Iniciar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}