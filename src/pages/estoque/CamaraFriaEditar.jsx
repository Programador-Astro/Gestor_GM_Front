// CamaraFriaEditar.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import "./CamaraFriaEditar.css";

const LOGO_PATH = "/assets/logo-grupo-mar.png";

const STATUS_CHIP_MAP = {
  PENDENTE: { label: "Pendente", className: "pendente" },
  PARCIAL: { label: "Parcial", className: "parcial" },
  COMPLETO: { label: "Completo", className: "ok" },
};

export default function CamaraFriaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producao, setProducao] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal insumos
  const [mostrarModalInsumos, setMostrarModalInsumos] = useState(false);
  const [insumosProducao, setInsumosProducao] = useState([]);
  const [loadingInsumos, setLoadingInsumos] = useState(false);

  // envio / debounce
  const pendingTimersRef = useRef({}); // { [insumo_id]: timeoutId }
  const pendingDeltaRef = useRef({}); // { [insumo_id]: accumulatedDelta }
  const [sendingMap, setSendingMap] = useState({}); // flags visual { [insumo_id]: true/false }

  // feedback câmara
  const [debounceTimers, setDebounceTimers] = useState({});
  const [savingItemIds, setSavingItemIds] = useState({});
  const [saveFeedback, setSaveFeedback] = useState({});

  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get(`api/producao/${id}/`);
        setProducao(res.data);

        const itensAjustados = (res.data.itens || []).map((item) => ({
          id: item.id,
          produto_id: item.produto,
          produto_nome: item.produto_nome,
          quantidade_esperada: item.quantidade_esperada,
          quantidade_conferida_producao: item.quantidade_conferida_producao,
          quantidade_conferida_camara: item.quantidade_conferida_camara ?? "",
          status: item.status,
        }));

        setItens(itensAjustados);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [id]);

  const finalizada = producao && producao.status === "FINALIZADO";

  // ===============================
  // MODAL: carregar insumos da produção
  // ===============================
  useEffect(() => {
    if (mostrarModalInsumos) carregarInsumosProducao();
    // cleanup timers when modal closes
    return () => {
      // clear any pending timers
      Object.values(pendingTimersRef.current || {}).forEach((t) => clearTimeout(t));
      pendingTimersRef.current = {};
      pendingDeltaRef.current = {};
    };
  }, [mostrarModalInsumos]);

  async function carregarInsumosProducao() {
    try {
      setLoadingInsumos(true);
      const res = await api.get(`/api/producao/${id}/lista-insumos/`);
      // ensure array & normalize numbers
      const data = (res.data?.insumos || []).map((it) => ({
        id: it.id,
        insumo_id: it.insumo_id,
        nome: it.nome,
        quantidade_necessaria: Number(it.quantidade_necessaria ?? 0),
        quantidade_recebida: Number(it.quantidade_recebida ?? 0),
        unidade_medida: it.unidade_medida || it.unidade || "", // try fields
        status: it.status || (Number(it.quantidade_recebida ?? 0) >= Number(it.quantidade_necessaria ?? 0) ? "COMPLETO" : (Number(it.quantidade_recebida ?? 0) > 0 ? "PARCIAL" : "PENDENTE")),
      }));
      setInsumosProducao(data);
    } catch (err) {
      console.error("Erro ao carregar insumos:", err);
      setInsumosProducao([]);
    } finally {
      setLoadingInsumos(false);
    }
  }

  // ===============================
  // FUNÇÕES AUTO-SAVE CÂMARA (seu antigo)
  // ===============================
  function atualizarCamera(index, valor) {
    if (finalizada) return;

    const copia = [...itens];
    copia[index].quantidade_conferida_camara = valor === "" ? "" : Number(valor);
    setItens(copia);

    const key = `cam-${index}`;
    if (debounceTimers[key]) clearTimeout(debounceTimers[key]);

    if (copia[index].id) {
      const timer = setTimeout(() => salvarCamera(copia[index]), 2000);
      setDebounceTimers((prev) => ({ ...prev, [key]: timer }));
    }
  }

  async function salvarCamera(item) {
    const key = `cam-${item.id}`;
    setSavingItemIds((s) => ({ ...s, [key]: true }));
    setSaveFeedback((f) => ({ ...f, [key]: "SAVING" }));

    try {
      const res = await api.patch(`api/producao-itens/${item.id}/`, {
        quantidade_conferida_camara: item.quantidade_conferida_camara || 0,
      });

      setItens((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: res.data.status } : i))
      );

      setSaveFeedback((f) => ({ ...f, [key]: "SAVED" }));
      setTimeout(() => {
        setSaveFeedback((f) => ({ ...f, [key]: null }));
      }, 2500);
    } catch (err) {
      console.error("Erro ao salvar quantidade da câmara:", err);
    } finally {
      setSavingItemIds((s) => ({ ...s, [key]: false }));
    }
  }

  const renderFeedback = (itemId) => {
    const key = `cam-${itemId}`;
    const isSaving = savingItemIds[key];
    const feedbackStatus = saveFeedback[key];

    if (isSaving)
      return (
        <div className="small-note saving">
          <span className="spin">🔄</span> Salvando...
        </div>
      );

    if (feedbackStatus === "SAVED") return <div className="small-note saved">✓ Salvo!</div>;

    return <div className="small-note">Digitar salva automaticamente.</div>;
  };

  // ===============================
  // INSUMOS: increment / decrement com debounce 1s e POST incremental
  // ===============================
  // cada insumo tem:
  // { insumo_id, nome, quantidade_necessaria, quantidade_recebida, unidade_medida, status }

  // local increment (aplica visualmente) — não modifica 'quantidade_recebida' definitiva até envio bem-sucedido.
  function adjustPending(insumo_id, delta) {
    if (finalizada) return;

    // update pending delta
    const curPending = pendingDeltaRef.current[insumo_id] || 0;
    const nextPending = curPending + delta;
    pendingDeltaRef.current[insumo_id] = nextPending;

    // update UI: show a preview by temporarily incrementing quantidade_recebida shown as quantidade_recebida + pending
    setInsumosProducao((prev) =>
      prev.map((it) =>
        it.insumo_id === insumo_id
          ? { ...it, _preview_recebida: (it.quantidade_recebida || 0) + nextPending }
          : it
      )
    );

    // schedule send with debounce 1000ms
    if (pendingTimersRef.current[insumo_id]) {
      clearTimeout(pendingTimersRef.current[insumo_id]);
    }
    pendingTimersRef.current[insumo_id] = setTimeout(() => {
      flushPending(insumo_id);
    }, 1000);
  }

  // envia o delta acumulado para o backend e aplica no estado local
  async function flushPending(insumo_id) {
    const delta = pendingDeltaRef.current[insumo_id];
    if (!delta || delta === 0) {
      // nothing to send
      pendingDeltaRef.current[insumo_id] = 0;
      pendingTimersRef.current[insumo_id] = null;
      return;
    }

    // lock UI for this insumo
    setSendingMap((s) => ({ ...s, [insumo_id]: true }));

    // clear pending timer
    if (pendingTimersRef.current[insumo_id]) {
      clearTimeout(pendingTimersRef.current[insumo_id]);
      pendingTimersRef.current[insumo_id] = null;
    }

    // prepare payload (send delta as number)
    const quantidadeEnviar = Number(delta);

    try {
      const res = await api.post(
        `/api/producao/${id}/insumo/${insumo_id}/fornecer/`,
        { quantidade: quantidadeEnviar }
      );

      // Backend ideally returns updated quantidade_recebida; fallback to local sum
      const returned = res.data || {};
      const novaRecebidaFromBackend = returned.quantidade_recebida !== undefined ? Number(returned.quantidade_recebida) : null;

      setInsumosProducao((prev) =>
        prev.map((it) => {
          if (it.insumo_id !== insumo_id) return it;
          const base = Number(it.quantidade_recebida || 0);
          const novaRecebida = novaRecebidaFromBackend !== null ? novaRecebidaFromBackend : base + quantidadeEnviar;
          // determine status
          let novoStatus = it.status || "PENDENTE";
          if (novaRecebida >= Number(it.quantidade_necessaria || 0) && Number(it.quantidade_necessaria || 0) > 0) {
            novoStatus = "COMPLETO";
          } else if (novaRecebida > 0) {
            novoStatus = "PARCIAL";
          } else {
            novoStatus = "PENDENTE";
          }
          return {
            ...it,
            quantidade_recebida: novaRecebida,
            _preview_recebida: undefined,
            status: novoStatus,
          };
        })
      );

      // reset pending
      pendingDeltaRef.current[insumo_id] = 0;
    } catch (err) {
      console.error("Erro ao fornecer insumo:", err);
      // keep pending delta (so it can retry on next adjust or modal close/open)
      // optionally, you may show an error flag in UI
    } finally {
      setSendingMap((s) => ({ ...s, [insumo_id]: false }));
      pendingDeltaRef.current[insumo_id] = 0;
      pendingTimersRef.current[insumo_id] = null;
    }
  }

  // helper: display quantidade_recebida com preview if any
  function displayRecebida(it) {
    if (it._preview_recebida !== undefined) return it._preview_recebida;
    return it.quantidade_recebida ?? 0;
  }

  // ===============================
  // SALVAR INSUMOS (manualmente) — caso queira submeter lista inteira
  // Usado apenas para criar/atualizar lista completa via gerar-lista-insumos/
  // ===============================
  async function salvarInsumosManualmente() {
    if (finalizada) return;
    try {
      const payload = {
        insumos: insumosProducao.map((i) => ({
          insumo_id: i.insumo_id,
          quantidade_necessaria: Number(i.quantidade_necessaria || 0),
          // quantidade_recebida será manipulado via fornecer endpoint, então aqui podemos manter 0
        })),
      };
      await api.post(`/api/producao/${id}/gerar-lista-insumos/`, payload);
      await carregarInsumosProducao();
      alert("Lista de insumos salva/atualizada.");
    } catch (err) {
      console.error("Erro ao salvar lista de insumos:", err);
      alert("Erro ao salvar lista de insumos.");
    }
  }

  // ===============================
  // RENDER
  // ===============================
  if (loading) return <p style={{ padding: 20 }}>Carregando...</p>;

  const producaoStatusClass = producao.status.toLowerCase().replace(" ", "_");

  return (
    <div className="editar-root">
      <Sidebar />

      <div className="content-main">
        <header className="topbar">
          <img src={LOGO_PATH} alt="logo" className="logo" />

          <div className="top-actions">
            <button className="btn small btn-primary" onClick={() => setMostrarModalInsumos(true)}>
              Insumos da Produção
            </button>

            <button className="btn small btn-secondary" onClick={() => navigate("/camara-fria")}>
              Voltar
            </button>
          </div>
        </header>

        <main className="editar-container">
          <section className="producao-info">
            <h1>Conferência de Câmara — Lote {String(producao.id).substring(0, 8)}</h1>

            <div className="meta">
              <span>
                Data: <strong>{new Date(producao.data).toLocaleDateString("pt-BR")}</strong>
              </span>

              <span>
                Status: <strong className={`status ${producaoStatusClass}`}>{producao.status}</strong>
              </span>
            </div>

            {finalizada && <div className="alert">⚠️ Produção finalizada — conferência bloqueada.</div>}
          </section>

          <section className="itens-section">
            <h2>Itens para Conferência ({itens.length})</h2>

            <div className="itens-lista">
              {itens.map((item, index) => {
                const itemStatus = STATUS_CHIP_MAP[item.status] || { label: item.status || "Indefinido", className: "" };
                return (
                  <div key={index} className="item-card">
                    <div className="item-main">
                      <div className="item-title">
                        <strong>{item.produto_nome}</strong>
                        <span className={`chip ${itemStatus.className}`}>{itemStatus.label}</span>
                      </div>

                      <div className="item-row">
                        <div className="field">
                          <label>Planejado</label>
                          <div className="value">{item.quantidade_esperada}</div>
                        </div>

                        <div className="field">
                          <label>Produção</label>
                          <div className="value">{item.quantidade_conferida_producao}</div>
                        </div>

                        <div className="field">
                          <label>Câmara Fria</label>
                          <input
                            type="number"
                            className="input-camara"
                            value={item.quantidade_conferida_camara}
                            onChange={(e) => atualizarCamera(index, e.target.value)}
                            disabled={finalizada}
                            placeholder="Qtde. conferida"
                          />
                          {renderFeedback(item.id)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      {mostrarModalInsumos && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: 900 }}>
            <h2>Insumos da Produção</h2>

            {loadingInsumos ? (
              <p>Carregando...</p>
            ) : (
              <>
                <table className="tabela-insumos" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px" }}>Insumo</th>
                      <th style={{ padding: "8px" }}>Necessário</th>
                      <th style={{ padding: "8px" }}>Já Fornecido</th>
                      <th style={{ padding: "8px" }}>Enviar</th>
                      <th style={{ padding: "8px" }}>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {insumosProducao.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: 12 }}>
                          Nenhum insumo cadastrado para esta produção.
                        </td>
                      </tr>
                    )}

                    {insumosProducao.map((insumo) => {
                      const exibido = displayRecebida(insumo);
                      const sending = !!sendingMap[insumo.insumo_id];
                      const statusLabel = STATUS_CHIP_MAP[insumo.status] || { label: insumo.status || "Indefinido", className: "" };

                      return (
                        <tr key={insumo.insumo_id}>
                          <td style={{ padding: 8 }}>
                            {insumo.nome}{" "}
                            {insumo.unidade_medida ? <small>({insumo.unidade_medida})</small> : null}
                          </td>

                          <td style={{ padding: 8 }}>
                            {insumo.quantidade_necessaria}
                          </td>

                          <td style={{ padding: 8, textAlign: "center" }}>
                            <strong>{exibido}</strong>
                          </td>

                          <td style={{ padding: 8, textAlign: "center" }}>
                            <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                              <button
                                className="btn small"
                                onClick={() => adjustPending(insumo.insumo_id, -1)}
                                disabled={finalizada || sending}
                                aria-label={`Diminuir ${insumo.nome}`}
                                title="Diminuir 1"
                              >
                                −
                              </button>

                              <button
                                className="btn small primary"
                                onClick={() => adjustPending(insumo.insumo_id, +1)}
                                disabled={finalizada || sending}
                                aria-label={`Adicionar ${insumo.nome}`}
                                title="Adicionar 1"
                              >
                                +
                              </button>

                              {sending && <span style={{ marginLeft: 8 }}>🔄 Enviando...</span>}
                            </div>
                          </td>

                          <td style={{ padding: 8 }}>
                            <span className={`chip ${statusLabel.className}`}>{statusLabel.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                  <button className="btn small btn-secondary" onClick={() => setMostrarModalInsumos(false)}>
                    Fechar
                  </button>

                  {!finalizada && (
                    <button className="btn small btn-primary" onClick={salvarInsumosManualmente}>
                      Salvar Lista (substituir)
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
