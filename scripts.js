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
    fetch('https://auditoriasite.vercel.app/api/fetch-ans-links')
        .then(response => response.json())
        .then(data => {
            const latestAnexoIIContainer = document.getElementById('latestAnexoIIContainer');
            const latestRnContainer = document.getElementById('latestRnContainer');

            latestAnexoIIContainer.innerHTML = `
                <div class="link-item">
                    <strong>Anexo II - Modificado em ${formatDate(data.latest_rn.date)}</strong>
                    <button onclick="viewPDF('${data.latest_anexo_ii_link}')">Exibir</button>
                    <button onclick="downloadPDF('${data.latest_anexo_ii_link}')">Download</button>
                </div>
            `;

            if (data.latest_rn) {
                latestRnContainer.innerHTML = `
                    <div class="link-item">
                        <strong>RN nº ${data.latest_rn.number} (${formatDate(data.latest_rn.date)})</strong>
                        <button onclick="viewPDF('${data.latest_rn.url}')">Exibir</button>
                    </div>
                `;
            } else {
                latestRnContainer.innerHTML = '<p>Nenhuma RN encontrada</p>';
            }
        })
        .catch(error => {
            alert('Erro ao obter os links: ' + error);
        });

    window.viewPDF = function(link) {
        document.getElementById('pdfViewer').src = link;
    };

    window.downloadPDF = function(link) {
        window.open(link, '_blank');
    };

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    }
});
