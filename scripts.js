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

        fetch(`https://auditoriasite.vercel.app/api/buscar-procedimento?nomenclatura=${nome}&codigo_tuss=${codigo}&cbhpm_edicao=${cbhpmEdicao}&percentual_cirurgico=${percentualCirurgico}&percentual_anestesico=${percentualAnestesico}&multiplo=${multiplo}&via_acesso=${viaAcesso}&horario_especial=${horarioEspecial}&nova_regra_auxilio=${novaRegraAuxilio}&acomodacao=${acomodacao}`)
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

    function showSection(sectionId) {
        for (let key in sections) {
            sections[key].classList.remove('active');
        }
        sections[sectionId].classList.add('active');
    }

    showSection('anexosVigentes');
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('pdfViewer').style.display = 'block';
});
