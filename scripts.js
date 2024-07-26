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
            const latestAnexoIIContainer = document.getElementById('latestAnexoIIContainer');
            const latestRnContainer = document.getElementById('latestRnContainer');

            if (data.latest_anexo_ii_date && data.latest_anexo_ii_link) {
                latestAnexoIIContainer.innerHTML = `
                    <div class="link-item">
                        <strong>Anexo II - Modificado em ${data.latest_anexo_ii_date}</strong>
                        <button onclick="viewPDF('${data.latest_anexo_ii_link}')">Exibir</button>
                        <button onclick="downloadPDF('${data.latest_anexo_ii_link}')">Download</button>
                    </div>
                `;
            } else {
                latestAnexoIIContainer.innerHTML = '<p>Nenhum Anexo II encontrado</p>';
            }

            if (Array.isArray(data.latest_rn_links)) {
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
        fetch('https://auditoriasite.onrender.com/api/fetch-rn-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    }
});
