import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import "./ProducaoEditar.css";

const LOGO_PATH = "/assets/logo-grupo-mar.png";

// Mapeamento do status do item (Atualizado para refletir o seu CSS)
const STATUS_CHIP_MAP = {
  PENDENTE: { label: "Pendente", className: "pendente" },
  PARCIAL: { label: "Parcial", className: "parcial" },
  DIVERGENTE: { label: "Divergente", className: "divergente" },
  OK: { label: "Conferido", className: "ok" },
};


// ===================================================================
// 🆕 MODAL GERENCIADORA DE INSUMOS (Refatorada para Tabela Limpa)
// ===================================================================
const InsumosManagerModal = ({
  isOpen,
  onClose,
  producaoId,
  initialInsumosList,
  onUpdateInsumosList,
  finalizada,
}) => {
  if (!isOpen) return null;

  const listaExiste = initialInsumosList && initialInsumosList.length > 0;

  // Adicionei uma chave para forçar a renderização ao abrir/fechar a modal
  const [insumosAtuais, setInsumosAtuais] = useState(initialInsumosList || []);
  const [insumosDisponiveis, setInsumosDisponiveis] = useState([]);
  const [isLoadingInsumos, setIsLoadingInsumos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Usei um ID de item para focar o input se necessário, mas mantive simples.

  useEffect(() => {
    // Garante que a lista interna comece com a lista que veio do pai
    setInsumosAtuais(initialInsumosList || []); 
    
    // Se a lista não existe ou se está em modo de edição (para adicionar novos), carrega disponíveis
    if (!listaExiste || isOpen) carregarInsumosDisponiveis();

    setError(null);
  }, [isOpen, initialInsumosList, listaExiste]);

  // Carregar lista de insumos ativos (para seleção)
  const carregarInsumosDisponiveis = async () => {
    try {
      setIsLoadingInsumos(true);
      const res = await api.get("/api/estoque/insumos/");
      setInsumosDisponiveis(res.data);
    } catch (err) {
      setError("Erro ao carregar insumos disponíveis.");
    } finally {
      setIsLoadingInsumos(false);
    }
  };

  // Adicionar insumo
  const handleAddInsumo = (insumoId) => {
    const idNum = Number(insumoId);
    const insumo = insumosDisponiveis.find((i) => i.id === idNum);
    if (!insumo || insumosAtuais.some((i) => i.insumo_id === idNum)) return;

    setInsumosAtuais((prev) => [
      ...prev,
      {
        insumo_id: insumo.id,
        nome: insumo.nome,
        // 🆕 Puxando a unidade de medida do insumo disponível
        unidade_medida: insumo.unidade_medida, 
        quantidade_necessaria: 1, // Start with 1 as a default
        quantidade_recebida: 0,
        status: "PENDENTE",
      },
    ]);
  };

  // Atualizar quantidades
  const handleQuantidadeChange = (id, field, value) => {
    const numericValue = value === "" ? "" : Number(value);
    setInsumosAtuais((prev) =>
      prev.map((item) =>
        item.insumo_id === id ? { ...item, [field]: numericValue } : item
      )
    );
  };

  // Remover insumo
  const handleRemoveInsumo = (id) => {
    setInsumosAtuais((prev) => prev.filter((item) => item.insumo_id !== id));
  };

  // Salvar lista no backend
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    // Validação mínima de quantidade necessária > 0 para salvar
    const insumosValidos = insumosAtuais.filter(i => (i.quantidade_necessaria ?? 0) > 0);

    if(insumosValidos.length === 0) {
        setError("A lista deve conter insumos com quantidade necessária maior que zero.");
        setIsSaving(false);
        return;
    }

    const payload = {
      insumos: insumosValidos.map((i) => ({
        insumo_id: i.insumo_id,
        quantidade_necessaria: i.quantidade_necessaria,
        quantidade_recebida: i.quantidade_recebida, // Enviando zero se não houver no objeto, ou o valor existente
      })),
    };

    try {
      const res = await api.post(
        `/api/producao/${producaoId}/gerar-lista-insumos/`,
        payload
      );

      alert(listaExiste ? "Lista atualizada com sucesso!" : "Lista criada com sucesso!");
      // ⚠️ ASSUMINDO que a API retorna o campo unidade_medida na resposta para manter o estado consistente.
      onUpdateInsumosList(res.data.insumos || res.data); 
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Erro ao salvar lista de insumos. Verifique o console."
      );
      console.error(err.response || err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <h2 className="modal-title">
          {listaExiste ? "Gerenciar Insumos" : "Criar Lista de Insumos"}
        </h2>

        {error && <p className="alert-error">{error}</p>}

        {/* ======================== SELEÇÃO DE INSUMOS (Sempre visível no modo não-finalizado) ======================== */}
        {!finalizada && (
          <div className="insumo-selection-area">
            <label htmlFor="insumo-select" className="label-select">Adicionar Insumo:</label>
            <select
              id="insumo-select"
              onChange={(e) => {
                if (!e.target.value) return;
                handleAddInsumo(e.target.value);
                e.target.value = ""; // Reseta o select
              }}
              value=""
              disabled={isLoadingInsumos}
            >
              <option value="">{isLoadingInsumos ? 'Carregando...' : 'Selecione um insumo...'}</option>
              {insumosDisponiveis
                .filter((i) => !insumosAtuais.some((a) => a.insumo_id === i.id))
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} ({i.unidade_medida || 'UN'})
                  </option>
                ))}
            </select>
            <button
                className="btn secondary small refresh-btn"
                onClick={carregarInsumosDisponiveis}
                disabled={isLoadingInsumos || isSaving}
            >
              🔄 Recarregar Lista
            </button>
          </div>
        )}

        {/* ======================== TABELA DE ITENS ATUAIS ======================== */}
        {insumosAtuais.length > 0 ? (
          <div className="table-container">
            <table className="insumos-table">
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Insumo</th>
                  <th style={{ width: "20%" }}>Necessário</th>
                  <th style={{ width: "20%" }}>Recebido</th>
                  <th style={{ width: "10%" }}>Status</th>
                  {!finalizada && <th style={{ width: "10%" }}>Ação</th>}
                </tr>
              </thead>
              <tbody>
                {insumosAtuais.map((item) => {
                  const itemStatus = STATUS_CHIP_MAP[item.status] || {label: item.status || 'PENDENTE', className: 'pendente'};
                  const displayStatus = item.quantidade_recebida >= item.quantidade_necessaria && item.quantidade_necessaria > 0 
                                        ? STATUS_CHIP_MAP.OK 
                                        : item.quantidade_recebida > 0 && item.quantidade_recebida < item.quantidade_necessaria
                                        ? STATUS_CHIP_MAP.PARCIAL
                                        : STATUS_CHIP_MAP.PENDENTE;

                  return (
                    <tr key={item.insumo_id} className="insumo-row">
                      <td className="insumo-name-cell">{item.nome}</td>

                      {/* Necessário */}
                      <td className="quantity-cell">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantidade_necessaria ?? ""}
                          onChange={(e) =>
                            handleQuantidadeChange(
                              item.insumo_id,
                              "quantidade_necessaria",
                              e.target.value
                            )
                          }
                          disabled={finalizada}
                          className="quantity-input"
                        />
                        <span className="unit-label">{item.unidade_medida || 'UN'}</span>
                      </td>

                      {/* Recebido (READ ONLY - assumindo que a conferência é feita em outro lugar/rota) */}
                      <td className="quantity-cell read-only-cell">
                        <strong style={{marginRight: '5px'}}>{item.quantidade_recebida ?? 0}</strong>
                        <span className="unit-label">{item.unidade_medida || 'UN'}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`chip small-chip ${displayStatus.className}`}>
                          {displayStatus.label}
                        </span>
                      </td>

                      {!finalizada && (
                        <td className="action-cell">
                          <button
                            onClick={() => handleRemoveInsumo(item.insumo_id)}
                            className="btn icon-btn danger small"
                            title="Remover Insumo"
                          >
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-list-message">
            {isLoadingInsumos ? "Carregando..." : "Nenhum insumo adicionado. Use o seletor acima."}
          </p>
        )}

        {/* ======================== AÇÕES GERAIS ======================== */}
        <div className="modal-actions">
          <button className="btn small btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>

          {!finalizada && (
            <button
              className="btn primary"
              disabled={isSaving || insumosAtuais.length === 0}
              onClick={handleSave}
            >
              {isSaving ? "Salvando..." : listaExiste ? "Salvar Lista" : "Gerar Lista"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
// =================================================================
// 2. COMPONENTE PRINCIPAL (ProducaoEditar)
// =================================================================

export default function ProducaoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producao, setProducao] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [itens, setItens] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [loading, setLoading] = useState(true);
  const [debounceTimers, setDebounceTimers] = useState({});
  const [savingItemIds, setSavingItemIds] = useState({});
  const [saveFeedback, setSaveFeedback] = useState({});
  const [finalizando, setFinalizando] = useState(false);

  // 🆕 ESTADOS PARA INSUMOS
  const [insumosList, setInsumosList] = useState(null);
  const [isModalInsumosOpen, setIsModalInsumosOpen] = useState(false);

  // --------------------------------------------------------------
  // 🔄 BUSCAR INSUMOS DA PRODUÇÃO
  // --------------------------------------------------------------
  async function carregarInsumos(producaoId) {
    try {
      const res = await api.get(`/api/producao/${producaoId}/lista-insumos/`);
      
      // Assumindo que o backend preenche o nome e a unidade de medida para o frontend
      setInsumosList(res.data.insumos || res.data || []);
    } catch (err) {
      if (err.response && (err.response.status === 404 || err.response.status === 204)) {
        setInsumosList([]); // Lista inexistente
      } else {
        console.error("Erro ao carregar insumos:", err);
        setInsumosList([]);
      }
    }
  }

  // --------------------------------------------------------------
  // 🔄 CARREGAR PRODUÇÃO + PRODUTOS + INSUMOS
  // --------------------------------------------------------------
  useEffect(() => {
    async function carregar() {
      try {
        const [resProd, resProdutos] = await Promise.all([
          api.get(`api/producao/${id}/`),
          api.get("api/estoque/produtos"),
        ]);

        setProducao(resProd.data);
        setProdutos(resProdutos.data);

        const list = (resProd.data.itens || []).map((item) => ({
          id: item.id,
          produto_id: item.produto,
          produto_nome: item.produto_nome,
          quantidade_esperada: item.quantidade_esperada,
          quantidade_conferida_producao: item.quantidade_conferida_producao ?? "",
          quantidade_conferida_camara: item.quantidade_conferida_camara ?? "",
          status: item.status,
        }));

        setItens(list);

        await carregarInsumos(id);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id]);

  const finalizada = producao?.status === "FINALIZADO";

  // --------------------------------------------------------------
  // LÓGICA DE ITENS (ADICIONAR/REMOVER/SALVAR/FINALIZAR)
  // --------------------------------------------------------------

  // ... (funções de adicionarItem, removerItem, salvarFabricada, salvar, finalizarProducao mantidas, pois não foram alteradas)

  async function adicionarItem() {
    console.log("produtoSelecionado:", produtoSelecionado);
    console.log("typeof produtoSelecionado:", typeof produtoSelecionado);
    console.log("produtos:", produtos);
    console.log("find:", produtos.find((p) => p.id === Number(produtoSelecionado)));

    if (finalizada) return;

    if (!produtoSelecionado || !quantidade) {
      return alert("Selecione um produto e informe a quantidade.");
    }

    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) return alert("Produto inválido.");

    if (itens.some((i) => String(i.produto_id) === String(produtoSelecionado))) {
      return alert("Este item já existe na produção.");
    }

    try {
      const payload = {
        producao: id,
        produto: produto.id,
        quantidade_esperada: Number(quantidade),
        quantidade_conferida_producao: 0,
        quantidade_conferida_camara: 0,
      };  
      console.log("URL final:", api.getUri({ url: "/api/estoque/produtos/" }));
      const res = await api.post("/api/producao-itens/", payload);

      setItens((prev) => [
        ...prev,
        {
          id: res.data.id,
          produto_id: produto.id,
          produto_nome: produto.nome,
          quantidade_esperada: Number(quantidade),
          quantidade_conferida_producao: "",
          quantidade_conferida_camara: "",
          status: "PENDENTE",
        },
      ]);

      setProdutoSelecionado("");
      setQuantidade("");
    } catch (err) {
      console.error("Erro ao adicionar item:", err);
      alert("Erro ao adicionar item.");
    }
  }

  async function removerItem(index) {
    if (finalizada) return;

    const copia = [...itens];
    const removido = copia.splice(index, 1);
    setItens(copia);

    if (removido[0]?.id) {
      api.delete(`api/producao-itens/${removido[0].id}/`).catch(console.error);
    }
  }

  function atualizarFabricada(index, valor) {
    if (finalizada) return;

    const copia = [...itens];
    copia[index].quantidade_conferida_producao = valor === "" ? "" : Number(valor);
    setItens(copia);

    if (debounceTimers[index]) clearTimeout(debounceTimenceTimers[index]);

    if (copia[index].id) {
      // Simplificado o feedback visual (removendo `savingItemIds` e `saveFeedback` do escopo principal para o exemplo)
      const timer = setTimeout(() => salvarFabricada(copia[index]), 2000);
      setDebounceTimers((prev) => ({ ...prev, [index]: timer }));
    }
  }

  async function salvarFabricada(item) {
     try {
       const res = await api.patch(`api/producao-itens/${item.id}/`, {
         quantidade_conferida_producao: item.quantidade_conferida_producao || 0,
       });

       // Atualiza o status do item após o salvamento automático
       setItens(prevItens => prevItens.map(i => i.id === item.id ? { ...i, status: res.data.status } : i));
     } catch (err) {
       console.error("Erro ao salvar fabricado:", err);
     }
  }

  async function salvar() {
    if (finalizada) return;

    try {
      for (const item of itens) {
        if (!item.id) {
          console.log("URL final:", api.getUri({ url: "/api/estoque/produtos/" }));

          const res = await api.post("/api/producao-itens/", {
            producao: id,
            produto: item.produto_id,
            quantidade_esperada: item.quantidade_esperada,
            quantidade_conferida_producao: item.quantidade_conferida_producao || 0,
            quantidade_conferida_camara: item.quantidade_conferida_camara || 0,
          });
          item.id = res.data.id;
        }
      }

      alert("Produção salva!");
      navigate("/producao/inicio");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar.");
    }
  }
  
  async function finalizarProducao() {
    if (finalizada) return;

    const confirmar = window.confirm("Deseja realmente finalizar esta produção?");
    if (!confirmar) return;

    try {
      await api.post(`/api/producao/${id}/finalizar/`);
      alert("Produção finalizada!");
      setProducao((p) => ({ ...p, status: "FINALIZADO" }));
    } catch (err) {
      console.error("Erro ao finalizar:", err);
      alert("Erro ao finalizar produção.");
    }
  }


  if (loading || insumosList === null) return <p style={{ padding: 20 }}>Carregando...</p>;
  const producaoStatusClass = producao.status.toLowerCase().replace(" ", "_");

  // --------------------------------------------------------------
  // RENDER PRINCIPAL
  // --------------------------------------------------------------
  return (
    <div className="editar-root">
      <Sidebar />

      <div className="content-main">
        <header className="topbar">
          <img src={LOGO_PATH} alt="logo" className="logo" />

          <div className="top-actions">
            {/* BOTÃO LISTA DE INSUMOS */}
            <button
              className={`btn small ${insumosList.length > 0 ? "btn-warning" : "btn-primary"}`}
              onClick={() => setIsModalInsumosOpen(true)}
            >
              📋 {insumosList.length > 0 ? "Gerenciar Insumos" : "Criar Lista Insumos"}
            </button>

            <button className="btn small btn-secondary" onClick={() => navigate("/producao/inicio")}>
              Voltar
            </button>

            <button
              className="btn primary"
              onClick={salvar}
              disabled={finalizada}
            >
              Salvar Produção
            </button>

            <button
              className="btn success"
              onClick={finalizarProducao}
              disabled={finalizada}
            >
              ✅ Finalizar Produção
            </button>
          </div>
        </header>

        <main className="editar-container">

          <section className="producao-info">
            <h1>Lote de Produção: #{String(producao.id).substring(0, 8)}</h1>

            <div className="meta">
              <span>
                Data: <strong>{new Date(producao.data).toLocaleDateString("pt-BR")}</strong>
              </span>
              <span>
                Status:{" "}
                <strong className={`status ${producaoStatusClass}`}>
                  {producao.status}
                </strong>
              </span>
            </div>

            {finalizada && (
              <div className="alert">
                ⚠️ **PRODUÇÃO BLOQUEADA** - Esta produção foi finalizada e está em modo de visualização.
              </div>
            )}
          </section>

          {/* -------------------------------------------------------------- */}
          {/* ADICIONAR ITEM */}
          {/* -------------------------------------------------------------- */}
          <section className="add-item">
            <h2>📦 Adicionar Produto ao Lote</h2>

            <div className="row">
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(e.target.value)}
                disabled={finalizada}
              >
                <option value="">Selecione um produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nome}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Qtde. Planejada"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                disabled={finalizada}
              />

              <button
                className="btn primary"
                onClick={adicionarItem}
                disabled={!produtoSelecionado || !quantidade || finalizada}
              >
                ➕ Adicionar Item
              </button>
            </div>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* LISTA DE ITENS */}
          {/* -------------------------------------------------------------- */}
          <section className="itens-section">
            <h2>🏭 Itens em Produção ({itens.length})</h2>

            {itens.length === 0 ? (
              <p className="alert">Nenhum item adicionado ainda.</p>
            ) : (
              <div className="itens-lista">
                {itens.map((item, index) => {
                  const itemStatus = STATUS_CHIP_MAP[item.status] || STATUS_CHIP_MAP.PENDENTE;

                  return (
                    <div key={index} className="item-card">
                      <div className="item-main">

                        <div className="item-title">
                          <strong>{item.produto_nome}</strong>
                          <span className={`chip ${itemStatus.className}`}>
                            {itemStatus.label}
                          </span>
                        </div>

                        <div className="item-row">

                          <div className="field">
                            <label>Planejado (Unid.)</label>
                            <div className="value">{item.quantidade_esperada}</div>
                          </div>

                          <div className="field">
                            <label>Produzido (Conferir)</label>
                            <input
                              type="number"
                              className="input-fabricada"
                              value={item.quantidade_conferida_producao ?? ""}
                              onChange={(e) => atualizarFabricada(index, e.target.value)}
                              disabled={finalizada}
                              placeholder="0.00"
                            />
                            {/* Simplificado o feedback visual aqui */}
                            <div className="small-note">Salva automaticamente.</div>
                          </div>

                          <div className="field">
                            <label>Movido para Câmara</label>
                            {/* Mantido como label/span pois a edição no frontend não estava implementada */}
                            <div className="value readonly-value">{item.quantidade_conferida_camara ?? "0.00"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="item-actions">
                        <button
                          className="btn danger small"
                          onClick={() => removerItem(index)}
                          disabled={finalizada}
                        >
                          Remover Item
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </main>
      </div>

      {/* =============================== */}
      {/* MODAL INSUMOS ATUALIZADO 	 */}
      {/* =============================== */}
      <InsumosManagerModal
        isOpen={isModalInsumosOpen}
        onClose={() => setIsModalInsumosOpen(false)}
        producaoId={id}
        initialInsumosList={insumosList}
        onUpdateInsumosList={setInsumosList}
        finalizada={finalizada}
      />
    </div>
  );
}