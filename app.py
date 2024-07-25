from flask import Flask, jsonify
from flask_cors import CORS, cross_origin
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re

app = Flask(__name__)
CORS(app)  # Adicione esta linha para permitir CORS

@app.route('/api/fetch-ans-links')
@cross_origin()
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
                rn_match = re.search(r'RN nº (\d+), de', texto)
                if rn_match:
                    rn_num = int(rn_match.group(1))
                    rn_links.append((rn_num, texto, href))
            elif 'ANEXO II' in texto and href.endswith('.pdf'):
                anexo_ii_links.append(href)
        
        latest_rn_link = ""
        if rn_links:
            rn_links.sort(reverse=True, key=lambda x: x[0])
            _, _, rn_href = rn_links[0]
            latest_rn_link = urljoin(url, rn_href)

        latest_anexo_ii_link = ""
        if anexo_ii_links:
            latest_anexo_ii_link = urljoin(url, anexo_ii_links[0])

        return jsonify({
            'latest_rn_link': latest_rn_link,
            'latest_anexo_ii_link': latest_anexo_ii_link
        })
    else:
        return jsonify({
            'error': 'Erro ao acessar a página'
        })

if __name__ == '__main__':
    app.run(debug=True)
