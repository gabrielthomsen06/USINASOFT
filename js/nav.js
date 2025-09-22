const paginas = [
  "index.html",
  "producao.html",
  "cadastro.html",
  "atividades.html"
];

function voltar() {
  const atual = window.location.pathname.split("/").pop();
  const index = paginas.indexOf(atual);
  if (index > 0) {
    window.location.href = paginas[index - 1];
  }
}

function proxima() {
  const atual = window.location.pathname.split("/").pop();
  const index = paginas.indexOf(atual);
  if (index < paginas.length - 1) {
    window.location.href = paginas[index + 1];
  }
}
