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
            text = link.get_text(strip=True)
            match_rn = re.search(r'RN nº (\d+), de (\d{2}/\d{2}/\d{4})', text)
            match_anexo_ii = re.search(r'Anexo II', text, re.IGNORECASE)
            if match_rn:
                rn_number = match_rn.group(1)
                rn_date = match_rn.group(2)
                rn_links.append((int(rn_number), rn_date, text, href))
            if match_anexo_ii and 'pdf' in href:
                anexo_ii_links.append((text, href))

        if rn_links:
            rn_links.sort(reverse=True, key=lambda x: x[0])
            latest_rn = {
                'number': rn_links[0][0],
                'date': rn_links[0][1],
                'text': rn_links[0][2],
                'link': urljoin(url, rn_links[0][3])
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
