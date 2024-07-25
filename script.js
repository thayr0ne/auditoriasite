document.addEventListener('DOMContentLoaded', function() {
    const recentContainer = document.getElementById('anexos-recentes');
    const historicoList = document.getElementById('historico-list');

    fetch('https://auditoriasite.vercel.app/api/fetch-ans-links')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erro ao obter os links:', data.error);
                return;
            }

            // Adicionar itens recentes
            const anexoIHtml = `
                <div class="anexo">
                    <h3>Anexo I - Alterado pela RN nº ${data.latest_rn.number}, de ${data.latest_rn.date}</h3>
                    <button onclick="exibirAnexo('${data.latest_anexo_ii.link}')">Exibir</button>
                    <button onclick="downloadAnexo('${data.latest_anexo_ii.link}')">Download</button>
                </div>
            `;
            const anexoIIHtml = `
                <div class="anexo">
                    <h3>Anexo II - Alterado pela RN nº ${data.latest_rn.number}, de ${data.latest_rn.date}</h3>
                    <button onclick="exibirAnexo('${data.latest_anexo_ii.link}')">Exibir</button>
                    <button onclick="downloadAnexo('${data.latest_anexo_ii.link}')">Download</button>
                </div>
            `;
            recentContainer.innerHTML = anexoIHtml + anexoIIHtml;

            // Adicionar itens ao histórico
            data.history.forEach(item => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = item.link;
                link.textContent = item.text;
                link.target = '_blank';
                listItem.appendChild(link);
                historicoList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Erro ao obter os links:', error);
        });

    window.exibirAnexo = function(link) {
        const viewer = document.getElementById('viewer');
        viewer.src = link;
    };

    window.downloadAnexo = function(link) {
        window.open(link, '_blank');
    };
});
