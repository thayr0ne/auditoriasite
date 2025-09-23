import pandas as pd

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# =========================================================================
# CARREGAR A PLANILHA E AJUSTAR OS DADOS
# =========================================================================
google_drive_link = "https://drive.google.com/uc?export=download&id=1EBlt886g7wQ45-9B2KfvkgNqWI2VUBrw"
file_path = "/tmp/PORTES_E_VALORES_CBHPMS_SITE.xlsx"

# Baixar a planilha do Google Drive
response = requests.get(google_drive_link, allow_redirects=True)
if response.status_code == 200:
    with open(file_path, "wb") as f:
        f.write(response.content)
    print("✅ Planilha baixada com sucesso!")
else:
    raise Exception(f"❌ Erro ao baixar planilha: {response.status_code}")

# Carregar os dados das abas relevantes
xls = pd.ExcelFile(file_path)
df_procedimentos = pd.read_excel(xls, sheet_name="TABELA COM PORTES")
df_portes = pd.read_excel(xls, sheet_name="PORTES CBHPM")

# Renomear colunas para facilitar o acesso no código
df_procedimentos.rename(columns={
    "Unnamed: 0": "Código do Procedimento",
    "usar essa planilha para consultar os detalhes de um determinado procedimento, como porte do código, custo operacional, número de auxiliares, porte anestésico, etc": "Descrição do Procedimento",
    "Unnamed: 2": "MULTI PORTE",
    "Unnamed: 3": "Porte Cirúrgico",
    "Unnamed: 4": "UCO",
    "Unnamed: 5": "Nº de Auxiliares",
    "Unnamed: 6": "Porte Anestésico",
    "Unnamed: 7": "Filme ou Doc",
    "Unnamed: 8": "Radiofármaco"
}, inplace=True)

# Remover possíveis linhas vazias (caso existam)
df_procedimentos.dropna(subset=["Código do Procedimento", "Descrição do Procedimento"], inplace=True)

# =========================================================================
# ROTA PARA BUSCAR PROCEDIMENTOS
# =========================================================================
@app.route("/api/buscar_procedimentos", methods=["GET"])
def buscar_procedimentos():
    # Recebe o termo de busca
    termo = request.args.get("termo", "").strip().lower()

    if not termo:
        return jsonify({"results": [], "msg": "Nenhum termo informado"}), 200

    # Filtrar no DataFrame pelos campos relevantes
    df_filtrado = df_procedimentos[
        df_procedimentos["Descrição do Procedimento"].str.lower().str.contains(termo, na=False)
        | df_procedimentos["Código do Procedimento"].astype(str).str.contains(termo, na=False)
    ]

    # Limitar a 50 resultados
    df_filtrado = df_filtrado.head(50)

    # Converter para JSON
    resultados = df_filtrado.to_dict(orient="records")
    return jsonify({"results": resultados, "count": len(resultados)})
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
@@ -80,6 +100,23 @@ def verificar_correlacao_rol(codigo_tuss):
    else:
        return "Não"

# API para buscar procedimento
@app.route('/api/buscar-procedimento', methods=['GET'])
def buscar_procedimento_api():
    nome_proc = request.args.get('nomenclatura', '')
    codigo_tuss = request.args.get('codigo_tuss', '')
    cbhpm_edicao = request.args.get('cbhpm_edicao', '')
    percentual_cirurgico = float(request.args.get('percentual_cirurgico', 0))
    percentual_anestesico = float(request.args.get('percentual_anestesico', 0))
    multiplo = request.args.get('multiplo', 'Não')
    via_acesso = request.args.get('via_acesso', 'Mesma via')
    horario_especial = request.args.get('horario_especial', 'Não')
    nova_regra_auxilio = request.args.get('nova_regra_auxilio', 'Não')
    acomodacao = request.args.get('acomodacao', 'Enfermaria')

    resultado = buscar_procedimento(nome_proc, codigo_tuss, cbhpm_edicao, percentual_cirurgico, percentual_anestesico, multiplo, via_acesso, horario_especial, nova_regra_auxilio, acomodacao)

    return jsonify(resultado)

# Funções para buscar RNs e Anexos mais recentes
def fetch_ans_links():
@@ -145,8 +182,6 @@ def fetch_rn_summary():
        return jsonify({'summary': summary})
    else:
        return jsonify({'error': 'Erro ao acessar a página da RN'}), 500
# =========================================================================
# EXECUTAR A APLICAÇÃO FLASK
# =========================================================================
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
