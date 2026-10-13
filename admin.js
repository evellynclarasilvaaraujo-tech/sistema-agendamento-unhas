
const CHAVE_SESSAO_ADMIN = "admin_logado";
let filtroAtual = { status: "todos", busca: "" };
let toastTimeout;



function hojeChave() {
  return dataParaChave(new Date());
}

function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("mostrar");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("mostrar"), 3000);
}



function verificarSessao() {
  const logada = sessionStorage.getItem(CHAVE_SESSAO_ADMIN) === "true";
  if (logada) {
    mostrarPainel();
  }
}

function mostrarPainel() {
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("telaPainel").style.display = "block";
  renderizarAgendamentos();
  renderizarResumo();
  renderizarBloqueios();
}

function fazerLogin(e) {
  e.preventDefault();
  const senha = document.getElementById("campoSenha").value;
  const erro = document.getElementById("loginErro");

  if (senha === CONFIG.senhaAdmin) {
    sessionStorage.setItem(CHAVE_SESSAO_ADMIN, "true");
    erro.style.display = "none";
    mostrarPainel();
  } else {
    erro.style.display = "block";
    document.getElementById("campoSenha").value = "";
  }
}

function sair() {
  sessionStorage.removeItem(CHAVE_SESSAO_ADMIN);
  document.getElementById("telaPainel").style.display = "none";
  document.getElementById("telaLogin").style.display = "block";
  document.getElementById("campoSenha").value = "";
  document.getElementById("loginErro").style.display = "none";
}



function mudarAba(idSecao) {
  document.querySelectorAll(".admin-tab").forEach(tab => tab.classList.remove("ativa"));
  document.querySelectorAll(".admin-secao").forEach(secao => secao.classList.remove("ativa"));
  document.querySelector(`[data-secao="${idSecao}"]`).classList.add("ativa");
  document.getElementById(idSecao).classList.add("ativa");
}



function renderizarResumo() {
  const agendamentos = carregarAgendamentos();
  const hoje = hojeChave();

  const hojeCount = agendamentos.filter(a => a.data === hoje && a.status !== "cancelado").length;

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);
  const chaveInicioSemana = dataParaChave(inicioSemana);

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 6);
  const chaveFimSemana = dataParaChave(fimSemana);

  const semanaCount = agendamentos.filter(a =>
    a.data >= chaveInicioSemana && a.data <= chaveFimSemana && a.status !== "cancelado"
  ).length;

  const confirmados = agendamentos.filter(a => a.status !== "cancelado").length;

  const mesAtual = hoje.slice(0, 7);
  const faturamentoMes = agendamentos
    .filter(a => a.data.slice(0, 7) === mesAtual && a.status === "concluido")
    .reduce((soma, a) => soma + (a.servicoPreco || 0), 0);

  const cards = [
    { num: hojeCount, rotulo: "Hoje" },
    { num: semanaCount, rotulo: "Esta Semana" },
    { num: confirmados, rotulo: "Confirmados" },
    { num: formatarPreco(faturamentoMes), rotulo: "Faturado no Mês" }
  ];

  document.getElementById("cardsResumo").innerHTML = cards.map(card => `
    <div class="card">
      <span class="numero">${card.num}</span>
      <span class="rotulo">${card.rotulo}</span>
    </div>
  `).join("");
}



function renderizarAgendamentos() {
  const lista = document.getElementById("listaAgendamentosContainer");
  if (!lista) return;

  let todos = carregarAgendamentos();
  let filtrados = todos;

  if (filtroAtual.status === "confirmado") {
    filtrados = todos.filter(a => !a.status || a.status === "confirmado");
  } else if (filtroAtual.status === "concluido") {
    filtrados = todos.filter(a => a.status === "concluido");
  } else if (filtroAtual.status === "cancelado") {
    filtrados = todos.filter(a => a.status === "cancelado");
  }

  if (filtroAtual.busca) {
    filtrados = filtrados.filter(a =>
      a.nome.toLowerCase().includes(filtroAtual.busca) ||
      a.telefone.includes(filtroAtual.busca)
    );
  }

  filtrados.sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

  if (filtrados.length === 0) {
    lista.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">Nenhum agendamento encontrado.</div>`;
    return;
  }

  lista.innerHTML = filtrados.map(ag => {
    const statusTexto = !ag.status || ag.status === "confirmado" ? "Confirmado" :
                        ag.status === "concluido" ? "Concluído" : "Cancelado";
    return `
      <div style="padding:16px; background:#fff; border-radius:12px; margin-bottom:12px; border-left:4px solid ${ag.status==='concluido'?'#4c7a5c':'#7a2b3d'};">
        <h4 style="margin:0 0 6px 0;">${ag.nome}</h4>
        <p style="margin:4px 0;">💅 ${ag.servicoNome}</p>
        <p style="margin:4px 0;">📅 ${ag.data} às ${ag.horario}</p>
        <p style="margin:4px 0;">📱 ${ag.telefone}</p>
        <p style="margin:4px 0; color:#666;">Status: ${statusTexto}</p>
        <div style="margin-top:10px;">
          <button onclick="mudarStatusAgenda('${ag.id}','confirmado')" style="margin-right:6px; padding:4px 10px; background:#e6f4ea; border-radius:6px; border:none;">Confirmar</button>
          <button onclick="mudarStatusAgenda('${ag.id}','concluido')" style="margin-right:6px; padding:4px 10px; background:#e6f4ea; border-radius:6px; border:none;">Concluir</button>
          <button onclick="mudarStatusAgenda('${ag.id}','cancelado')" style="margin-right:6px; padding:4px 10px; background:#fef0f0; border-radius:6px; border:none;">Cancelar</button>
          <button onclick="removerAgendamento('${ag.id}')" style="padding:4px 10px; background:#fdeaea; color:#a13e3e; border-radius:6px; border:none;">🗑 Excluir</button>
        </div>
      </div>
    `;
  }).join("");
}


