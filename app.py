from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
import logging
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Permitir todas as origens
logging.basicConfig(level=logging.INFO)

@app.route('/api/fetch-ans-links', methods=['GET'])
def fetch_ans_links():
    url = 'https://www.ans.gov.br/component/legislacao/?view=legislacao&task=TextoLei&format=raw&id=NDAzMw==#anexosvigentes'
    logging.info(f'Fetching data from URL: {url}')
    try:
        response = requests.get(url)
    except requests.exceptions.RequestException as e:
        logging.error(f'Error fetching data from URL: {e}')
        return jsonify({'error': f'Error fetching data from URL: {e}'}), 500

    if response.status_code == 200:
        logging.info('Page fetched successfully')
        soup = BeautifulSoup(response.content, 'html.parser')
        links = soup.find_all('a')
        logging.info(f'Found {len(links)} links on the page')

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
                if re.fullmatch(f'ANEXO {anexo}', texto) and href.endswith('.pdf'):
                    anexo_links[anexo] = urljoin(url, href)

        rn_links = list(dict.fromkeys(rn_links))  # Remove duplicatas
        rn_links.sort(reverse=True, key=lambda x: x[0])
        logging.info(f'Sorted and deduplicated RN links: {rn_links}')
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
        logging.error(f'Error fetching page: {response.status_code}')
        return jsonify({
            'error': 'Erro ao acessar a página'
        })

@app.route('/api/fetch-rol-vigente', methods=['GET'])
def fetch_rol_vigente():
    url = 'https://www.gov.br/ans/pt-br/acesso-a-informacao/participacao-da-sociedade/atualizacao-do-rol-de-procedimentos'
    logging.info(f'Fetching data from URL: {url}')
    try:
        response = requests.get(url)
    except requests.exceptions.RequestException as e:
        logging.error(f'Error fetching data from URL: {e}')
        return jsonify({'error': f'Error fetching data from URL: {e}'}), 500

    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        links = soup.find_all('a')
        excel_link = None
        for link in links:
            href = link.get('href')
            if 'Correlação TUSS x Rol' in link.text and href.endswith('.xlsx'):
                excel_link = urljoin(url, href)
                break

        if excel_link:
            logging.info(f'Found Excel link: {excel_link}')
            return jsonify({'excel_url': excel_link})
        else:
            logging.error('Excel link not found')
            return jsonify({'error': 'Excel link not found'}), 404
    else:
        logging.error(f'Error fetching page: {response.status_code}')
        return jsonify({
            'error': 'Erro ao acessar a página'
        })

@app.route('/api/fetch-rn-summary', methods=['POST'])
def fetch_rn_summary():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL não fornecida'}), 400

    try:
        response = requests.get(url)
    except requests.exceptions.RequestException as e:
        logging.error(f'Error fetching data from URL: {e}')
        return jsonify({'error': f'Error fetching data from URL: {e}'}), 500

    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        paragraphs = soup.find_all('p', class_='ementa')
        summary = "\n".join(p.get_text().strip() for p in paragraphs)
        return jsonify({'summary': summary})
    else:
        logging.error(f'Error fetching page: {response.status_code}')
        return jsonify({'error': 'Erro ao acessar a página da RN'}), 500

# Carrega a planilha
file_path = '/mnt/data/PORTES E VALORES - CBHPMS SITE.xlsx'
tabela_portes = pd.read_excel(file_path, sheet_name='TABELA 01')
tabela_portes_com_portes = pd.read_excel(file_path, sheet_name='TABELA COM PORTES')
tabela_portes_cbphm = pd.read_excel(file_path, sheet_name='PORTES CBHPM')

# Função auxiliar para calcular valores
def calcular_valores(tabela_portes, cbhpm_edicao, percentual_cirurgico, percentual_anestesico, multiplo, via_acesso, horario_especial, nova_regra_auxilio, acomodacao):
    # Implementar a lógica de cálculo com base nas instruções da planilha
    # Exemplo: Filtragem dos dados com base na edição da CBHPM, e cálculo dos valores
    pass

# API para buscar procedimento
@app.route('/api/buscar-procedimento', methods=['GET'])
def buscar_procedimento():
    nome_proc = request.args.get('nomenclatura', '')
    codigo_tuss = request.args.get('codigo_tuss', '')
    cbhpm_edicao = request.args.get('cbhpm_edicao', '')
    percentual_cirurgico = float(request.args.get('percentual_cirurgico', 0))
    percentual_anestesico = float(request.args.get('percentual_anestesico', 0))
    multiplo = request.args.get('multiplo', 'Não')
    via_acesso = request.args.get('via_acesso', 'Mesma via')
    horario_especial = request.args.get('horario_especial', 'Não')
    nova_regra_auxilio = request.args.get('nova_regra_auxilio', 'Não')
    acomodacao = request.args.get('acomodacao', 'Enfermaria')

    # Implementar a lógica de busca do procedimento
    # Filtrar pelo nome ou código TUSS, e calcular os valores com base nos parâmetros
    resultado = []  # Substituir pela lógica de busca e cálculo

    return jsonify(resultado)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
