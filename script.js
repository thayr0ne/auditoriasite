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
                        <strong>RN mais recente:</strong> 
                        <button onclick="window.open('${data.latest_rn.link}', '_blank')">Acessar</button>
                        <button onclick="downloadFile('${data.latest_rn.link}', 'RN_${data.latest_rn.number}.pdf')">Download</button>
                    </div>
                    <div class="link-item">
                        <strong>Anexo II mais recente:</strong> 
                        <button onclick="window.open('${data.latest_anexo_ii.link}', '_blank')">Acessar</button>
                        <button onclick="downloadFile('${data.latest_anexo_ii.link}', 'Anexo_II.pdf')">Download</button>
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

// Função para fazer o download do arquivo
function downloadFile(url, filename) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        })
        .catch(() => alert('Erro ao fazer o download do arquivo.'));
}
