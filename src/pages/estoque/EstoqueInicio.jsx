// src/pages/Estoque/EstoqueInicio.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import api from "../../services/api";
import "./EstoqueInicio.css";

export default function EstoqueInicio() {
  const [insumos, setInsumos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [producoes, setProducoes] = useState([]);

  function calcularCriticidade(item) {
    const atual = Number(item.estoque_atual);
    const ideal = Number(item.estoque_ideal);

    if (ideal === 0) {
      return atual > 0 ? 1 : 0;
    }
    return atual / ideal;
  }

  useEffect(() => {
    async function carregarDados() {
      try {
        const resInsumos = await api.get("/api/estoque/insumos");
        const resProdutos = await api.get("/api/estoque/produtos");
        const resProducao = await api.get("/api/producao/");

        // 🔥 Ordenar insumos por criticidade (menor → maior)
        const insumosOrdenados = resInsumos.data
          .sort((a, b) => calcularCriticidade(a) - calcularCriticidade(b))
          .slice(0, 5);

        // 🔥 Ordenar produtos por criticidade
        const produtosOrdenados = resProdutos.data
          .sort((a, b) => calcularCriticidade(a) - calcularCriticidade(b))
          .slice(0, 5);

        setInsumos(insumosOrdenados);
        setProdutos(produtosOrdenados);

        // 🔥 Filtrar produções NÃO finalizadas
        const producoesAbertas = resProducao.data
          .filter((p) => p.status !== "FINALIZADO")
          .sort((a, b) => new Date(b.data) - new Date(a.data)); // produção do dia primeiro

        setProducoes(producoesAbertas);
      } catch (err) {
        console.log("Erro:", err);
      }
    }

    carregarDados();
  }, []);

  return (
    <div className="estoque-layout">
      <Sidebar />

      <div className="estoque-main">
        <Navbar />

        {/* 🔥 NOVA SEÇÃO — PRODUÇÕES EM ABERTO */}
        <section className="producao-section">
          <h2 className="estoque-title">
            Produção de Hoje ({producoes.length})
          </h2>

          <div className="cards-producao-container">
            {producoes.length === 0 ? (
              <p>Nenhuma produção pendente.</p>
            ) : (
              producoes.map((p) => (
                <div className="producao-card" key={p.id}>
                  <h3 className="producao-card-title">Lote: {new Date(p.data).toLocaleDateString()}</h3>

                  <p className="producao-status">
                    Status: <span className="status-pill">{p.status}</span>
                  </p>

                  {p.observacao && (
                    <p className="producao-obs">Obs: {p.observacao.slice(0, 25)}...</p>
                  )}

                  <button
                    className="btn-atender"
                    onClick={() =>
                      (window.location.href = `/estoque/producao/${p.id}`)
                    }
                  >
                    Atender Estoque
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Título original */}
        <h2 className="estoque-title">Estoque — Visão Geral</h2>

        <div className="cards-container">

          {/* Card Insumos */}
          <div className="card-estoque">
            <h3>Insumos</h3>

            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Atual</th>
                  <th>Ideal</th>
                </tr>
              </thead>

              <tbody>
                {insumos.map((i) => (
                  <tr key={i.id}>
                    <td>{i.nome}</td>
                    <td>{i.estoque_atual}{i.unidade_medida}</td>
                    <td>{i.estoque_ideal}{i.unidade_medida}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card Produtos */}
          <div className="card-estoque">
            <h3>Produtos</h3>

            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Atual</th>
                  <th>Ideal</th>
                </tr>
              </thead>

              <tbody>
                {produtos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td>{p.estoque_atual}</td>
                    <td>{p.estoque_ideal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
