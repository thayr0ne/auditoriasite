document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('.content-section');
    const fetchLinksBtn = document.getElementById('fetchLinksBtn');
    const recentLinksContainer = document.getElementById('recentLinksContainer');
    const historyLinksContainer = document.getElementById('historyLinksContainer');
    const fileViewer = document.getElementById('fileViewer');
    const fileViewerRight = document.getElementById('fileViewerRight');

    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const content = this.getAttribute('data-content');
            sections.forEach(section => {
                if (section.id === content) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });

    fetchLinksBtn.addEventListener('click', function() {
        fetch('https://auditoriasite.vercel.app/api/fetch-ans-links')
            .then(response => response.json())
            .then(data => {
                if (data.latest_rn && data.latest_anexo_ii) {
                    // Atualizar links mais recentes
                    recentLinksContainer.innerHTML = `
                        <div class="link-item">
                            <strong>Anexo I:</strong> 
                            <span>Anexo I - Alterado pela RN nº ${data.latest_rn.number}, de ${data.latest_rn.date}</span>
                            <button onclick="viewFile('${data.latest_rn.link}')">Visualizar</button>
                        </div>
                        <div class="link-item">
                            <strong>Anexo II:</strong> 
                            <span>Anexo II - Alterado pela RN nº ${data.latest_rn.number}, de ${data.latest_rn.date}</span>
                            <button onclick="viewFile('${data.latest_anexo_ii.link}')">Visualizar</button>
                        </div>
                    `;

                    // Atualizar histórico
                    historyLinksContainer.innerHTML = data.history.map(rn => `
                        <div class="link-item">
                            <strong>${rn.text}</strong>
                            <button onclick="viewFile('${rn.link}')">Visualizar</button>
                        </div>
                    `).join('');
                } else {
                    recentLinksContainer.innerHTML = 'Erro ao obter os links.';
                    historyLinksContainer.innerHTML = 'Erro ao obter os links.';
                }
            })
            .catch(error => {
                alert('Erro ao obter os links: ' + error);
            });
    });

    window.viewFile = function(link) {
        fileViewer.src = link;
        fileViewerRight.src = link;
    }

    // Show the default section
    document.getElementById('anexos').classList.add('active');
});
