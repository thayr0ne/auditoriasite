from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)
CORS(app)

def fetch_ans_links():
    url = "https://www.ans.gov.br/component/legislacao/?view=legislacao&task=TextoLei&format=raw&id=NDAzMw==#anexosvigentes"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    anexo_links = {"I": "", "II": "", "III": "", "IV": ""}
    anexo_tags = soup.find_all('a', href=True)

    for tag in anexo_tags:
        href = tag['href']
        if "Anexo I" in tag.text:
            anexo_links["I"] = "https://www.ans.gov.br" + href.replace('../../../', '/')
        elif "Anexo II" in tag.text:
            anexo_links["II"] = "https://www.ans.gov.br" + href.replace('../../../', '/')
        elif "Anexo III" in tag.text:
            anexo_links["III"] = "https://www.ans.gov.br" + href.replace('../../../', '/')
        elif "Anexo IV" in tag.text:
            anexo_links["IV"] = "https://www.ans.gov.br" + href.replace('../../../', '/')

    rn_links = []
    rn_tags = soup.find_all('a', href=True, text=lambda x: x and 'RN' in x)
    for tag in rn_tags:
        rn_number = int(tag.text.split(' ')[-1])
        rn_date = tag.find_next('p').text if tag.find_next('p') else "N/A"
        rn_url = "https://www.ans.gov.br" + tag.get('href').replace('../../../', '/')
        rn_links.append({"number": rn_number, "date": rn_date, "url": rn_url})
    
    # Remove duplicated RNs and sort by number descending
    rn_links = sorted({v['number']: v for v in rn_links}.values(), key=lambda x: x['number'], reverse=True)

    return {"latest_anexo_links": anexo_links, "latest_rn_links": rn_links}

@app.route('/api/fetch-ans-links')
def fetch_ans_links_route():
    try:
        data = fetch_ans_links()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)})

def fetch_rol_vigente():
    url = "https://www.gov.br/ans/pt-br/acesso-a-informacao/participacao-da-sociedade/atualizacao-do-rol-de-procedimentos"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    excel_url = ""
    excel_tag = soup.find('a', href=True, text=lambda x: x and "Correlação TUSS x Rol" in x)
    if excel_tag:
        excel_url = "https://www.gov.br" + excel_tag['href']
    
    return {"excel_url": excel_url}

@app.route('/api/fetch-rol-vigente')
def fetch_rol_vigente_route():
    try:
        data = fetch_rol_vigente()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/api/fetch-rn-summary', methods=['POST'])
def fetch_rn_summary():
    data = request.json
    url = data.get('url')
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    summary = ""
    ementa_tag = soup.find('p', class_='ementa')
    if ementa_tag:
        summary = ementa_tag.text.strip()

    return jsonify({"summary": summary})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
