document.addEventListener('DOMContentLoaded', function() {
    const sections = {
        anexosVigentes: document.getElementById('anexosVigentes'),
        rolVigente: document.getElementById('rolVigente'),
        buscarProcedimentos: document.getElementById('buscarProcedimentos'),
        cbhpm: document.getElementById('cbhpm'),
        relatorios: document.getElementById('relatorios')
    };

    function showSection(sectionId) {
        for (let key in sections) {
            sections[key].classList.remove('active');
        }
        sections[sectionId].classList.add('active');
    }

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
        const termo = document.getElementById('searchNome').value.trim();
        if (!termo) {
            alert("Digite um termo para buscar.");
            return;
        }

        fetch(`/api/buscar_procedimentos?termo=${encodeURIComponent(termo)}`)
            .then(response => response.json())
            .then(data => {
                const tbody = document.querySelector('#resultTable tbody');
                tbody.innerHTML = '';
                if (data.results.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9">Nenhum procedimento encontrado.</td></tr>';
                    return;
                }
                data.results.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${row["Código do Procedimento"] || ""}</td>
                        <td>${row["Descrição do Procedimento"] || ""}</td>
                        <td>${row["Porte Cirúrgico"] || ""}</td>
                        <td>${row["MULTI PORTE"] || ""}</td>
                        <td>${row["Nº de Auxiliares"] || ""}</td>
                        <td>${row["Porte Anestésico"] || ""}</td>
                        <td>${row["Filme ou Doc"] || ""}</td>
                        <td>${row["Radiofármaco"] || ""}</td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(error => {
                console.error("Erro ao buscar procedimentos:", error);
                alert("Erro ao buscar procedimentos. Tente novamente.");
            });
    });

    showSection('anexosVigentes');
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('pdfViewer').style.display = 'block';

    function fetchRolVigente() {
        fetch('https://auditoriasite.onrender.com/api/fetch-rol-vigente')
            .then(response => response.json())
            .then(data => {
                if (data.excel_url) {
                    document.getElementById('excelViewer').src = `https://view.officeapps.live.com/op/embed.aspx?src=${data.excel_url}`;
                } else {
                    alert('Erro ao obter o URL do Excel: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(error => {
                console.error('Erro ao obter o URL do Excel:', error);
                alert('Erro ao obter o URL do Excel: ' + error);
            });
    }

    window.viewPDF = function(link) {
        document.getElementById('pdfViewer').src = link;
        document.getElementById('pdfViewer').style.display = 'block';
    };

    window.downloadPDF = function(link) {
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
});
