import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import api from "../../services/api";
import "./EntradaInsumos.css";

export default function EntradaInsumos() {
  const [insumos, setInsumos] = useState([]);
  const [itens, setItens] = useState([]);
  const [nfNumero, setNfNumero] = useState("");
  const [loading, setLoading] = useState(false);

  // Carrega todos os insumos
  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get("/api/estoque/insumos");
        setInsumos(res.data);
      } catch (err) {
        console.log("Erro ao carregar insumos:", err);
      }
    }
    carregar();
  }, []);

  // Adiciona item ao formulário
  function adicionarItem() {
    setItens([...itens, { id: "", quantidade: "" }]);
  }

  // Atualiza item individual
  function atualizarItem(index, campo, valor) {
    const lista = [...itens];
    lista[index][campo] = valor;
    setItens(lista);
  }

  // Remove linha
  function removerItem(index) {
    const lista = itens.filter((_, i) => i !== index);
    setItens(lista);
  }

  // Enviar dados para API
  async function enviarEntrada() {
    if (!nfNumero) {
      alert("Informe o número da NF.");
      return;
    }

    if (itens.length === 0) {
      alert("Adicione pelo menos um insumo.");
      return;
    }

    const payload = {
      nf_numero: nfNumero,
      insumos: itens.map((i) => ({
        id: Number(i.id),
        quantidade: Number(i.quantidade),
      })),
    };

    setLoading(true);

    try {
      await api.post(
        "/api/estoque/entrada/entrada-multipla/",
        payload
      );

      alert("Entrada registrada com sucesso!");
      setItens([]);
      setNfNumero("");
    } catch (err) {
      console.log("Erro ao registrar entrada:", err);
      alert("Erro ao registrar entrada.");
    }

    setLoading(false);
  }

  return (
    <div className="estoque-layout">
      <Sidebar />

      <div className="estoque-main">
        <Navbar />

        <h2 className="estoque-title">Entrada de Insumos</h2>

        <div className="entrada-card">
          {/* Número da NF */}
          <div className="nf-box">
            <label>Número da Nota Fiscal:</label>
            <input
              type="text"
              placeholder="Digite o número da NF"
              value={nfNumero}
              onChange={(e) => setNfNumero(e.target.value)}
            />
          </div>

          {/* Tabela de itens */}
          <table className="entrada-table">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Quantidade</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {itens.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select
                      value={item.id}
                      onChange={(e) =>
                        atualizarItem(index, "id", e.target.value)
                      }
                    >
                      <option value="">Selecione</option>
                      {insumos.map((ins) => (
                        <option key={ins.id} value={ins.id}>
                          {ins.nome}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantidade}
                      onChange={(e) =>
                        atualizarItem(index, "quantidade", e.target.value)
                      }
                      placeholder="Qtd"
                    />
                  </td>

                  <td>
                    <button
                      className="btn-remove"
                      onClick={() => removerItem(index)}
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="btn-add" onClick={adicionarItem}>
            + Adicionar Insumo
          </button>

          <button
            className="btn-submit"
            onClick={enviarEntrada}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Registrar Entrada"}
          </button>
        </div>
      </div>
    </div>
  );
}
