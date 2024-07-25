from flask import Flask, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re

app = Flask(__name__)
CORS(app)

@app.route('/api/fetch-ans-links')
def fetch_ans_links():
    url = 'https://www.ans.gov.br/component/legislacao/?view=legislacao&task=TextoLei&format=raw&id=NDAzMw==#anexosvigentes'
    response = requests.get(url)
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        links = soup.find_all('a')
        
        rn_links = []
        anexo_ii_links = []
        for link in links:
            href = link.get('href')
            texto = link.get_text().strip()
            if 'Alterado pela RN' in texto:
                rn_match = re.search(r'RN nº (\d+), de (\d{2}/\d{2}/\d{4})', texto)
                if rn_match:
                    rn_num = int(rn_match.group(1))
                    rn_date = rn_match.group(2)
                    rn_links.append((rn_num, rn_date, texto, href))
            elif 'ANEXO II' in texto and href.endswith('.pdf'):
                anexo_ii_links.append((texto, href))
        
        latest_rn = {
            'number': None,
            'date': None,
            'text': None,
            'link': None
        }
        if rn_links:
            rn_links.sort(reverse=True, key=lambda x: x[0])
            rn_num, rn_date, rn_text, rn_href = rn_links[0]
            latest_rn = {
                'number': rn_num,
                'date': rn_date,
                'text': rn_text,
                'link': urljoin(url, rn_href)
            }

        latest_anexo_ii = {
            'text': None,
            'link': None
        }
        if anexo_ii_links:
            latest_anexo_ii = {
                'text': anexo_ii_links[-1][0],
                'link': urljoin(url, anexo_ii_links[-1][1])
            }
        
        return jsonify({
            'latest_rn': latest_rn,
            'latest_anexo_ii': latest_anexo_ii,
            'history': [
                {
                    'text': text,
                    'link': urljoin(url, href)
                } for _, _, text, href in rn_links[1:]
            ]
        })

    return jsonify({'error': 'Erro ao acessar a página da ANS.'}), 500

if __name__ == '__main__':
    app.run(debug=True)
