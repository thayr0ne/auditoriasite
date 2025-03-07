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
            sections[key].style.display = 'none'; // Esconder todas as seções
        }
        sections[sectionId].style.display = 'block'; // Mostrar a seção correta
        
        // 🔹 Recarregar dados específicos ao trocar de aba
        if (sectionId === 'rolVigente') {
            fetchRolVigente();
        }
        if (sectionId === 'anexosVigentes') {
            fetchAnexosVigentes();
        }
    }

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

    document.getElementById('buscarBtn').addEventListener('click', function() {
        const nome = document.getElementById('searchNome').value.trim();
        const codigo = document.getElementById('searchCodigo').value.trim();
        const cbhpmEdicao = document.getElementById('cbhpmEdicao').value;

        const botaoBuscar = document.getElementById('buscarBtn');
        botaoBuscar.disabled = true;
        botaoBuscar.innerText = 'Buscando...';

        fetch(`https://auditoriasite.vercel.app/api/buscar-procedimento?nomenclatura=${nome}&codigo_tuss=${codigo}&cbhpm_edicao=${cbhpmEdicao}`)
            .then(response => {
                if (!response.ok) throw new Error(`Erro na busca: ${response.status}`);
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

    function fetchRolVigente() {
        fetch('https://auditoriasite.onrender.com/api/fetch-rol-vigente')
            .then(response => response.json())
            .then(data => {
                if (data.excel_url) {
                    document.getElementById('excelViewer').src = `https://view.officeapps.live.com/op/embed.aspx?src=${data.excel_url}`;
                } else {
                    console.error('Erro ao obter o URL do Excel:', data.error);
                }
            })
            .catch(error => console.error('Erro ao obter o URL do Excel:', error));
    }

    function fetchAnexosVigentes() {
        fetch('https://auditoriasite.onrender.com/api/fetch-ans-links')
            .then(response => response.json())
            .then(data => {
                if (!data.latest_anexo_links || !data.latest_rn_links) {
                    throw new Error("Dados inválidos recebidos");
                }
                console.log('Anexos carregados', data);
            })
            .catch(error => console.error('Erro ao obter os anexos:', error));
    }

    showSection('anexosVigentes');
});
