from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
import logging

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
            if texto == 'ANEXO I' and href.endswith('.pdf'):
                anexo_links['I'] = urljoin(url, href)
            elif texto == 'ANEXO II' and href.endswith('.pdf'):
                anexo_links['II'] = urljoin(url, href)
            elif texto == 'ANEXO III' and href.endswith('.pdf'):
                anexo_links['III'] = urljoin(url, href)
            elif texto == 'ANEXO IV' and href.endswith('.pdf'):
                anexo_links['IV'] = urljoin(url, href)

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

        logging.info(f'Latest Anexo links: {anexo_links}')

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
    url = "https://www.gov.br/ans/pt-br/acesso-a-informacao/participacao-da-sociedade/atualizacao-do-rol-de-procedimentos"
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        excel_url = ""
        excel_tag = soup.find('a', href=True, text=lambda x: x and "Correlação TUSS x Rol" in x)
        if excel_tag:
            excel_url = urljoin(url, excel_tag['href'])
        return jsonify({"excel_url": excel_url})
    else:
        return jsonify({"error": "Erro ao acessar a página"})

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
