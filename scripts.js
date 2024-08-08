document.addEventListener("DOMContentLoaded", function () {
    const anexosContainer = document.getElementById("anexos-recentes");
    const rnHistoricoContainer = document.getElementById("rn-historico");
    const pdfViewer = document.getElementById("pdf-viewer");
    const excelViewer = document.getElementById("excel-viewer");
    const mostrarMaisBtn = document.getElementById("mostrar-mais-rn");

    let rnHistorico = [];
    let rnDisplayCount = 10;

    function fetchAnexosAndRnLinks() {
        fetch("/api/fetch-ans-links")
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }

                const { latest_anexo_links, latest_rn_links } = data;

                anexosContainer.innerHTML = `
                    <li><a href="${latest_anexo_links.I}" target="_blank">Anexo I</a></li>
                    <li><a href="${latest_anexo_links.II}" target="_blank">Anexo II</a></li>
                    <li><a href="${latest_anexo_links.III}" target="_blank">Anexo III</a></li>
                    <li><a href="${latest_anexo_links.IV}" target="_blank">Anexo IV</a></li>
                `;

                rnHistorico = latest_rn_links;
                displayRnHistorico();
            })
            .catch(error => {
                console.error("Erro ao obter os links:", error);
            });
    }

    function displayRnHistorico() {
        rnHistoricoContainer.innerHTML = rnHistorico.slice(0, rnDisplayCount).map(rn => `
            <li>
                <strong>${rn.number}</strong> (${rn.date})
                <button onclick="exibirPdf('${rn.url}')">Exibir</button>
                <button onclick="baixarPdf('${rn.url}')">Download</button>
                <button onclick="mostrarResumo('${rn.url}')">Resumo</button>
            </li>
        `).join("");

        if (rnDisplayCount >= rnHistorico.length) {
            mostrarMaisBtn.style.display = 'none';
        } else {
            mostrarMaisBtn.style.display = 'block';
        }
    }

    function exibirPdf(url) {
        pdfViewer.src = url;
    }

    function baixarPdf(url) {
        window.open(url, "_blank");
    }

    function mostrarResumo(url) {
        fetch("/api/fetch-rn-summary", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                alert(data.summary);
            })
            .catch(error => {
                console.error("Erro ao obter o resumo:", error);
            });
    }

    mostrarMaisBtn.addEventListener("click", function () {
        rnDisplayCount += 10;
        displayRnHistorico();
    });

    function fetchExcel() {
        fetch("/api/fetch-rol-vigente")
            .then(response => response.json())
            .then(data => {
                const excelUrl = data.excel_url;
                if (!excelUrl) {
                    throw new Error("Erro ao obter o URL do Excel");
                }
                const viewer = new ExcelViewer(excelViewer, {
                    src: excelUrl,
                    startCell: 'A5',
                    endCell: 'L', // Change this to only display columns A to L
                    containerHeight: '100%', // Set the height of the container to 100%
                });
                viewer.render();
            })
            .catch(error => {
                console.error("Erro ao obter o URL do Excel:", error);
            });
    }

    if (document.location.pathname.endsWith('anexos-vigentes.html')) {
        fetchAnexosAndRnLinks();
    } else if (document.location.pathname.endsWith('rol-vigente.html')) {
        fetchExcel();
    }
});
