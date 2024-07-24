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
                linksContainer.innerHTML = `
                    <div class="link-item">
                        <strong>Link da RN mais recente:</strong> 
                        <a href="${data.latest_rn_link}" target="_blank">${data.latest_rn_link}</a>
                    </div>
                    <div class="link-item">
                        <strong>Link do Anexo II mais recente:</strong> 
                        <a href="${data.latest_anexo_ii_link}" target="_blank">${data.latest_anexo_ii_link}</a>
                    </div>
                `;
            })
            .catch(error => {
                alert('Erro ao obter os links: ' + error);
            });
    });

    // Show the default section
    document.getElementById('anexos').classList.add('active');
});
