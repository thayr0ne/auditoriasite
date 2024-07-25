document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('.content-section');
    const linksContainer = document.getElementById('linksContainer');
    const fetchLinksBtn = document.getElementById('fetchLinksBtn');

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
                    const rnLink = data.latest_rn.link ? `<button onclick="window.open('${data.latest_rn.link}', '_blank')">Acessar</button>
                    <button onclick="window.location.href='${data.latest_rn.link}'">Download</button>` : 'Link não disponível';

                    const anexoLink = data.latest_anexo_ii.link ? `<button onclick="window.open('${data.latest_anexo_ii.link}', '_blank')">Acessar</button>
                    <button onclick="window.location.href='${data.latest_anexo_ii.link}'">Download</button>` : 'Link não disponível';

                    linksContainer.innerHTML = `
                        <div class="link-item">
                            <strong>RN mais recente:</strong> 
                            <span>${data.latest_rn.text || 'Texto não disponível'}</span>
                            ${rnLink}
                        </div>
                        <div class="link-item">
                            <strong>Anexo II mais recente:</strong> 
                            <span>${data.latest_anexo_ii.text || 'Texto não disponível'}</span>
                            ${anexoLink}
                        </div>
                    `;
                } else {
                    linksContainer.innerHTML = 'Erro ao obter os links.';
                }
            })
            .catch(error => {
                alert('Erro ao obter os links: ' + error);
            });
    });

    // Show the default section
    document.getElementById('anexos').classList.add('active');
});
