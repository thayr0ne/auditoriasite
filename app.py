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
                rn_match = re.search(r'RN nº (\d+), de', texto)
                if rn_match:
                    rn_num = int(rn_match.group(1))
                    rn_links.append((rn_num, texto, href))
            elif 'ANEXO II' in texto and href.endswith('.pdf'):
                anexo_ii_links.append(href)
        
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

        latest_anexo_ii_link = ""
        latest_anexo_ii_date = ""
        if anexo_ii_links:
            latest_anexo_ii_link = urljoin(url, anexo_ii_links[0])
            latest_anexo_ii_date_match = re.search(r'(\d{2}/\d{2}/\d{4})', anexo_ii_links[0])
            if latest_anexo_ii_date_match:
                latest_anexo_ii_date = latest_anexo_ii_date_match.group(1)

        return jsonify({
            'latest_rn_links': latest_rn_links,
            'latest_anexo_ii_link': latest_anexo_ii_link,
            'latest_anexo_ii_date': latest_anexo_ii_date
        })
    else:
        return jsonify({
            'error': 'Erro ao acessar a página'
        })

if __name__ == '__main__':
    app.run(debug=True)
