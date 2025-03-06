from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re
import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Permitir todas as origens

# Caminho do arquivo principal
file_path = '/mnt/data/PORTES E VALORES - CBHPMS SITE.xlsx'

# Carregar as planilhas principais
tabela_portes = pd.read_excel(file_path, sheet_name='TABELA 01')
tabela_portes_com_portes = pd.read_excel(file_path, sheet_name='TABELA COM PORTES')
tabela_portes_cbphm = pd.read_excel(file_path, sheet_name='PORTES CBHPM')

tuss_rol_url = None

def fetch_rol_vigente():
    global tuss_rol_url
    url = 'https://www.gov.br/ans/pt-br/acesso-a-informacao/participacao-da-sociedade/atualizacao-do-rol-de-procedimentos'
    
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        excel_link = soup.find('a', string="Correlação TUSS x Rol")
        if excel_link:
            tuss_rol_url = excel_link['href']
            response = requests.get(tuss_rol_url)
            if response.status_code == 200:
                with open('/mnt/data/TUSSxROL.xlsx', 'wb') as f:
                    f.write(response.content)
                return tuss_rol_url
            else:
                return None
        else:
            return None
    else:
        return None

@app.route('/api/fetch-rol-vigente', methods=['GET'])
def fetch_rol_vigente_api():
    global tuss_rol_url
    tuss_rol_url = fetch_rol_vigente()
    
    if tuss_rol_url:
        return jsonify({'excel_url': tuss_rol_url})
    else:
        return jsonify({'error': 'Link do Excel não encontrado'})

# Função para buscar e calcular valores dos procedimentos
def buscar_procedimento(nome_proc, codigo_tuss, cbhpm_edicao, percentual_cirurgico, percentual_anestesico, multiplo, via_acesso, horario_especial, nova_regra_auxilio, acomodacao):
    if nome_proc:
        resultado = tabela_portes[tabela_portes['NOMENCLATURA'].str.contains(nome_proc, case=False)]
    elif codigo_tuss:
        resultado = tabela_portes[tabela_portes['CÓDIGO TUSS'] == int(codigo_tuss)]
    else:
        return []

    resultado_final = []
    for _, row in resultado.iterrows():
        porte_cirurgico = row['PORTE CIRÚRGICO']
        valor_porte_cirurgico = calcular_valor_porte(porte_cirurgico, cbhpm_edicao, percentual_cirurgico)
        
        num_auxiliares = row['NÚMERO DE AUXILIARES']
        valor_auxiliar = valor_porte_cirurgico * 0.3 * num_auxiliares
        porte_anestesico = row['PORTE ANESTÉSICO']
        valor_porte_anestesico = calcular_valor_porte(porte_anestesico, cbhpm_edicao, percentual_anestesico)
        
        correlacao_rol_vigente = verificar_correlacao_rol(row['CÓDIGO TUSS'])
        
        resultado_final.append({
            'nomenclatura': row['NOMENCLATURA'],
            'codigo_tuss': row['CÓDIGO TUSS'],
            'porte_cirurgico': porte_cirurgico,
            'valor_porte_cirurgico': valor_porte_cirurgico,
            'num_auxiliares': num_auxiliares,
            'valor_auxiliar': valor_auxiliar,
            'porte_anestesico': porte_anestesico,
            'valor_porte_anestesico': valor_porte_anestesico,
            'correlacao_rol_vigente': correlacao_rol_vigente
        })

    return resultado_final

# Função para calcular o valor do porte com base na edição CBHPM
def calcular_valor_porte(porte, edicao, percentual):
    valor_base = tabela_portes_cbphm[(tabela_portes_cbphm['PORTE'] == porte) & (tabela_portes_cbphm['EDIÇÃO'] == edicao)]['VALOR'].values[0]
    return valor_base * (1 + percentual / 100)

# Função para verificar a correlação com o Rol Vigente
def verificar_correlacao_rol(codigo_tuss):
    tabela_tuss_rol = pd.read_excel('/mnt/data/TUSSxROL.xlsx')
    correlacao = tabela_tuss_rol[tabela_tuss_rol['CÓDIGO TUSS'] == codigo_tuss]['Correlação (Sim/Não)'].values
    if len(correlacao) > 0 and correlacao[0] == 'Sim':
        return "Sim"
    else:
        return "Não"

# API para buscar procedimento
@app.route('/api/buscar-procedimento', methods=['GET'])
def buscar_procedimento_api():
    nome_proc = request.args.get('nomenclatura', '').strip()
    codigo_tuss = request.args.get('codigo_tuss', '').strip()
    cbhpm_edicao = request.args.get('cbhpm_edicao', '').strip()
    
    if not nome_proc and not codigo_tuss:
        return jsonify({'error': 'Informe pelo menos um parâmetro para busca'}), 400
    
    if tabela_portes.empty:
        return jsonify({'error': 'Erro ao carregar a base de dados'}), 500

    try:
        resultado = buscar_procedimento(nome_proc, codigo_tuss, cbhpm_edicao)
        
        if not resultado:
            return jsonify([])  # Retornar lista vazia caso não encontre nada
        return jsonify(resultado)
    
    except Exception as e:
        print(f'Erro na busca de procedimentos: {e}')
        return jsonify({'error': 'Erro interno na busca'}), 500

# Funções para buscar RNs e Anexos mais recentes
def fetch_ans_links():
    url = 'https://www.ans.gov.br/component/legislacao/?view=legislacao&task=TextoLei&format=raw&id=NDAzMw==#anexosvigentes'
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        links = soup.find_all('a')

        rn_links = []
        anexo_links = {'I': '', 'II': '', 'III': '', 'IV': ''}
        for link in links:
            href = link.get('href')
            texto = link.get_text().strip()
            if 'Alterado pela RN' in texto:
                rn_match = re.search(r'RN nº (\d+), de', texto)
                if rn_match:
                    rn_num = int(rn_match.group(1))
                    rn_links.append((rn_num, texto, href))
            for anexo in anexo_links.keys():
                if re.search(rf'\bANEXO {anexo}\b', texto) and href.endswith('.pdf'):
                    anexo_links[anexo] = urljoin(url, href)

        rn_links = list(dict.fromkeys(rn_links))  # Remove duplicatas
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

        return jsonify({
            'latest_rn_links': latest_rn_links,
            'latest_anexo_links': anexo_links
        })
    else:
        return jsonify({
            'error': 'Erro ao acessar a página'
        })

@app.route('/api/fetch-ans-links', methods=['GET'])
def fetch_ans_links_api():
    return fetch_ans_links()

@app.route('/api/fetch-rn-summary', methods=['POST'])
def fetch_rn_summary():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL não fornecida'}), 400

    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        paragraphs = soup.find_all('p', class_='ementa')
        summary = "\n".join(p.get_text().strip() for p in paragraphs)
        return jsonify({'summary': summary})
    else:
        return jsonify({'error': 'Erro ao acessar a página da RN'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
