const caixaBotoesPerguntas = document.getElementById("caixa-botoes-perguntas");
const inputPergunta = document.getElementById("input-pergunta");
const btnPerguntar = document.getElementById("btn-perguntar");
const textoResultado = document.getElementById("texto-resultado");
const containerLinkNoticia = document.getElementById("container-link-noticia");
const btnOuvir = document.getElementById("btn-ouvir");
const iconeVoz = document.getElementById("icone-voz");
const textoBtnVoz = document.getElementById("texto-btn-voz");

// Perguntas prontas para disparo direto
const atalhosPerguntas = [
    "Quem ganhou a Champions League?",
    "Quem é o líder do Brasileirão?",
    "Próximo jogo do Flamengo",
    "Resultado do último jogo do Real Madrid"
];

document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) lucide.createIcons();
    gerarBotoesAtalho();
});

function gerarBotoesAtalho() {
    caixaBotoesPerguntas.innerHTML = "";
    atalhosPerguntas.forEach((pergunta) => {
        const btn = document.createElement("button");
        btn.classList.add("btn-opcao-3d");
        btn.innerText = pergunta;
        btn.addEventListener("click", () => pesquisarDuckDuckGo(pergunta));
        caixaBotoesPerguntas.appendChild(btn);
    });
}

// Consulta a API do DuckDuckGo e serviços de notícias diretamente pelo navegador
async function pesquisarDuckDuckGo(termoBusca) {
    pararVoz();
    textoResultado.innerText = `Consultando DuckDuckGo para "${termoBusca}"...`;
    containerLinkNoticia.innerHTML = "";

    const urlDuck = `https://api.duckduckgo.com/?q=${encodeURIComponent(termoBusca + " futebol")}&format=json&no_html=1&skip_disambig=1`;

    try {
        const resposta = await fetch(urlDuck);
        const dados = await resposta.json();

        let resumo = dados.AbstractText || dados.Answer || (dados.RelatedTopics && dados.RelatedTopics[0]?.Text);
        let linkNoticia = dados.AbstractURL || (dados.RelatedTopics && dados.RelatedTopics[0]?.FirstURL);

        if (resumo) {
            exibirResultado(resumo, linkNoticia || `https://duckduckgo.com/?q=${encodeURIComponent(termoBusca)}`);
        } else {
            // Se o DuckDuckGo Instant Answer não tiver resumo direto, busca na API publica da ESPN
            await buscarESPN(termoBusca);
        }
    } catch (erro) {
        await buscarESPN(termoBusca);
    }
}

// Fallback complementar de notícias esportivas
async function buscarESPN(termoBusca) {
    try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=5`);
        const dados = await res.json();

        if (dados && dados.articles && dados.articles.length > 0) {
            const noticia = dados.articles[0];
            const titulo = noticia.headline;
            const descricao = noticia.description || "Acesse a matéria completa pelo link abaixo.";
            const link = noticia.links?.web?.href;

            exibirResultado(`${titulo}: ${descricao}`, link);
        } else {
            exibirResultadoSemResposta(termoBusca);
        }
    } catch (e) {
        exibirResultadoSemResposta(termoBusca);
    }
}

function exibirResultadoSemResposta(termo) {
    const linkFonte = `https://duckduckgo.com/?q=${encodeURIComponent(termo + " futebol noticias")}`;
    exibirResultado(
        `Resultados encontrados para "${termo}". Clique no link para visualizar a cobertura de notícias completa.`,
        linkFonte
    );
}

function exibirResultado(texto, link) {
    textoResultado.innerText = texto;
    if (link) {
        containerLinkNoticia.innerHTML = `
            <a href="${link}" target="_blank" rel="noopener noreferrer">
                <i data-lucide="external-link"></i> Fonte / Notícia Completa
            </a>
        `;
        if (window.lucide) lucide.createIcons();
    }
}

btnPerguntar.addEventListener("click", () => {
    const texto = inputPergunta.value.trim();
    if (texto) {
        pesquisarDuckDuckGo(texto);
        inputPergunta.value = "";
    }
});

inputPergunta.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const texto = inputPergunta.value.trim();
        if (texto) {
            pesquisarDuckDuckGo(texto);
            inputPergunta.value = "";
        }
    }
});

// Sintetizador de Voz (Text-to-Speech)
let synth = window.speechSynthesis;

btnOuvir.addEventListener("click", () => {
    if (!synth) {
        alert("Navegador não suporta leitura em voz.");
        return;
    }

    if (synth.speaking) {
        pararVoz();
        return;
    }

    const texto = textoResultado.innerText;
    if (!texto) return;

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 1.0;

    fala.onstart = () => {
        textoBtnVoz.innerText = "Parar";
        iconeVoz.setAttribute("data-lucide", "square");
        if (window.lucide) lucide.createIcons();
    };

    fala.onend = resetarBotaoVoz;
    fala.onerror = resetarBotaoVoz;

    synth.speak(fala);
});

function pararVoz() {
    if (synth && synth.speaking) {
        synth.cancel();
    }
    resetarBotaoVoz();
}

function resetarBotaoVoz() {
    textoBtnVoz.innerText = "Ouvir";
    iconeVoz.setAttribute("data-lucide", "volume-2");
    if (window.lucide) lucide.createIcons();
}