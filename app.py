from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import pandas as pd
import io
import openpyxl

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Permitir todas as origens

@app.route('/api/fetch-rol-vigente', methods=['GET'])
def fetch_rol_vigente():
    url = 'https://www.gov.br/ans/pt-br/acesso-a-informacao/participacao-da-sociedade/atualizacao-do-rol-de-procedimentos'
    response = requests.get(url)
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        excel_link = soup.find('a', string='Correlação TUSS x Rol')
        if excel_link:
            excel_url = urljoin(url, excel_link['href'])
            return jsonify({'excel_url': excel_url})
        else:
            return jsonify({'error': 'Link do Excel não encontrado'}), 404
    else:
        return jsonify({'error': 'Erro ao acessar a página da ANS'}), 500

@app.route('/api/fetch-limited-rol', methods=['GET'])
def fetch_limited_rol():
    url = 'https://www.gov.br/ans/pt-br/acesso-a-informacao/participacao-da-sociedade/atualizacao-do-rol-de-procedimentos/CorrelaoTUSS.2021Rol.2021_RN610.RN611.RN612.xlsx'
    response = requests.get(url)

    if response.status_code == 200:
        file_data = response.content
        excel_data = pd.read_excel(io.BytesIO(file_data), engine='openpyxl', header=None)
        limited_data = excel_data.iloc[6:]  # Exibir a partir da linha 7 (índice 6)

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            limited_data.to_excel(writer, index=False, header=False)
        output.seek(0)
        
        return send_file(output, attachment_filename="limited_rol.xlsx", as_attachment=True)
    else:
        return jsonify({'error': 'Erro ao acessar o arquivo Excel'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
