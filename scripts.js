document.addEventListener('DOMContentLoaded', function() {
    const sections = {
        anexosVigentes: document.getElementById('anexosVigentes'),
        rolVigente: document.getElementById('rolVigente'),
        buscarProcedimentos: document.getElementById('buscarProcedimentos'),
        cbhpm: document.getElementById('cbhpm'),
        relatorios: document.getElementById('relatorios')
    };

    function toggleElements(sidebar, pdfViewer, excelViewer) {
        document.getElementById('sidebar').style.display = sidebar ? 'block' : 'none';
        document.getElementById('pdfViewer').style.display = pdfViewer ? 'block' : 'none';
        document.getElementById('excelViewerContainer').style.display = excelViewer ? 'block' : 'none';
    }

    document.getElementById('anexosVigentesMenu').addEventListener('click', function() {
        showSection('anexosVigentes');
        toggleElements(true, true, false);
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

    document.getElementById('buscarBtn').addEventListener('click', function() {
        const nome = document.getElementById('searchNome').value;
        const codigo = document.getElementById('searchCodigo').value;
        const cbhpmEdicao = document.getElementById('cbhpmEdicao').value;

        if (!nome && !codigo) {
            Swal.fire('Atenção', 'Preencha pelo menos o nome ou o código para buscar.', 'warning');
            return;
        }

        const percentualCirurgico = document.getElementById('percentualCirurgico').value || 0;
        const percentualAnestesico = document.getElementById('percentualAnestesico').value || 0;
        const multiplo = document.getElementById('multiplo').value || 'Não';
        const viaAcesso = document.getElementById('viaAcesso').value || 'Mesma via';
        const horarioEspecial = document.getElementById('horarioEspecial').value || 'Não';
        const novaRegraAuxilio = document.getElementById('novaRegraAuxilio').value || 'Não';
        const acomodacao = document.getElementById('acomodacao').value || 'Enfermaria';

        const tbody = document.querySelector('#resultTable tbody');
        tbody.innerHTML = '<tr><td colspan="9">Buscando resultados...</td></tr>';

        fetch(`https://auditoriasite.onrender.com/api/buscar-procedimento?nomenclatura=${nome}&codigo_tuss=${codigo}&cbhpm_edicao=${cbhpmEdicao}&percentual_cirurgico=${percentualCirurgico}&percentual_anestesico=${percentualAnestesico}&multiplo=${multiplo}&via_acesso=${viaAcesso}&horario_especial=${horarioEspecial}&nova_regra_auxilio=${novaRegraAuxilio}&acomodacao=${acomodacao}`)
            .then(response => response.json())
            .then(data => {
                tbody.innerHTML = '';
                if (data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9">Nenhum resultado encontrado.</td></tr>';
                    return;
                }
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
            }).catch(() => {
                Swal.fire('Erro', 'Erro ao buscar os resultados.', 'error');
            });
    });

    function showSection(sectionId) {
        for (let key in sections) {
            sections[key].classList.remove('active');
        }
        sections[sectionId].classList.add('active');
    }

    showSection('anexosVigentes');
    toggleElements(true, true, false);

    fetch('https://auditoriasite.onrender.com/api/fetch-ans-links')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('anexosVigentes');
            container.innerHTML = '';
            data.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link;
                a.textContent = link;
                a.target = '_blank';
                container.appendChild(a);
            });
        })
        .catch(() => Swal.fire('Erro', 'Erro ao obter links.', 'error'));
});
