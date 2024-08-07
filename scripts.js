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
        if (sectionId === 'rolVigente') {
            fetchRolVigente();
        }
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

            const latestAnexoIContainer = document.getElementById('latestAnexoIContainer');
            const latestAnexoIIContainer = document.getElementById('latestAnexoIIContainer');
            const latestAnexoIIIContainer = document.getElementById('latestAnexoIIIContainer');
            const latestAnexoIVContainer = document.getElementById('latestAnexoIVContainer');
            const latestRnContainer = document.getElementById('historicoRnContainer');

            if (data.latest_anexo_links) {
                latestAnexoIContainer.innerHTML = `
                    <div class="link-item">
                        <strong>Anexo I</strong>
                        <button onclick="viewPDF('${data.latest_anexo_links.I}')">Exibir</button>
                    </div>
                `;
                latestAnexoIIContainer.innerHTML = `
                    <div class="link-item">
                        <strong>Anexo II</strong>
                        <button onclick="viewPDF('${data.latest_anexo_links.II}')">Exibir</button>
                    </div>
                `;
                latestAnexoIIIContainer.innerHTML = `
                    <div class="link-item">
                        <strong>Anexo III</strong>
                        <button onclick="viewPDF('${data.latest_anexo_links.III}')">Exibir</button>
                    </div>
                `;
                latestAnexoIVContainer.innerHTML = `
                    <div class="link-item">
                        <strong>Anexo IV</strong>
                        <button onclick="viewPDF('${data.latest_anexo_links.IV}')">Exibir</button>
                    </div>
                `;
            } else {
                latestAnexoIContainer.innerHTML = '<p>Nenhum Anexo I encontrado</p>';
                latestAnexoIIContainer.innerHTML = '<p>Nenhum Anexo II encontrado</p>';
                latestAnexoIIIContainer.innerHTML = '<p>Nenhum Anexo III encontrado</p>';
                latestAnexoIVContainer.innerHTML = '<p>Nenhum Anexo IV encontrado</p>';
            }

            if (Array.isArray(data.latest_rn_links)) {
                latestRnContainer.innerHTML = data.latest_rn_links.map(link => `
                    <div class="link-item">
                        <strong>RN nº ${link.number}</strong>
                        <span>(${link.date})</span>
                        <button onclick="viewPDF('${link.url}')">Exibir</button>
                        <button onclick="downloadPDF('${link.url}')">Download</button>
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
        document.getElementById('pdfViewer').src = link;
    };

    window.downloadPDF = function(link) {
        window.open(link, '_blank');
    };

    window.fetchRnSummary = function(url) {
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

    function fetchRolVigente() {
        fetch('https://auditoriasite.onrender.com/api/fetch-rol-vigente')
            .then(response => response.json())
            .then(data => {
                const link = data.latest_excel_link;
                console.log('Link do arquivo Excel:', link); // Log para depuração
                if (link) {
                    fetch(link)
                        .then(response => response.arrayBuffer())
                        .then(buffer => {
                            const data = new Uint8Array(buffer);
                            const workbook = XLSX.read(data, { type: 'array' });
                            const sheet = workbook.Sheets[workbook.SheetNames[0]];
                            const html = XLSX.utils.sheet_to_html(sheet);
                            document.getElementById('excelViewer').innerHTML = html;
                        })
                        .catch(error => {
                            console.error('Erro ao processar o arquivo Excel:', error);
                            alert('Erro ao processar o arquivo Excel: ' + error);
                        });
                } else {
                    console.error('Arquivo Excel não encontrado');
                    alert('Arquivo Excel não encontrado');
                }
            })
            .catch(error => {
                console.error('Erro ao obter o link do arquivo Excel:', error);
                alert('Erro ao obter o link do arquivo Excel: ' + error);
            });
    }
});
