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
        document.getElementById('pdfViewer').style.display = 'block';
        document.getElementById('excelViewerContainer').style.display = 'none';
    });

    document.getElementById('rolVigenteMenu').addEventListener('click', function() {
        showSection('rolVigente');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('pdfViewer').style.display = 'none';
        document.getElementById('excelViewerContainer').style.display = 'block';
        fetchRolVigente();
    });

    document.getElementById('buscarProcedimentosMenu').addEventListener('click', function() {
        showSection('buscarProcedimentos');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('pdfViewer').style.display = 'none';
        document.getElementById('excelViewerContainer').style.display = 'none';
    });

    document.getElementById('cbhpmMenu').addEventListener('click', function() {
        showSection('cbhpm');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('pdfViewer').style.display = 'none';
        document.getElementById('excelViewerContainer').style.display = 'none';
    });

    document.getElementById('relatoriosMenu').addEventListener('click', function() {
        showSection('relatorios');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('pdfViewer').style.display = 'none';
        document.getElementById('excelViewerContainer').style.display = 'none';
    });

   document.getElementById('buscarBtn').addEventListener('click', function() {
        const nome = document.getElementById('searchNome').value.trim();
        const codigo = document.getElementById('searchCodigo').value.trim();
        const cbhpmEdicao = document.getElementById('cbhpmEdicao').value;
        const percentualCirurgico = document.getElementById('percentualCirurgico').value || 0;
        const percentualAnestesico = document.getElementById('percentualAnestesico').value || 0;
        const multiplo = document.getElementById('multiplo').value;
        const viaAcesso = document.getElementById('viaAcesso').value;
        const horarioEspecial = document.getElementById('horarioEspecial').value;
        const novaRegraAuxilio = document.getElementById('novaRegraAuxilio').value;
        const acomodacao = document.getElementById('acomodacao').value;

        // Desabilitar o botão e exibir mensagem de carregamento
        const botaoBuscar = document.getElementById('buscarBtn');
        botaoBuscar.disabled = true;
        botaoBuscar.innerText = 'Buscando...';

        fetch(`/api/buscar-procedimento?nomenclatura=${nome}&codigo_tuss=${codigo}&cbhpm_edicao=${cbhpmEdicao}&percentual_cirurgico=${percentualCirurgico}&percentual_anestesico=${percentualAnestesico}&multiplo=${multiplo}&via_acesso=${viaAcesso}&horario_especial=${horarioEspecial}&nova_regra_auxilio=${novaRegraAuxilio}&acomodacao=${acomodacao}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na busca: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const tbody = document.querySelector('#resultTable tbody');
                tbody.innerHTML = '';

                if (data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9">Nenhum resultado encontrado.</td></tr>';
                } else {
                    data.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${row.nomenclatura}</td>
                            <td>${row.codigo_tuss}</td>
                            <td>${row.porte_cirurgico}</td>
                            <td>${row.valor_porte_cirurgico}</td>
                            <td>${row.num_auxiliares}</td>
                            <td>${row.valor_auxiliar}</td>
                            <td>${row.porte_anestesico}</td>
                            <td>${row.valor_porte_anestesico}</td>
                            <td>${row.correlacao_rol_vigente}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            })
            .catch(error => {
                alert(`Erro ao buscar procedimentos: ${error.message}`);
            })
            .finally(() => {
                botaoBuscar.disabled = false;
                botaoBuscar.innerText = 'Buscar';
            });
    });
    });


    

    function showSection(sectionId) {
        for (let key in sections) {
            sections[key].classList.remove('active');
        }
        sections[sectionId].classList.add('active');
    }

    // Inicialmente mostrar a seção Anexos Vigentes
    showSection('anexosVigentes');
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('pdfViewer').style.display = 'block';

    // Lógica para buscar links do backend
    fetch('https://auditoriasite.onrender.com/api/fetch-ans-links')
        .then(response => response.json())
        .then(data => {
            if (!data.latest_anexo_links || !data.latest_rn_links) {
                throw new Error("Dados inválidos recebidos");
            }

            const latestAnexoContainers = {
                I: document.getElementById('latestAnexoIContainer'),
                II: document.getElementById('latestAnexoIIContainer'),
                III: document.getElementById('latestAnexoIIIContainer'),
                IV: document.getElementById('latestAnexoIVContainer')
            };

            for (let anexo in latestAnexoContainers) {
                if (latestAnexoContainers[anexo]) {
                    if (data.latest_anexo_links[anexo]) {
                        console.log(`Anexo ${anexo} mais recente:`, data.latest_anexo_links[anexo]);
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
                let displayedRnLinks = 10;
                const rnLinksHtml = data.latest_rn_links.slice(0, displayedRnLinks).map(link => `
                    <div class="link-item">
                        <strong>RN nº ${link.number}</strong> <span>(${link.date})</span>
                        <button onclick="viewPDF('${link.url}')">Exibir</button>
                        <button onclick="fetchRnSummary('${link.url}')">Resumo</button>
                    </div>
                `).join('');
                const latestRnContainer = document.getElementById('latestRnContainer');
                latestRnContainer.innerHTML = rnLinksHtml;
                displayedRnLinks += 10;

                const loadMoreBtn = document.getElementById('loadMoreRnBtn');
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

    function fetchRolVigente() {
        fetch('https://auditoriasite.onrender.com/api/fetch-rol-vigente')
            .then(response => response.json())
            .then(data => {
                if (data.excel_url) {
                    console.log('URL do Excel:', data.excel_url);
                    const excelViewer = document.getElementById('excelViewer');
                    excelViewer.src = `https://view.officeapps.live.com/op/embed.aspx?src=${data.excel_url}`;
                } else {
                    console.error('Erro ao obter o URL do Excel:', data.error);
                    alert('Erro ao obter o URL do Excel: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(error => {
                console.error('Erro ao obter o URL do Excel:', error);
                alert('Erro ao obter o URL do Excel: ' + error);
            });
    }

    window.viewPDF = function(link) {
        console.log('Exibindo PDF:', link);
        document.getElementById('pdfViewer').src = link;
        document.getElementById('pdfViewer').style.display = 'block';
    };

    window.downloadPDF = function(link) {
        console.log('Baixando PDF:', link);
        window.open(link, '_blank');
    };

    window.fetchRnSummary = function(url) {
        console.log('Fetching summary for URL:', url);
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
});
