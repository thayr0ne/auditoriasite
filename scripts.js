document.addEventListener('DOMContentLoaded', function() {
    const sections = {
        anexosVigentes: document.getElementById('anexosVigentes'),
        rolVigente: document.getElementById('rolVigente'),
        buscarProcedimentos: document.getElementById('buscarProcedimentos'),
        cbhpm: document.getElementById('cbhpm'),
        relatorios: document.getElementById('relatorios')
    };

    function toggleElements(sidebar, pdfViewer, excelViewer) {
        const sidebarElement = document.getElementById('sidebar');
        const pdfViewerElement = document.getElementById('pdfViewer');
        const excelViewerContainer = document.getElementById('excelViewerContainer');

        if (sidebarElement) sidebarElement.style.display = sidebar ? 'block' : 'none';
        if (pdfViewerElement) pdfViewerElement.style.display = pdfViewer ? 'block' : 'none';
        if (excelViewerContainer) excelViewerContainer.style.display = excelViewer ? 'block' : 'none';
    }

    function showSection(sectionId) {
        for (let key in sections) {
            if (sections[key]) sections[key].classList.remove('active');
        }
        if (sections[sectionId]) sections[sectionId].classList.add('active');
    }

    function fetchAnexosVigentes() {
        fetch('https://auditoriasite.onrender.com/api/fetch-ans-links')
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('latestAnexoContainer');
                if (!container) return;
                container.innerHTML = '';
                data.links.forEach(link => {
                    const div = document.createElement('div');
                    div.classList.add('link-item');
                    div.innerHTML = `
                        <a href="${link}" target="_blank">${link}</a>
                        <button onclick="viewPDF('${link}')">Visualizar</button>
                        <button onclick="downloadPDF('${link}')">Download</button>
                        <button onclick="fetchRnSummary('${link}')">Resumo</button>
                    `;
                    container.appendChild(div);
                });
            })
            .catch(() => Swal.fire('Erro', 'Erro ao obter links.', 'error'));
    }

    function fetchRolVigente() {
        fetch('https://auditoriasite.onrender.com/api/fetch-rol-vigente')
            .then(response => response.json())
            .then(data => {
                const excelViewer = document.getElementById('excelViewer');
                if (!excelViewer) return;
                if (data.excel_url) {
                    excelViewer.src = `https://view.officeapps.live.com/op/embed.aspx?src=${data.excel_url}`;
                } else {
                    Swal.fire('Erro', data.error || 'Erro ao obter Rol Vigente.', 'error');
                }
            })
            .catch(() => Swal.fire('Erro', 'Erro ao obter URL do Excel.', 'error'));
    }

    window.viewPDF = function(link) {
        const pdfViewer = document.getElementById('pdfViewer');
        if (pdfViewer) {
            pdfViewer.src = link;
            toggleElements(true, true, false);
        } else {
            console.error("Elemento 'pdfViewer' não encontrado.");
            Swal.fire('Erro', 'Visualizador de PDF não encontrado.', 'error');
        }
    };

    window.downloadPDF = function(link) {
        window.open(link, '_blank');
    };

    window.fetchRnSummary = function(url) {
        fetch('https://auditoriasite.onrender.com/api/fetch-rn-summary', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ url })
        })
        .then(response => response.json())
        .then(data => Swal.fire('Resumo da RN', data.summary || 'Nenhum resumo encontrado.', 'info'))
        .catch(() => Swal.fire('Erro', 'Erro ao buscar resumo da RN.', 'error'));
    };

    document.getElementById('anexosVigentesMenu').addEventListener('click', function() {
        showSection('anexosVigentes');
        toggleElements(true, true, false);
        fetchAnexosVigentes();
    });

    document.getElementById('rolVigenteMenu').addEventListener('click', function() {
        showSection('rolVigente');
        toggleElements(false, false, true);
        fetchRolVigente();
    });

    document.getElementById('buscarProcedimentosMenu').addEventListener('click', function() {
        showSection('buscarProcedimentos');
        toggleElements(false, false, false);
    });

    document.getElementById('cbhpmMenu').addEventListener('click', function() {
        showSection('cbhpm');
        toggleElements(false, false, false);
    });

    document.getElementById('relatoriosMenu').addEventListener('click', function() {
        showSection('relatorios');
        toggleElements(false, false, false);
    });

    fetchAnexosVigentes();
    showSection('anexosVigentes');
    toggleElements(true, true, false);
});
