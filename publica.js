
const estado = {
  servicoId: null,
  dataChave: null,
  horario: null,
  mesVisivel: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
};

document.addEventListener("DOMContentLoaded", () => {
  renderizarServicos();
  renderizarCalendario();
  atualizarResumo();

  document.getElementById("mesAnterior").addEventListener("click", () => mudarMes(-1));
  document.getElementById("mesProximo").addEventListener("click", () => mudarMes(1));
  document.getElementById("formAgendamento").addEventListener("submit", confirmarAgendamento);
  document.getElementById("btnFecharModal").addEventListener("click", fecharModal);

  document.getElementById("campoTelefone").addEventListener("input", (e) => {
    e.target.value = mascararTelefone(e.target.value);
  });
});



function renderizarServicos() {
  const grade = document.getElementById("servicosGrade");
  grade.innerHTML = CONFIG.servicos.map(s => `
    <div class="servico-card" data-id="${s.id}" tabindex="0" role="button" aria-pressed="false">
      <div class="servico-check" aria-hidden="true"></div>
      <div class="servico-nome">${s.nome}</div>
      <div class="servico-desc">${s.descricao}</div>
      <div class="servico-preco">${formatarPreco(s.preco)} <span>a partir de</span></div>
    </div>
  `).join("");

  grade.querySelectorAll(".servico-card").forEach(card => {
    card.addEventListener("click", () => selecionarServico(card.dataset.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selecionarServico(card.dataset.id);
      }
    });
  });
}

function selecionarServico(id) {
  estado.servicoId = id;
  document.querySelectorAll(".servico-card").forEach(c => {
    const ativo = c.dataset.id === id;
    c.classList.toggle("selecionado", ativo);
    c.setAttribute("aria-pressed", ativo);
  });
  atualizarResumo();
}



function mudarMes(direcao) {
  estado.mesVisivel.setMonth(estado.mesVisivel.getMonth() + direcao);
  renderizarCalendario();
}

function renderizarCalendario() {
  const bloqueios = carregarBloqueios();
  const agendamentos = carregarAgendamentos();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const ano = estado.mesVisivel.getFullYear();
  const mes = estado.mesVisivel.getMonth();

  document.getElementById("mesAnoAtual").textContent = `${MESES_PT[mes]} de ${ano}`;


  const mesAtualReal = new Date().getMonth();
  const anoAtualReal = new Date().getFullYear();
  const ehMesAtualOuAnterior = (ano < anoAtualReal) || (ano === anoAtualReal && mes <= mesAtualReal);
  document.getElementById("mesAnterior").disabled = ehMesAtualOuAnterior;

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  const dias = [];
  for (let i = 0; i < primeiroDiaSemana; i++) dias.push(null);
  for (let d = 1; d <= totalDias; d++) dias.push(d);

  const container = document.getElementById("calDias");
  container.innerHTML = dias.map(d => {
    if (d === null) return `<div class="cal-dia vazio"></div>`;

    const dataObj = new Date(ano, mes, d);
    const chave = dataParaChave(dataObj);
    const dataSemHora = new Date(ano, mes, d);
    dataSemHora.setHours(0, 0, 0, 0);

    const ehPassado = dataSemHora < hoje;
    const ehHoje = dataSemHora.getTime() === hoje.getTime();
    const atende = diaAtende(dataObj);
    const bloqueado = diaBloqueado(chave, bloqueios);

    let classes = "cal-dia";
    let clicavel = false;

    if (ehPassado) {
      classes += " passado";
    } else if (!atende) {
      classes += " domingo-fechado";
    } else if (bloqueado) {
      classes += " bloqueado";
    } else {
      const ocupados = horariosOcupados(chave, agendamentos).length;
      const totalHorarios = gerarHorariosDoDia().length;

      classes += (ocupados >= totalHorarios * 0.7) ? " lotado" : " disponivel";
      clicavel = true;
    }

    if (ehHoje) classes += " hoje";
    if (estado.dataChave === chave) classes += " selecionado";

    return `<div class="${classes}" ${clicavel ? `data-chave="${chave}" tabindex="0" role="button"` : ""}>${d}</div>`;
  }).join("");

  container.querySelectorAll("[data-chave]").forEach(el => {
    el.addEventListener("click", () => selecionarData(el.dataset.chave));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selecionarData(el.dataset.chave);
      }
    });
  });
}

function selecionarData(chave) {
  estado.dataChave = chave;
  estado.horario = null;
  renderizarCalendario();
  renderizarHorarios();
  atualizarResumo();
}



function renderizarHorarios() {
  const container = document.getElementById("horariosContainer");

  if (!estado.dataChave) {
    container.innerHTML = `<p class="horarios-vazio">Selecione uma data para ver os horários disponíveis</p>`;
    return;
  }

  const agendamentos = carregarAgendamentos();
  const ocupados = horariosOcupados(estado.dataChave, agendamentos);
  const todosHorarios = gerarHorariosDoDia();

  container.innerHTML = `<div class="horarios-grade">${
    todosHorarios.map(h => {
      const ocupado = ocupados.includes(h);
      const selecionado = estado.horario === h;
      return `<button type="button" class="horario-btn ${selecionado ? "selecionado" : ""}"
                data-horario="${h}" ${ocupado ? "disabled" : ""}>${h}</button>`;
    }).join("")
  }</div>`;

  container.querySelectorAll(".horario-btn:not(:disabled)").forEach(btn => {
    btn.addEventListener("click", () => {
      estado.horario = btn.dataset.horario;
      renderizarHorarios();
      atualizarResumo();
    });
  });
}



