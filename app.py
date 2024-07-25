from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)
CORS(app)

@app.route('/api/fetch-ans-links', methods=['GET'])
def fetch_ans_links():
    url = 'https://www.ans.gov.br/component/legislacao/?view=legislacao&task=TextoLei&format=raw&id=NDAzMw==#anexosvigentes'
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        links = soup.find_all('a')

        latest_anexo_ii_link = None
        latest_anexo_ii_date = None
        latest_rn_links = []

        for link in links:
            text = link.get_text(strip=True)
            href = link.get('href')
            if 'Anexo II' in text and href:
                latest_anexo_ii_link = complete_url(href)
                latest_anexo_ii_date = extract_date_from_text(text)
            if 'Alterado pela RN' in text and href:
                latest_rn_links.append({
                    'url': complete_url(href),
                    'number': extract_rn_number_from_text(text),
                    'date': extract_date_from_text(text)
                })

        if latest_anexo_ii_link and latest_anexo_ii_date:
            latest_rn_links.sort(key=lambda x: x['date'], reverse=True)
            return jsonify({
                'latest_anexo_ii_link': latest_anexo_ii_link,
                'latest_anexo_ii_date': latest_anexo_ii_date,
                'latest_rn_links': latest_rn_links
            })
        else:
            return jsonify({'error': 'Nenhum anexo II encontrado'}), 404
    else:
        return jsonify({'error': 'Erro ao acessar a página da ANS'}), 500

def extract_date_from_text(text):
    match = re.search(r'\d{2}/\d{2}/\d{4}', text)
    return match.group(0) if match else None

def extract_rn_number_from_text(text):
    match = re.search(r'RN nº (\d+)', text)
    return match.group(1) if match else None

def complete_url(href):
    if href.startswith('http'):
        return href
    return f"https://www.ans.gov.br{href.replace('../../..', '')}"

if __name__ == '__main__':
    app.run()
