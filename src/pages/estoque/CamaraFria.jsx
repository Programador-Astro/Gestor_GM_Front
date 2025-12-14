import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import api from "../../services/api";
import "./CamaraFria.css";

export default function CamaraFria() {
  const [producoes, setProducoes] = useState([]);
  const hoje = new Date().toISOString().split("T")[0]; // AAAA-MM-DD

  useEffect(() => {
    async function carregar() {
      try {
        const res = await api.get("/api/producao/");
        const lista = res.data || [];

        const pendentes = lista.filter((p) => p.status === "RASCUNHO" || p.status === "AGUARDANDO_CONF" );

        pendentes.sort((a, b) => {
          const aHoje = a.data === hoje ? 0 : 1;
          const bHoje = b.data === hoje ? 0 : 1;
          return aHoje - bHoje;
        });

        setProducoes(pendentes);
      } catch (err) {
        console.log("Erro ao carregar produções:", err);
      }
    }

    carregar();
  }, []);

  return (
    <div className="estoque-layout">
      <Sidebar />

      <div className="estoque-main">
        <Navbar />

        <h2 className="estoque-title">Produções Pendentes</h2>

        <div className="producao-card">
          <table className="producao-table">
            <thead>
              <tr>
                <th>PRODUÇÃO</th>
                <th>Tot Produtos</th>
                <th>Tot Quantidade</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {producoes.length === 0 && (
                <tr>
                  <td colSpan="5" className="no-data">
                    Nenhuma produção pendente encontrada.
                  </td>
                </tr>
              )}

              {producoes.map((p) => {
                const totalProdutos = p.itens?.length || 0;

                const totalQuantidades = p.itens
                  ?.reduce((acc, item) => acc + Number(item.quantidade_esperada || 0), 0)
                  .toFixed(2);

                return (
                  <tr
                    key={p.id}
                    className={p.data === hoje ? "linha-hoje" : ""}
                  >
                    <td>
                      <Link to={`/estoque/producao/${p.id}`} className="link-producao">
                        {p.id}
                      </Link>
                    </td>

                    <td>{totalProdutos}</td>
                    <td>{totalQuantidades}</td>
                    <td>{p.data}</td>
                    <td className="status-pendente">Pendente</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
