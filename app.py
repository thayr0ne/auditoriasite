from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
import logging

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Permitir todas as origens

# Configurar logging
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
        anexo_ii_links = []
        for link in links:
            href = link.get('href')
            texto = link.get_text().strip()
            if 'Alterado pela RN' in texto:
                rn_match = re.search(r'RN nº (\d+), de', texto)
                if rn_match:
                    rn_num = int(rn_match.group(1))
                    rn_links.append((rn_num, texto, href))
            elif 'ANEXO II' in texto and href.endswith('.pdf'):
                anexo_ii_links.append((texto, href))
        
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

        latest_anexo_ii_link = ""
        latest_anexo_ii_date = ""
        if anexo_ii_links:
            latest_anexo_ii_text, latest_anexo_ii_href = anexo_ii_links[0]
            latest_anexo_ii_link = urljoin(url, latest_anexo_ii_href)
            # Adicionar logging para texto e href
            logging.info(f'Latest Anexo II text: {latest_anexo_ii_text}')
            logging.info(f'Latest Anexo II href: {latest_anexo_ii_href}')
            # Buscar pela data dentro do texto
            latest_anexo_ii_date_match = re.search(r'(\d{2}/\d{2}/\d{4})', latest_anexo_ii_text)
            if latest_anexo_ii_date_match:
                latest_anexo_ii_date = latest_anexo_ii_date_match.group(1)
            else:
                # Se não encontrar a data, verificar em outros textos
                for _, href in anexo_ii_links:
                    text_content = requests.get(urljoin(url, href)).text
                    date_match = re.search(r'(\d{2}/\d{2}/\d{4})', text_content)
                    if date_match:
                        latest_anexo_ii_date = date_match.group(1)
                        break
                if not latest_anexo_ii_date:
                    logging.warning(f'Date not found in Anexo II text: {latest_anexo_ii_text}')

        logging.info(f'Latest Anexo II link: {latest_anexo_ii_link}, date: {latest_anexo_ii_date}')

        return jsonify({
            'latest_rn_links': latest_rn_links,
            'latest_anexo_ii_link': latest_anexo_ii_link,
            'latest_anexo_ii_date': latest_anexo_ii_date
        })
    else:
        logging.error(f'Error fetching page: {response.status_code}')
        return jsonify({
            'error': 'Erro ao acessar a página'
        })

@app.route('/api/fetch-rn-summary', methods=['POST'])
def fetch_rn_summary():
    data = request.get_json()
    url = data.get('url')
    logging.info(f'Fetching summary for URL: {url}')
    if not url:
        logging.error('URL não fornecida')
        return jsonify({'error': 'URL não fornecida'}), 400

    try:
        response = requests.get(url)
    except requests.exceptions.RequestException as e:
        logging.error(f'Error fetching data from URL: {e}')
        return jsonify({'error': f'Error fetching data from URL: {e}'}), 500
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        paragraphs = soup.find_all('p', align='right')
        logging.info(f'Found {len(paragraphs)} paragraphs with right alignment')
        summary = "\n".join(p.get_text().strip() for p in paragraphs)
        if not summary:
            # Tentar outro método se não houver parágrafos alinhados à direita
            first_paragraph = soup.find('p')
            if first_paragraph:
                summary = first_paragraph.get_text().strip()
                logging.info(f'Using first paragraph as summary: {summary}')
            else:
                logging.warning('No summary found')
        logging.info(f'Summary found: {summary}')
        return jsonify({'summary': summary})
    else:
        logging.error(f'Error fetching summary: {response.status_code}')
        return jsonify({'error': 'Erro ao acessar a página da RN'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
