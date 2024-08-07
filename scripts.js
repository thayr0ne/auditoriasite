<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="styles.css">
    <!-- Adicionando a biblioteca SheetJS -->
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.0/dist/xlsx.full.min.js"></script>
</head>
<body>
    <div id="menu">
        <button id="anexosVigentesMenu">Anexos Vigentes</button>
        <button id="rolVigenteMenu">Rol Vigente</button>
        <button id="buscarProcedimentosMenu">Buscar Procedimentos</button>
        <button id="cbhpmMenu">CBHPM</button>
        <button id="relatoriosMenu">Relatórios</button>
    </div>

    <div id="anexosVigentes" class="section">
        <div id="sidebar">
            <h3>RECENTES</h3>
            <div id="latestAnexoIContainer"></div>
            <div id="latestAnexoIIContainer"></div>
            <div id="latestAnexoIIIContainer"></div>
            <div id="latestAnexoIVContainer"></div>
            <h3>HISTÓRICO</h3>
            <div id="latestRnContainer"></div>
            <button id="loadMoreBtn">Mostrar mais</button>
        </div>
        <div id="pdfViewerContainer">
            <iframe id="pdfViewer" width="100%" height="600px"></iframe>
        </div>
    </div>

    <div id="rolVigente" class="section">
        <div id="rolVigenteContainer"></div>
    </div>

    <div id="buscarProcedimentos" class="section">
        <!-- Conteúdo da seção Buscar Procedimentos -->
    </div>

    <div id="cbhpm" class="section">
        <!-- Conteúdo da seção CBHPM -->
    </div>

    <div id="relatorios" class="section">
        <!-- Conteúdo da seção Relatórios -->
    </div>

    <script src="scripts.js"></script>
</body>
</html>
