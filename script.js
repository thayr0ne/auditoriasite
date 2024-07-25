document.addEventListener('DOMContentLoaded', function() {
    const historicoList = document.getElementById('historico-list');

    fetch('https://auditoriasite.vercel.app/api/fetch-ans-links')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erro ao obter os links:', data.error);
                return;
            }

            // Adicionar itens ao histórico
            data.history.forEach(item => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = item.link;
                link.textContent = item.text;
                link.target = '_blank';
                listItem.appendChild(link);
                historicoList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Erro ao obter os links:', error);
        });

    window.exibirAnexo = function(linkId) {
        const viewer = document.getElementById('viewer');
        let link;

        if (linkId === 'link-anexo-i') {
            link = 'https://www.ans.gov.br/images/stories/Legislacao/rn/Anexo_I_Rol_2021_RN_465.2021_RN606_RN607.pdf'; // substituir pelo link correto
        } else if (linkId === 'link-anexo-ii') {
            link = 'https://www.ans.gov.br/images/stories/Legislacao/rn/Anexo_II_DUT_2021_RN_465.2021_RN606_RN607.pdf'; // substituir pelo link correto
        }

        viewer.src = link;
    };

    window.downloadAnexo = function(linkId) {
        let link;

        if (linkId === 'link-anexo-i') {
            link = 'https://www.ans.gov.br/images/stories/Legislacao/rn/Anexo_I_Rol_2021_RN_465.2021_RN606_RN607.pdf'; // substituir pelo link correto
        } else if (linkId === 'link-anexo-ii') {
            link = 'https://www.ans.gov.br/images/stories/Legislacao/rn/Anexo_II_DUT_2021_RN_465.2021_RN606_RN607.pdf'; // substituir pelo link correto
        }

        window.open(link, '_blank');
    };
});
