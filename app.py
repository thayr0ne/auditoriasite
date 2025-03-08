from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# =========================================================================
# CARREGAR A PLANILHA E AJUSTAR OS DADOS
# =========================================================================
google_drive_link = "https://drive.google.com/uc?export=download&id=1EBlt886g7wQ45-9B2KfvkgNqWI2VUBrw"
file_path = "/tmp/PORTES_E_VALORES_CBHPMS_SITE.xlsx"

# Baixar a planilha do Google Drive
response = requests.get(google_drive_link, allow_redirects=True)
if response.status_code == 200:
    with open(file_path, "wb") as f:
        f.write(response.content)
    print("✅ Planilha baixada com sucesso!")
else:
    raise Exception(f"❌ Erro ao baixar planilha: {response.status_code}")

# Carregar os dados das abas relevantes
xls = pd.ExcelFile(file_path)
df_procedimentos = pd.read_excel(xls, sheet_name="TABELA COM PORTES")
df_portes = pd.read_excel(xls, sheet_name="PORTES CBHPM")

# Renomear colunas para facilitar o acesso no código
df_procedimentos.rename(columns={
    "Unnamed: 0": "Código do Procedimento",
    "usar essa planilha para consultar os detalhes de um determinado procedimento, como porte do código, custo operacional, número de auxiliares, porte anestésico, etc": "Descrição do Procedimento",
    "Unnamed: 2": "MULTI PORTE",
    "Unnamed: 3": "Porte Cirúrgico",
    "Unnamed: 4": "UCO",
    "Unnamed: 5": "Nº de Auxiliares",
    "Unnamed: 6": "Porte Anestésico",
    "Unnamed: 7": "Filme ou Doc",
    "Unnamed: 8": "Radiofármaco"
}, inplace=True)

# Remover possíveis linhas vazias (caso existam)
df_procedimentos.dropna(subset=["Código do Procedimento", "Descrição do Procedimento"], inplace=True)

# =========================================================================
# ROTA PARA BUSCAR PROCEDIMENTOS
# =========================================================================
@app.route("/api/buscar_procedimentos", methods=["GET"])
def buscar_procedimentos():
    # Recebe o termo de busca
    termo = request.args.get("termo", "").strip().lower()

    if not termo:
        return jsonify({"results": [], "msg": "Nenhum termo informado"}), 200

    # Filtrar no DataFrame pelos campos relevantes
    df_filtrado = df_procedimentos[
        df_procedimentos["Descrição do Procedimento"].str.lower().str.contains(termo, na=False)
        | df_procedimentos["Código do Procedimento"].astype(str).str.contains(termo, na=False)
    ]

    # Limitar a 50 resultados
    df_filtrado = df_filtrado.head(50)

    # Converter para JSON
    resultados = df_filtrado.to_dict(orient="records")
    return jsonify({"results": resultados, "count": len(resultados)})



# Função para verificar a correlação com o Rol Vigente
def verificar_correlacao_rol(codigo_tuss):
    tabela_tuss_rol = pd.read_excel('/mnt/data/TUSSxROL.xlsx')
    correlacao = tabela_tuss_rol[tabela_tuss_rol['CÓDIGO TUSS'] == codigo_tuss]['Correlação (Sim/Não)'].values
    if len(correlacao) > 0 and correlacao[0] == 'Sim':
        return "Sim"
    else:
        return "Não"


# Funções para buscar RNs e Anexos mais recentes
def fetch_ans_links():
    url = 'https://www.ans.gov.br/component/legislacao/?view=legislacao&task=TextoLei&format=raw&id=NDAzMw==#anexosvigentes'
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        links = soup.find_all('a')

        rn_links = []
        anexo_links = {'I': '', 'II': '', 'III': '', 'IV': ''}
        for link in links:
            href = link.get('href')
            texto = link.get_text().strip()
            if 'Alterado pela RN' in texto:
                rn_match = re.search(r'RN nº (\d+), de', texto)
                if rn_match:
                    rn_num = int(rn_match.group(1))
                    rn_links.append((rn_num, texto, href))
            for anexo in anexo_links.keys():
                if re.search(rf'\bANEXO {anexo}\b', texto) and href.endswith('.pdf'):
                    anexo_links[anexo] = urljoin(url, href)

        rn_links = list(dict.fromkeys(rn_links))  # Remove duplicatas
        rn_links.sort(reverse=True, key=lambda x: x[0])
        latest_rn_links = []
        for rn_num, texto, href in rn_links:
            date_match = re.search(r'de (\d{2}/\d{2}/\d{4})', texto)
            if date_match:
                date = date_match.group(1)
                latest_rn_links.append({
                    'number': rn_num,
                    'date': date,
                    'url': urljoin(url, href)
                })

        return jsonify({
            'latest_rn_links': latest_rn_links,
            'latest_anexo_links': anexo_links
        })
    else:
        return jsonify({
            'error': 'Erro ao acessar a página'
        })

@app.route('/api/fetch-ans-links', methods=['GET'])
def fetch_ans_links_api():
    return fetch_ans_links()

@app.route('/api/fetch-rn-summary', methods=['POST'])
def fetch_rn_summary():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL não fornecida'}), 400

    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        paragraphs = soup.find_all('p', class_='ementa')
        summary = "\n".join(p.get_text().strip() for p in paragraphs)
        return jsonify({'summary': summary})
    else:
        return jsonify({'error': 'Erro ao acessar a página da RN'}), 500
# =========================================================================
# EXECUTAR A APLICAÇÃO FLASK
# =========================================================================
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