function mudarStatusAgenda(id, novoStatus) {
  const todos = carregarAgendamentos();
  const encontrado = todos.find(a => a.id === id);
  if (encontrado) {
    encontrado.status = novoStatus;
    salvarAgendamentos(todos);
    renderizarAgendamentos();
    renderizarResumo();
  }
}

function removerAgendamento(id) {
  const todos = carregarAgendamentos();
  const agendamento = todos.find(a => a.id === id);
  if (!agendamento) return;

  const confirmou = confirm(`Excluir o agendamento de ${agendamento.nome} (${agendamento.data} às ${agendamento.horario})? Essa ação não pode ser desfeita.`);
  if (!confirmou) return;

  const restantes = todos.filter(a => a.id !== id);
  salvarAgendamentos(restantes);
  renderizarAgendamentos();
  renderizarResumo();
  mostrarToast("Agendamento excluído.");
}


function renderizarBloqueios() {
  const container = document.getElementById("listaBloqueios");
  if (!container) return;

  const bloqueios = carregarBloqueios();

  if (bloqueios.length === 0) {
    container.innerHTML = `<div style="padding:20px; text-align:center; color:#666;">Nenhum período bloqueado.</div>`;
    return;
  }

  const ordenados = [...bloqueios].sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));

  container.innerHTML = ordenados.map(b => `
    <div style="padding:14px 16px; background:#fff; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; gap:12px; border-left:4px solid #7a2b3d;">
      <div>
        <strong>${formatarDataExtenso(b.dataInicio)}</strong> até <strong>${formatarDataExtenso(b.dataFim)}</strong>
        ${b.motivo ? `<div style="color:#666; margin-top:4px;">${b.motivo}</div>` : ""}
      </div>
      <button onclick="removerBloqueio('${b.id}')" style="padding:6px 12px; background:#fef0f0; border-radius:6px; border:none; white-space:nowrap;">Remover</button>
    </div>
  `).join("");
}

function adicionarBloqueio(e) {
  e.preventDefault();
  const inicio = document.getElementById("bloqueioInicio").value;
  const fim = document.getElementById("bloqueioFim").value;
  const motivo = document.getElementById("bloqueioMotivo").value.trim();

  if (!inicio || !fim) {
    mostrarToast("Preencha as duas datas do período.");
    return;
  }
  if (fim < inicio) {
    mostrarToast("A data final não pode ser antes da data inicial.");
    return;
  }


  const dias = [];
  const [aIni, mIni, dIni] = inicio.split("-").map(Number);
  const [aFim, mFim, dFim] = fim.split("-").map(Number);
  let cursor = new Date(aIni, mIni - 1, dIni);
  const fimData = new Date(aFim, mFim - 1, dFim);
  while (cursor <= fimData) {
    dias.push(dataParaChave(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const bloqueios = carregarBloqueios();
  bloqueios.push({ id: gerarId(), dataInicio: inicio, dataFim: fim, motivo, dias });
  salvarBloqueios(bloqueios);

  document.getElementById("formBloqueio").reset();
  renderizarBloqueios();
  mostrarToast("Período bloqueado com sucesso.");
}

function removerBloqueio(id) {
  const bloqueios = carregarBloqueios().filter(b => b.id !== id);
  salvarBloqueios(bloqueios);
  renderizarBloqueios();
  mostrarToast("Bloqueio removido.");
}


function exportarBackup() {
  const dados = {
    agendamentos: carregarAgendamentos(),
    bloqueios: carregarBloqueios(),
    exportadoEm: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-daiana-${hojeChave()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  mostrarToast("Backup exportado.");
}

function importarBackup(e) {
  const arquivo = e.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const dados = JSON.parse(leitor.result);
      if (!Array.isArray(dados.agendamentos)) throw new Error("formato inválido");
      salvarAgendamentos(dados.agendamentos);
      salvarBloqueios(Array.isArray(dados.bloqueios) ? dados.bloqueios : []);
      renderizarAgendamentos();
      renderizarResumo();
      renderizarBloqueios();
      mostrarToast("Backup importado com sucesso.");
    } catch (err) {
      mostrarToast("Arquivo inválido. Verifique o backup e tente novamente.");
    }
    e.target.value = "";
  };
  leitor.readAsText(arquivo);
}


document.addEventListener("DOMContentLoaded", function() {
  verificarSessao();

  
  document.getElementById("formLogin").addEventListener("submit", fazerLogin);
  document.getElementById("btnEntrar").addEventListener("click", fazerLogin);
  document.getElementById("btnSair").addEventListener("click", sair);


  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => mudarAba(tab.dataset.secao));
  });

  
  document.querySelectorAll(".filtro-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filtro-chip").forEach(c => c.classList.remove("ativo"));
      chip.classList.add("ativo");
      filtroAtual.status = chip.dataset.filtro;
      renderizarAgendamentos();
    });
  });


  document.getElementById("buscaInput").addEventListener("input", (e) => {
    filtroAtual.busca = e.target.value.trim().toLowerCase();
    renderizarAgendamentos();
  });


  document.getElementById("formBloqueio").addEventListener("submit", adicionarBloqueio);


  document.getElementById("btnExportar").addEventListener("click", exportarBackup);
  document.getElementById("inputImportar").addEventListener("change", importarBackup);


  renderizarAgendamentos();
  renderizarResumo();
  renderizarBloqueios();
});