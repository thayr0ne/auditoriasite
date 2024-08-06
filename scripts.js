document.addEventListener('DOMContentLoaded', function() {
    const sections = {
        anexosVigentes: document.getElementById('anexosVigentes'),
        rolVigente: document.getElementById('rolVigente'),
        buscarProcedimentos: document.getElementById('buscarProcedimentos'),
        cbhpm: document.getElementById('cbhpm'),
        relatorios: document.getElementById('relatorios')
    };

    document.getElementById('anexosVigentesMenu').addEventListener('click', function() {
        showSection('anexosVigentes');
    });

    document.getElementById('rolVigenteMenu').addEventListener('click', function() {
        showSection('rolVigente');
    });

    document.getElementById('buscarProcedimentosMenu').addEventListener('click', function() {
        showSection('buscarProcedimentos');
    });

    document.getElementById('cbhpmMenu').addEventListener('click', function() {
        showSection('cbhpm');
    });

    document.getElementById('relatoriosMenu').addEventListener('click', function() {
        showSection('relatorios');
    });

    function showSection(sectionId) {
        for (let key in sections) {
            sections[key].classList.remove('active');
        }
        sections[sectionId].classList.add('active');
    }

    // Inicialmente mostrar a seção Anexos Vigentes
    showSection('anexosVigentes');

    // Lógica para buscar links do backend
    fetch('https://auditoriasite.onrender.com/api/fetch-ans-links')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos da API:', data); // Log para depuração
            const latestAnexoContainers = {
                I: document.getElementById('latestAnexoIContainer'),
                II: document.getElementById('latestAnexoIIContainer'),
                III: document.getElementById('latestAnexoIIIContainer'),
                IV: document.getElementById('latestAnexoIVContainer')
            };
            const latestRnContainer = document.getElementById('latestRnContainer');

            for (let anexo in latestAnexoContainers) {
                if (latestAnexoContainers[anexo]) {
                    if (data.latest_anexo_links[anexo]) {
                        console.log(`Anexo ${anexo} mais recente:`, data.latest_anexo_links[anexo]); // Log de depuração
                        latestAnexoContainers[anexo].innerHTML = `
                            <div class="link-item">
                                <strong>Anexo ${anexo} mais recente</strong>
                                <button onclick="viewPDF('${data.latest_anexo_links[anexo]}')">Exibir</button>
                                <button onclick="downloadPDF('${data.latest_anexo_links[anexo]}')">Download</button>
                            </div>
                        `;
                    } else {
                        console.log(`Nenhum Anexo ${anexo} encontrado`); // Log de depuração
                        latestAnexoContainers[anexo].innerHTML = `<p>Nenhum Anexo ${anexo} encontrado</p>`;
                    }
                }
            }

            if (Array.isArray(data.latest_rn_links)) {
                console.log('RN links encontrados:', data.latest_rn_links); // Log para depuração
                latestRnContainer.innerHTML = data.latest_rn_links.map(link => `
                    <div class="link-item">
                        <strong>RN nº ${link.number} (${link.date})</strong>
                        <button onclick="viewPDF('${link.url}')">Exibir</button>
                        <button onclick="fetchRnSummary('${link.url}')">Resumo</button>
                    </div>
                `).join('');
            } else {
                latestRnContainer.innerHTML = '<p>Nenhuma RN encontrada</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao obter os links:', error);
            alert('Erro ao obter os links: ' + error);
        });

    window.viewPDF = function(link) {
        console.log('Exibindo PDF:', link); // Log para depuração
        document.getElementById('pdfViewer').src = link;
    };

    window.downloadPDF = function(link) {
        console.log('Baixando PDF:', link); // Log para depuração
        window.open(link, '_blank');
    };

    window.fetchRnSummary = function(url) {
        console.log('Fetching summary for URL:', url); // Log para depuração
        fetch('https://auditoriasite.onrender.com/api/fetch-rn-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        })
        .then(response => response.json())
        .then(data => {
            if (data.summary) {
                alert('Resumo: ' + data.summary);
            } else {
                alert('Erro ao obter o resumo: ' + (data.error || 'Erro desconhecido'));
            }
        })
        .catch(error => {
            console.error('Erro ao obter o resumo:', error);
            alert('Erro ao obter o resumo: ' + error);
        });
    };
});