function atualizarResumo() {
  const resumo = document.getElementById("resumoSelecao");
  const btn = document.getElementById("btnConfirmar");

  const servico = CONFIG.servicos.find(s => s.id === estado.servicoId);

  if (!servico || !estado.dataChave || !estado.horario) {
    resumo.innerHTML = `<span class="resumo-vazio">Selecione o serviço, a data e o horário acima para continuar</span>`;
    btn.disabled = true;
    return;
  }

  resumo.innerHTML = `
    <div><strong>Serviço:</strong> ${servico.nome} — ${formatarPreco(servico.preco)}</div>
    <div><strong>Data:</strong> ${formatarDataExtenso(estado.dataChave)}</div>
    <div><strong>Horário:</strong> ${estado.horario}</div>
  `;
  btn.disabled = false;
}



function confirmarAgendamento(e) {
  e.preventDefault();

  const nome = document.getElementById("campoNome").value.trim();
  const telefone = document.getElementById("campoTelefone").value.trim();
  const observacao = document.getElementById("campoObs").value.trim();
  const avisoErro = document.getElementById("avisoErro");

  avisoErro.classList.remove("mostrar");

  if (!estado.servicoId || !estado.dataChave || !estado.horario) {
    mostrarErro("Selecione o serviço, a data e o horário antes de continuar.");
    return;
  }
  if (!nome) {
    mostrarErro("Por favor, informe seu nome completo.");
    return;
  }
  if (telefone.replace(/\D/g, "").length < 10) {
    mostrarErro("Informe um telefone válido com DDD.");
    return;
  }

 

  const agendamentos = carregarAgendamentos();
  const jaOcupado = agendamentos.some(a =>
    a.data === estado.dataChave &&
    a.horario === estado.horario &&
    a.status !== "cancelado"
  );

  if (jaOcupado) {
    mostrarErro("Ops! Esse horário acabou de ser reservado por outra cliente. Escolha outro horário.");
    renderizarHorarios();
    renderizarCalendario();
    return;
  }

  const servico = CONFIG.servicos.find(s => s.id === estado.servicoId);

  const novoAgendamento = {
    id: gerarId(),
    nome: document.getElementById("campoNome").value,
    telefone: document.getElementById("campoTelefone").value,
    observacao: document.getElementById("campoObs").value || "",
    servicoId: servico.id,
    servicoNome: servico.nome,
    servicoPreco: servico.preco,
    data: estado.dataChave,
    horario: estado.horario,
    minutos: servico.minutos || CONFIG.intervaloMinutos || 60,
    status: "confirmado",
    criadoEm: new Date().toISOString(),
  };

  agendamentos.push(novoAgendamento);
  salvarAgendamentos(agendamentos);

  mostrarModalSucesso(novoAgendamento);
  resetarFormulario();
}

function mostrarErro(msg) {
  const avisoErro = document.getElementById("avisoErro");
  avisoErro.textContent = msg;
  avisoErro.classList.add("mostrar");
}

function mostrarModalSucesso(ag) {
  const janela = document.getElementById("modalConfirmacao");
  janela.classList.add("mostrar");

  const detalhes = document.getElementById("modalDetalhes");
  const numeroWpp = "5594996614439";

  let dataBonita = ag.data;
  try {
    if (ag.data && ag.data.length === 10) {
      const [ano, mes, dia] = ag.data.split("-");
      const nomesMeses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
      dataBonita = `${dia} de ${nomesMeses[parseInt(mes,10)-1]} de ${ano}`;
    }
  } catch(e) {}

  
  const mensagem = `Olá! Agendei pelo site:

  Serviço: ${ag.servicoNome}
  Data: ${dataBonita}
  Horário: ${ag.horario}
  Nome: ${ag.nome}
  Telefone: ${ag.telefone}
  Observação: ${ag.observacao || "Nenhuma"}`;

  const linkWpp = `https://wa.me/${numeroWpp}?text=${encodeURIComponent(mensagem)}`;

  detalhes.innerHTML = `
    <p><strong>Serviço:</strong> ${ag.servicoNome}</p>
    <p><strong>Data:</strong> ${dataBonita}</p>
    <p><strong>Horário:</strong> ${ag.horario}</p>
    <p><strong>Nome:</strong> ${ag.nome}</p>
    <p><strong>Telefone:</strong> ${ag.telefone}</p>
    <a href="${linkWpp}" target="_blank" style="display:block; background:#25d366; color:white; padding:14px; border-radius:30px; text-decoration:none; font-weight:bold; margin-top:20px;">💬 Avisar pelo WhatsApp</a>
  `;
}

function fecharModal() {
  document.getElementById("modalConfirmacao").classList.remove("mostrar");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetarFormulario() {
  document.getElementById("formAgendamento").reset();
  estado.servicoId = null;
  estado.dataChave = null;
  estado.horario = null;
  document.querySelectorAll(".servico-card").forEach(c => c.classList.remove("selecionado"));
  renderizarCalendario();
  renderizarHorarios();
  atualizarResumo();
}
function abrirFoto(src){
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxFundo').classList.add('mostrar');
}
function fecharFoto(){
  document.getElementById('lightboxFundo').classList.remove('mostrar');
}