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
        document.getElementById('sidebar').style.display = 'block';
        document.getElementById('pdfViewerContainer').style.display = 'block';
    });

    document.getElementById('rolVigenteMenu').addEventListener('click', function() {
        showSection('rolVigente');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('pdfViewerContainer').style.display = 'none';
        fetchRolVigente();
    });

    document.getElementById('buscarProcedimentosMenu').addEventListener('click', function() {
        showSection('buscarProcedimentos');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('pdfViewerContainer').style.display = 'none';
    });

    document.getElementById('cbhpmMenu').addEventListener('click', function() {
        showSection('cbhpm');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('pdfViewerContainer').style.display = 'none';
    });

    document.getElementById('relatoriosMenu').addEventListener('click', function() {
        showSection('relatorios');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('pdfViewerContainer').style.display = 'none';
    });

    function showSection(sectionId) {
        for (let key in sections) {
            if (sections[key]) {
                sections[key].classList.remove('active');
            }
        }
        if (sections[sectionId]) {
            sections[sectionId].classList.add('active');
        }
    }

    // Inicialmente mostrar a seção Anexos Vigentes
    showSection('anexosVigentes');
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('pdfViewerContainer').style.display = 'block';

    // Lógica para buscar links do backend
    fetch('https://auditoriasite.onrender.com/api/fetch-ans-links')
        .then(response => response.json())
        .then(data => {
            const latestAnexoContainers = {
                I: document.getElementById('latestAnexoIContainer'),
                II: document.getElementById('latestAnexoIIContainer'),
                III: document.getElementById('latestAnexoIIIContainer'),
                IV: document.getElementById('latestAnexoIVContainer')
            };

            for (let anexo in latestAnexoContainers) {
                if (latestAnexoContainers[anexo]) {
                    if (data.latest_anexo_links[anexo]) {
                        console.log(`Anexo ${anexo} mais recente:`, data.latest_anexo_links[anexo]); // Log de depuração
                        latestAnexoContainers[anexo].innerHTML = `
                            <div class="link-item">
                                <strong>Anexo ${anexo}</strong>
                                <button onclick="viewPDF('${data.latest_anexo_links[anexo]}')">Exibir</button>
                                <button onclick="downloadPDF('${data.latest_anexo_links[anexo]}')">Download</button>
                            </div>
                        `;
                    } else {
                        latestAnexoContainers[anexo].innerHTML = `
                            <div class="link-item">
                                <strong>Nenhum Anexo ${anexo} encontrado</strong>
                            </div>
                        `;
                    }
                }
            }

            if (Array.isArray(data.latest_rn_links) && data.latest_rn_links.length > 0) {
                console.log('RN links encontrados:', data.latest_rn_links); // Log para depuração
                let displayedRnLinks = 0;
                const rnLinksHtml = data.latest_rn_links.slice(displayedRnLinks, displayedRnLinks + 10).map(link => `
                    <div class="link-item">
                        <strong>RN nº ${link.number}</strong> <span>(${link.date})</span>
                        <button onclick="viewPDF('${link.url}')">Exibir</button>
                        <button onclick="fetchRnSummary('${link.url}')">Resumo</button>
                    </div>
                `).join('');
                const latestRnContainer = document.getElementById('latestRnContainer');
                latestRnContainer.innerHTML = rnLinksHtml;
                displayedRnLinks += 10;

                const loadMoreBtn = document.getElementById('loadMoreBtn');
                loadMoreBtn.addEventListener('click', function() {
                    const additionalRnLinksHtml = data.latest_rn_links.slice(displayedRnLinks, displayedRnLinks + 10).map(link => `
                        <div class="link-item">
                            <strong>RN nº ${link.number}</strong> <span>(${link.date})</span>
                            <button onclick="viewPDF('${link.url}')">Exibir</button>
                            <button onclick="fetchRnSummary('${link.url}')">Resumo</button>
                        </div>
                    `).join('');
                    latestRnContainer.innerHTML += additionalRnLinksHtml;
                    displayedRnLinks += 10;

                    if (displayedRnLinks >= data.latest_rn_links.length) {
                        loadMoreBtn.style.display = 'none';
                    }
                });

                if (displayedRnLinks >= data.latest_rn_links.length) {
                    loadMoreBtn.style.display = 'none';
                }
            } else {
                const latestRnContainer = document.getElementById('latestRnContainer');
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

    function fetchRolVigente() {
        fetch('https://auditoriasite.onrender.com/api/fetch-rol-vigente')
            .then(response => response.json())
            .then(data => {
                if (data.rol_excel_link) {
                    const rolVigenteContainer = document.getElementById('rolVigenteContainer');
                    rolVigenteContainer.innerHTML = `
                        <div class="link-item">
                            <strong>Correlação TUSS x Rol</strong>
                            <button onclick="viewExcel('${data.rol_excel_link}')">Exibir</button>
                            <button onclick="downloadExcel('${data.rol_excel_link}')">Download</button>
                        </div>
                    `;
                } else {
                    const rolVigenteContainer = document.getElementById('rolVigenteContainer');
                    rolVigenteContainer.innerHTML = '<p>Erro ao obter o link do arquivo Excel</p>';
                }
            })
            .catch(error => {
                console.error('Erro ao obter o link do arquivo Excel:', error);
                alert('Erro ao obter o link do arquivo Excel: ' + error);
            });
    }

    window.viewExcel = function(link) {
        console.log('Exibindo Excel:', link); // Log para depuração
        window.open(link, '_blank');
    };

    window.downloadExcel = function(link) {
        console.log('Baixando Excel:', link); // Log para depuração
        window.open(link, '_blank');
    };
});
