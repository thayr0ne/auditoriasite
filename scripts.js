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
    document.getElementById('fetchLinksBtn').addEventListener('click', function() {
        fetch('https://auditoriasite.vercel.app/api/fetch-ans-links')
            .then(response => response.json())
            .then(data => {
                const latestAnexoIIContainer = document.getElementById('latestAnexoIIContainer');
                const latestRnContainer = document.getElementById('latestRnContainer');

                latestAnexoIIContainer.innerHTML = `
                    <div class="link-item">
                        <strong>Anexo II - Modificado em ${formatDate(data.latest_anexo_ii_date)}</strong>
                        <button onclick="viewPDF('${data.latest_anexo_ii_link}')">Exibir</button>
                        <button onclick="downloadPDF('${data.latest_anexo_ii_link}')">Download</button>
                    </div>
                `;

                latestRnContainer.innerHTML = `
                    <div class="link-item">
                        <strong>RN nº ${data.latest_rn_number} (${formatDate(data.latest_rn_date)})</strong>
                        <button onclick="viewPDF('${data.latest_rn_link}')">Exibir</button>
                    </div>
                `;
            })
            .catch(error => {
                alert('Erro ao obter os links: ' + error);
            });
    });

    window.viewPDF = function(link) {
        document.getElementById('pdfViewer').src = link;
    };

    window.downloadPDF = function(link) {
        const a = document.createElement('a');
        a.href = link;
        a.download = 'Anexo_II.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    function formatDate(dateString) {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
});
