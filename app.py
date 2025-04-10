from flask import Flask, jsonify, request
import pandas as pd
import os
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin
from functools import lru_cache



print("Caminho atual do script:", os.path.abspath(__file__))
print("Conteúdo da pasta dados:", os.listdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dados')))

from flask_cors import CORS
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# Caminho absoluto, usando o diretório atual do script
EXCEL_PATH = os.getenv(
    'EXCEL_PATH', 
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dados', 'PORTES E VALORES - CBHPMS  SITE.xlsx')
)

# Função para carregar e manter dados em memória (Cache)

# Função com debug para mostrar as abas existentes no Excel
def carregar_planilha(sheet_name):
    excel = pd.ExcelFile(EXCEL_PATH)
    print("Abas disponíveis no Excel:", excel.sheet_names)  # <-- vai mostrar no log do Render
    return excel.parse(sheet_name=sheet_name)

# Carregar planilhas em cache no início do aplicativo com o nome correto das abas
tabela_portes = carregar_planilha('TABELA COM PORTES')
tabela_portes_valores = carregar_planilha('PORTES CBHPM')

# Buscar e salvar Rol Vigente da ANS
@app.route('/api/fetch-rol-vigente', methods=['GET'])
def api_fetch_rol_vigente():
    try:
        url = fetch_rol_vigente()
        if url:
            return jsonify({'excel_url': url})
        return jsonify({'error': 'Link não encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Buscar procedimento e realizar cálculos
# Modificação feita: adicionado tratamento de erros claros e retorno adequado (comentado no código)
@app.route('/api/buscar-procedimento', methods=['GET'])
def buscar_procedimento():
    try:
        nome_proc = request.args.get('nomenclatura', '').strip()
        codigo_tuss = request.args.get('codigo_tuss', '').strip()
        cbhpm_edicao = request.args.get('cbhpm_edicao', '').strip()
        percentual_cirurgico = float(request.args.get('percentual_cirurgico', 0))
        percentual_anestesico = float(request.args.get('percentual_anestesico', 0))

        tabela_portes = carregar_planilha('TABELA COM PORTES')

        if nome_proc:
            resultado = tabela_portes[tabela_portes['NOMENCLATURA'].str.contains(nome_proc, case=False)]
        elif codigo_tuss:
            resultado = tabela_portes[tabela_portes['CÓDIGO TUSS'] == int(codigo_tuss)]
        else:
            return jsonify({'erro': 'Informe nome ou código do procedimento.'}), 400

        if resultado.empty:
            return jsonify([]), 200

        resultado_final = resultado.to_dict(orient='records')
        return jsonify(resultado_final)

    except Exception as e:
        return jsonify({'erro': str(e)}), 500



def calcular_valor_porte(porte, edicao, percentual):
    tabela_portes_cbphm = carregar_planilha('PORTES CBHPM')
    valor_base = tabela_portes_cbphm.loc[
        (tabela_portes_cbphm['PORTE'] == porte) & (tabela_portes_cbphm['EDIÇÃO'] == edicao), 'VALOR'
    ].values

    if valor_base.size > 0:
        return valor_base[0] * (1 + percentual / 100)
    return 0

def verificar_correlacao_rol(codigo_tuss):
    tabela_tuss_rol = pd.read_excel('/mnt/data/TUSSxROL.xlsx')
    correlacao = tabela_tuss_rol[tabela_tuss_rol['CÓDIGO TUSS'] == codigo_tuss]['Correlação (Sim/Não)'].values
    return "Sim" if correlacao.size > 0 and correlacao[0] == 'Sim' else "Não"

# Funções fetch_ans_links e fetch_rn_summary precisam da biblioteca BeautifulSoup
from bs4 import BeautifulSoup

@app.route('/api/fetch-ans-links', methods=['GET'])
def fetch_ans_links():
    url = 'https://www.ans.gov.br/component/legislacao/?view=legislacao&task=TextoLei&format=raw&id=NDAzMw==#anexosvigentes'
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        links = [a['href'] for a in soup.find_all('a', href=True)]
        return jsonify({'links': links})
    return jsonify({'error': 'Erro ao buscar links da ANS'}), 500

@app.route('/api/fetch-rn-summary', methods=['POST'])
def fetch_rn_summary():
    data = request.get_json()
    url = data.get('url')
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        ementa = soup.find('p', class_='ementa')
        return jsonify({'summary': ementa.get_text().strip() if ementa else ''})
    return jsonify({'error': 'Erro ao acessar página da RN'}), 500

# Final do arquivo app.py
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
