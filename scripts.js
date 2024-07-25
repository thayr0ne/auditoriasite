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
                const linksContainer = document.getElementById('linksContainer');
                linksContainer.innerHTML = `
                    <div class="link-item">
                        <strong>Link da RN mais recente:</strong> 
                        <a href="#" data-link="${data.latest_rn_link}" class="link">RN mais recente</a>
                    </div>
                    <div class="link-item">
                        <strong>Link do Anexo II mais recente:</strong> 
                        <a href="#" data-link="${data.latest_anexo_ii_link}" class="link">Anexo II mais recente</a>
                    </div>
                `;
                document.querySelectorAll('.link').forEach(link => {
                    link.addEventListener('click', function(event) {
                        event.preventDefault();
                        const linkUrl = event.target.getAttribute('data-link');
                        document.getElementById('pdfViewer').src = linkUrl;
                    });
                });
            })
            .catch(error => {
                alert('Erro ao obter os links: ' + error);
            });
    });
});
