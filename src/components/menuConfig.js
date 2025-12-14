// src/config/menuConfig.js

export const menuConfig = {
  producao: [
    {
      label: "Início da Produção",
      icon: "📦",
      path: "/producao/inicio"
    },
    {
      label: "Relatórios",
      icon: "📊",
      path: "/producao/relatorios"
    }
  ],

  estoque: [
    {
      label: "Produtos",
      icon: "❄️",
      path: "/estoque/"
    },
    {
      label: "Insumos",
      icon: "❄️",
      path: "/estoque/"
    },
    {
      label: "Camara-Fria",
      icon: "❄️",
      path: "/estoque/camara-fria"
    },
    {
      label: "Entrada de produtos",
      icon: "📦",
      path: "/estoque/entrada"
    },
    {
      label: "Entrada de Insumos",
      icon: "📦",
      path: "/estoque/entrada"
    }
  ],

  financeiro: [
    {
      label: "Pagamentos",
      icon: "💰",
      path: "/financeiro/pagamentos"
    },
    {
      label: "Faturamento",
      icon: "📑",
      path: "/financeiro/faturamento"
    }
  ]
};
