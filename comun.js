
const CONFIG = {
  nomeEstudio: "Daiana Araújo",
  subtitulo: "Nail Designer",
  senhaAdmin: "2805", 

  
  diasAtende: [1, 2, 3, 4, 5, 6],

  
  horarioInicio: "08:00",
  horarioFim: "18:00",
  intervaloMinutos: 60,

  
  servicos: [
    { id: "1", nome: "Alongamento em Fibra Simples", descricao: "Unhas lindas, fortes e com formato perfeito", preco: 140.00, minutos: 150 },
    { id: "2", nome: "Esmaltação em Gel", descricao: "Brilho intenso e cor que dura por semanas", preco: 60.00, minutos: 100 },
    { id: "3", nome: "Manutenção Fibra", descricao: "Renove e conserve a beleza do seu alongamento", preco: 100.00, minutos: 120 },
    { id: "4", nome: "Manutenção Gel", descricao: "Reparo e cuidado com suas unhas", preco: 100.00, minutos: 120 },
    { id: "5", nome: "Mãos e Pés", descricao: "Cuidado completo para suas mãos e pés", preco: 60.00, minutos: 120 },
    { id: "6", nome: "Banho de Gel", descricao: "Tratamento nutritivo para unhas", preco: 100.00, minutos: 150 },
    { id: "7", nome: "Blindagem em Unhas Naturais", descricao: "Proteção adicional para unhas naturais", preco: 50.00, minutos: 60 },
    { id: "8", nome: "Remoção de Unhas de Fibra", descricao: "Remoção segura de unhas de fibra", preco: 35.00, minutos: 30 },
    { id: "9", nome: "Mão ou Pé Apenas", descricao: "Serviço individual para mão ou pé", preco: 30.00, minutos: 60 },
    { id: "10", nome: "Nail Art Personalizada", descricao: "Design único e criativo para suas unhas, valor a combinar", preco: 0.00, minutos: 60 }
  ]
};


const MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];


function formatarDataExtenso(chaveData) {
  if (!chaveData) return "";
  const [ano, mes, dia] = chaveData.split("-");
  return `${dia} de ${MESES_PT[parseInt(mes)-1]} de ${ano}`;
}


function chaveParaData(chave) {
  const [ano, mes, dia] = chave.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}


function dataParaChave(dataObj) {
  const ano = dataObj.getFullYear();
  const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
  const dia = String(dataObj.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}


function diaAtende(dataObj) {
  const diaSemana = dataObj.getDay();
  return CONFIG.diasAtende.includes(diaSemana);
}


function gerarHorariosDoDia() {
  const horarios = [];
  const [hInicio, mInicio] = CONFIG.horarioInicio.split(":").map(Number);
  const [hFim, mFim] = CONFIG.horarioFim.split(":").map(Number);
  const totalInicio = hInicio * 60 + mInicio;
  const totalFim = hFim * 60 + mFim;

  for (let minutos = totalInicio; minutos <= totalFim; minutos += CONFIG.intervaloMinutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, "0");
    const m = String(minutos % 60).padStart(2, "0");
    horarios.push(`${h}:${m}`);
  }
  return horarios;
}


function horariosOcupados(chaveData, agendamentos) {
  const bloqueados = [];

  agendamentos.filter(ag => {
    return ag.data === chaveData && ag.status !== "cancelado";
  }).forEach(ag => {
    const [hIni, mIni] = ag.horario.split(":").map(Number);
    const inicio = hIni * 60 + mIni;

    const duracao = ag.minutos || CONFIG.intervaloMinutos || 60;
    const fim = inicio + duracao;

    const intervalo = CONFIG.intervaloMinutos || 60;

    for (let min = inicio; min < fim; min += intervalo) {
      const h = String(Math.floor(min / 60)).padStart(2, "0");
      const m = String(min % 60).padStart(2, "0");
      bloqueados.push(`${h}:${m}`);
    }
  });

  return bloqueados;
}


function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}


function mascararTelefone(valor) {
  const apenasNumeros = valor.replace(/\D/g, "");
  if (apenasNumeros.length <= 2) return apenasNumeros;
  if (apenasNumeros.length <= 7) return `(${apenasNumeros.slice(0,2)}) ${apenasNumeros.slice(2)}`;
  if (apenasNumeros.length <= 11) return `(${apenasNumeros.slice(0,2)}) ${apenasNumeros.slice(2,7)}-${apenasNumeros.slice(7,11)}`;
  return `(${apenasNumeros.slice(0,2)}) ${apenasNumeros.slice(2,7)}-${apenasNumeros.slice(7,11)}`;
}


function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}


const CHAVE_AGENDAMENTOS = "daiana_agendamentos";
const CHAVE_BLOQUEIOS = "daiana_bloqueios";

function salvarAgendamentos(lista) {
  localStorage.setItem(CHAVE_AGENDAMENTOS, JSON.stringify(lista));
}

function carregarAgendamentos() {
  const dados = localStorage.getItem(CHAVE_AGENDAMENTOS);
  return dados ? JSON.parse(dados) : [];
}


function salvarBloqueios(lista) {
  localStorage.setItem(CHAVE_BLOQUEIOS, JSON.stringify(lista));
}

function carregarBloqueios() {
  const dados = localStorage.getItem(CHAVE_BLOQUEIOS);
  return dados ? JSON.parse(dados) : [];
}

function diaBloqueado(chave, bloqueios) {
  return bloqueios.some(b => typeof b === "string" ? b === chave : (b.dias && b.dias.includes(chave)));
}