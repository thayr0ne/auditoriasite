from flask import Flask, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route('/api/fetch-ans-links', methods=['GET'])
def fetch_ans_links():
    url = 'https://www.ans.gov.br/component/legislacao/?view=legislacao&task=TextoLei&format=raw&id=NDAzMw==#anexosvigentes'
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        links = soup.find_all('a')

        latest_anexo_ii_link = ""
        latest_anexo_ii_date = ""
        latest_rn_links = []

        for link in links:
            href = link.get('href')
            text = link.get_text(strip=True)
            if 'Anexo II' in text and href.endswith('.pdf'):
                latest_anexo_ii_link = 'https://www.ans.gov.br' + href.replace('../../../', '/')
            if 'RN nº' in text:
                rn_number = text.split('nº')[-1].split(' ')[0]
                rn_date = text.split('(')[-1].replace(')', '')
                latest_rn_links.append({
                    "number": rn_number,
                    "date": rn_date,
                    "url": 'https://www.ans.gov.br' + href
                })

        if latest_rn_links:
            latest_rn_links = sorted(latest_rn_links, key=lambda x: x['date'], reverse=True)
            latest_anexo_ii_date = latest_rn_links[0]['date']

        return jsonify({
            "latest_anexo_ii_link": latest_anexo_ii_link,
            "latest_anexo_ii_date": latest_anexo_ii_date,
            "latest_rn_links": latest_rn_links
        })

    return jsonify({"error": "Erro ao obter os links"}), 500

if __name__ == '__main__':
    app.run()
