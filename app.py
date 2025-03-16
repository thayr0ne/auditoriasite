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
CORS(app)  # libera para qualquer domínio (uso geral)

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
def fetch_rol_vigente():
    url = 'https://www.gov.br/ans/pt-br/acesso-a-informacao/participacao-da-sociedade/atualizacao-do-rol-de-procedimentos'
    response = requests.get(url)
    
    if response.status_code == 200:
        tuss_rol_url = pd.read_html(response.content, match='Rol')[0]['Link'].iloc[0]
        excel_content = requests.get(tuss_rol_url).content
        with open('/mnt/data/TUSSxROL.xlsx', 'wb') as f:
            f.write(response.content)
        return tuss_rol_url
    return None

@app.route('/api/fetch-rol-vigente', methods=['GET'])
def api_fetch_rol_vigente():
    # Retorno temporário para resolver erro imediato
    return jsonify({'error': 'Funcionalidade temporariamente desabilitada'}), 503

# Buscar procedimento e realizar cálculos
@app.route('/api/buscar-procedimento', methods=['GET'])
def buscar_procedimento():
    nome_proc = request.args.get('nomenclatura', '').strip()
    codigo_tuss = request.args.get('codigo_tuss', '').strip()
    cbhpm_edicao = request.args.get('cbhpm_edicao', '').strip()
    percentual_cirurgico = float(request.args.get('percentual_cirurgico', 0))

    tabela_portes = carregar_planilha('TABELA COM PORTES')

    if nome_proc:
        resultado = tabela_portes[tabela_portes['NOMENCLATURA'].str.contains(nome_proc, case=False)]
    elif codigo_tuss:
        resultado = tabela_portes[tabela_portes['CÓDIGO TUSS'] == int(codigo_tuss)]
    else:
        return jsonify([])

    resultado_final = []
    for _, row in resultado.iterrows():
        porte_cirurgico = row['PORTE CIRÚRGICO']
        valor_porte_cirurgico = calcular_valor_porte(porte_cirurgico, cbhpm_edicao, percentual_cirurgico)
        num_auxiliares = row.get('NÚMERO DE AUXILIARES', 0)
        valor_auxiliar = valor_porte_cirurgico * 0.3 * num_auxiliares
        porte_anestesico = row.get('PORTE ANESTÉSICO', 0)
        valor_porte_anestesico = calcular_valor_porte(porte_anestesico, cbhpm_edicao, percentual_cirurgico)
        correlacao_rol_vigente = verificar_correlacao_rol(row['CÓDIGO TUSS'])

        resultado_final.append({
            'nomenclatura': row['NOMENCLATURA'],
            'codigo_tuss': row['CÓDIGO TUSS'],
            'porte_cirurgico': porte_cirurgico,
            'valor_porte_cirurgico': valor_porte_cirurgico,
            'num_auxiliares': num_auxiliares,
            'valor_auxiliar': valor_auxiliar,
            'porte_anestesico': row.get('PORTE ANESTÉSICO', ''),
            'valor_porte_anestesico': valor_porte_anestesico,
            'correlacao_rol_vigente': correlacao_rol_vigente
        })

    return jsonify(resultado_final)



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
