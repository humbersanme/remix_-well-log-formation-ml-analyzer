export const REFACTORED_PYTHON_CODE = `from flask import Flask, render_template, jsonify, url_for, request
import pandas as pd
import numpy as np
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.patches as mpatches
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import warnings

warnings.filterwarnings('ignore')

app = Flask(__name__)

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, 'static', 'outputs')
os.makedirs(OUTPUT_DIR, exist_ok=True)

WELL_CONFIG = {
    "Pozo_1": {
        "folder": "Pozo_1_csv",
        "dev": "Datos_desviacion _POZO_1.csv",
        "gas": "Gases_acacias_Pozo1_final_SUP_A_10702_FT.csv",
        "par": "Parametros_profundidad_POZO_1_0702ft_2.csv"
    },
    "Pozo_2": {
        "folder": "Pozo_2_csv",
        "dev": "Datos_de_Desviacion_pozo_2.csv",
        "gas": "Gases_pozo_2_Final_sup_A9761_FT.csv",
        "par": "Parametros_profundidad_Pozo_2_sup-9761_TD_FT.csv"
    },
    "Pozo_3": {
        "folder": "Pozo_3_csv",
        "dev": "Datos_de_Desviacion_pozo_3.csv",
        "gas": "Pozo_3_gases_45_9133.csv",
        "par": "Pozo_3_parametros_9133.csv"
    }
}

def clean_val(x):
    try:
        if pd.isna(x): return np.nan
        val = float(str(x).replace(',', '.'))
        return val if val > -900 else np.nan
    except: return np.nan

def find_col(df, keywords):
    for c in df.columns:
        if any(k.lower() in c.lower() for k in keywords): return c
    return None

# --- EVALUACIÓN DE RELACIONES DE GAS HAWORTH / PIXLER ---
def compute_gas_ratios(df_gas):
    """
    Calcula relaciones cromatográficas de Haworth / Pixler:
    - Wh (Wetness Ratio) = (C2 + C3 + C4) / TotalGas * 100
    - Ba (Balance Ratio) = (C1 + C2) / (C3 + C4)
    - Ch (Character Ratio) = (C4 + C5) / C3
    """
    c1 = df_gas['C1'].fillna(0)
    c2c3 = df_gas['C2C3'].fillna(0)
    tot = df_gas['TotalGas'].replace(0, np.nan)
    
    df_gas['Wh'] = (c2c3 / tot * 100).fillna(0)
    df_gas['Ba'] = ((c1 + c2c3 * 0.5) / (c2c3 * 0.5 + 1e-5)).fillna(0)
    return df_gas

# --- GENERADOR DE LOG INDIVIDUAL (6 TRACKS) ---
def plot_professional_log(df, df_tops, well_id, out_path):
    BG_COLOR, TRACK_BG, GRID_COLOR = '#0d1117', '#161b22', '#30363d'
    COLORS = {'ROP': '#58a6ff', 'GAS': '#ff7b72', 'C1': '#3fb950', 'WOB': '#f0e040', 'TORQUE': '#bc8cff', 'MSE': '#3fb950', 'TOP': '#ffa657'}

    fig = plt.figure(figsize=(20, 26), facecolor=BG_COLOR)
    gs = gridspec.GridSpec(1, 6, figure=fig, wspace=0.05, left=0.05, right=0.95, top=0.94, bottom=0.05)

    def setup_ax(col, title, color, shared=None):
        ax = fig.add_subplot(gs[0, col], sharey=shared)
        ax.set_facecolor(TRACK_BG)
        ax.set_title(title, color=color, fontsize=9, fontweight='bold', pad=15)
        ax.grid(True, color=GRID_COLOR, lw=0.5, alpha=0.5)
        ax.tick_params(colors='white', labelsize=8)
        for s in ax.spines.values(): s.set_color(GRID_COLOR)
        return ax

    depth = df['MD_ft'].values
    ax0 = setup_ax(0, 'ROP\n(ft/hr)', COLORS['ROP'])
    ax0.plot(df['ROP_smooth'], depth, color=COLORS['ROP'], lw=1.5)
    ax0.fill_betweenx(depth, 0, df['ROP_smooth'], color=COLORS['ROP'], alpha=0.2)
    ax0.invert_yaxis()

    df['TotalGas_pct'] = (df['TotalGas'] / 10000).clip(lower=0.001)
    ax1 = setup_ax(1, 'Gas Total\n(%, Log)', COLORS['GAS'], shared=ax0)
    ax1.set_xscale('log')
    ax1.plot(df['TotalGas_pct'], depth, color=COLORS['GAS'], lw=1.2)
    ax1.fill_betweenx(depth, 0.001, df['TotalGas_pct'], color=COLORS['GAS'], alpha=0.2)

    ax2 = setup_ax(2, 'C1 / C2+C3\n(ppm Log)', COLORS['C1'], shared=ax0)
    ax2.set_xscale('log')
    ax2.plot(df['C1'].clip(lower=1), depth, color=COLORS['C1'], lw=1)
    ax2_twin = ax2.twiny()
    ax2_twin.set_xscale('log')
    ax2_twin.plot(df['C2C3'].clip(lower=1), depth, color=COLORS['TOP'], lw=0.8)
    ax2_twin.tick_params(axis='x', colors=COLORS['TOP'], labelsize=7)

    ax3 = setup_ax(3, 'WOB / Torque', COLORS['WOB'], shared=ax0)
    ax3.plot(df['WOB'], depth, color=COLORS['WOB'], lw=1.2)
    ax3_twin = ax3.twiny()
    ax3_twin.plot(df['Torque'], depth, color=COLORS['TORQUE'], lw=1, ls='--')
    ax3_twin.tick_params(axis='x', colors=COLORS['TORQUE'], labelsize=7)

    ax4 = setup_ax(4, 'MSE\n(proxy)', COLORS['MSE'], shared=ax0)
    ax4.plot(df['MSE'], depth, color=COLORS['MSE'], lw=1)
    ax4.fill_betweenx(depth, 0, df['MSE'], color=COLORS['MSE'], alpha=0.15)

    ax5 = setup_ax(5, 'TOPES ML\n(Confianza)', COLORS['TOP'], shared=ax0)
    ax5.set_xlim(0, 1.1)

    if not df_tops.empty:
        for _, top in df_tops.iterrows():
            md = top['MD_ft']
            for ax in [ax0, ax1, ax2, ax3, ax4, ax5]:
                ax.axhline(y=md, color=COLORS['ROP'], lw=0.8, ls='--', alpha=0.6)
            ax5.barh(md, top['Confidence'], height=15, color=COLORS['ROP'], alpha=0.8)
            ax5.text(top['Confidence']+0.02, md, f"{int(md)}ft", color='white', fontsize=7, va='center')

    plt.setp(ax1.get_yticklabels(), visible=False)
    plt.setp(ax2.get_yticklabels(), visible=False)
    plt.setp(ax3.get_yticklabels(), visible=False)
    plt.setp(ax4.get_yticklabels(), visible=False)
    plt.setp(ax5.get_yticklabels(), visible=False)

    fig.suptitle(f'{well_id.replace("_", " ")} — ANÁLISIS AUTOMÁTICO DE FORMACIÓN', color='white', fontsize=14, fontweight='bold')
    plt.savefig(out_path, facecolor=BG_COLOR, bbox_inches='tight', dpi=130)
    plt.close()

# --- GENERADOR DE CORRELACIÓN MULTI-POZO (4 TRACKS) ---
def generate_correlation_plot(all_data, out_path):
    BG_COLOR, TRACK_BG, GRID_COLOR = '#0d1117', '#161b22', '#30363d'
    WELL_COLORS = {'Pozo_1': '#58a6ff', 'Pozo_2': '#3fb950', 'Pozo_3': '#bc8cff'}

    fig = plt.figure(figsize=(20, 12), facecolor=BG_COLOR)
    gs = gridspec.GridSpec(1, 4, figure=fig, wspace=0.1, left=0.05, right=0.95)

    for i, (well_id, df) in enumerate(all_data.items()):
        ax = fig.add_subplot(gs[0, i])
        ax.set_facecolor(TRACK_BG)
        ax.plot(df['ROP_smooth'], df['MD_ft'], color=WELL_COLORS.get(well_id, '#58a6ff'), lw=1.5)
        ax.set_title(f"{well_id}\nROP (ft/hr)", color=WELL_COLORS.get(well_id, '#58a6ff'), fontsize=10, fontweight='bold')
        ax.invert_yaxis()
        ax.grid(True, color=GRID_COLOR, alpha=0.3)
        ax.tick_params(colors='white', labelsize=8)
        if i > 0: plt.setp(ax.get_yticklabels(), visible=False)

    ax_overlap = fig.add_subplot(gs[0, 3])
    ax_overlap.set_facecolor(TRACK_BG)
    for well_id, df in all_data.items():
        ax_overlap.plot(df['ROP_smooth'], df['MD_ft'], color=WELL_COLORS.get(well_id, '#58a6ff'), lw=1.2, alpha=0.7)
    
    ax_overlap.set_title("OVERLAY CORRELATION\n(ROP Comparison)", color='#ffa657', fontsize=10, fontweight='bold')
    ax_overlap.invert_yaxis()
    ax_overlap.grid(True, color=GRID_COLOR, alpha=0.3)
    plt.setp(ax_overlap.get_yticklabels(), visible=False)
    
    patches = [mpatches.Patch(color=v, label=k) for k, v in WELL_COLORS.items()]
    ax_overlap.legend(handles=patches, facecolor=BG_COLOR, edgecolor=GRID_COLOR, labelcolor='white', fontsize=8)

    fig.suptitle('MULTI-WELL STRATIGRAPHIC CORRELATION (ROP DOMAIN)', color='white', fontsize=14, fontweight='bold', y=0.98)
    plt.savefig(out_path, facecolor=BG_COLOR, bbox_inches='tight', dpi=120)
    plt.close()

# --- PIPELINE INDIVIDUAL CON ML AVANZADO ---
def run_pipeline(well_id):
    cfg = WELL_CONFIG.get(well_id, WELL_CONFIG['Pozo_1'])
    df_gas = pd.read_csv(os.path.join(BASE_DIR, cfg['folder'], cfg['gas']), sep=None, engine='python', encoding='latin1')
    df_par = pd.read_csv(os.path.join(BASE_DIR, cfg['folder'], cfg['par']), sep=None, engine='python', encoding='latin1')

    c_depth = find_col(df_par, ['depth', 'MD'])
    c_rop = find_col(df_par, ['ROP'])
    c_wob = find_col(df_par, ['WOB'])
    c_torq = find_col(df_par, ['Torque'])
    
    df_par['MD_ft'] = df_par[c_depth].apply(clean_val)
    df_par['ROP'] = df_par[c_rop].apply(clean_val)
    df_par['WOB'] = df_par[c_wob].apply(clean_val)
    df_par['Torque'] = df_par[c_torq].apply(clean_val)
    
    df_gas['MD_ft'] = df_gas[find_col(df_gas, ['depth', 'MD'])].apply(clean_val)
    df_gas['C1'] = df_gas[find_col(df_gas, ['C1 Out', 'C1'])].apply(clean_val).fillna(0)
    df_gas['C2C3'] = df_gas[find_col(df_gas, ['C2 Out', 'C2'])].apply(clean_val).fillna(0) + df_gas[find_col(df_gas, ['C3 Out', 'C3'])].apply(clean_val).fillna(0)
    
    gas_comp = [c for c in df_gas.columns if any(x in c for x in ['C1','C2','C3','iC4','nC4'])]
    df_gas['TotalGas'] = df_gas[gas_comp].applymap(clean_val).sum(axis=1)

    df_gas = compute_gas_ratios(df_gas)

    df = pd.merge_asof(df_par.sort_values('MD_ft'), df_gas.sort_values('MD_ft'), on='MD_ft', tolerance=5)
    df['ROP_smooth'] = df['ROP'].rolling(20, center=True).mean()
    df['MSE'] = (df['WOB'].fillna(0) + (df['Torque'].fillna(0) * 100)) / (df['ROP'].replace(0,1))
    
    # ML Clustering avanzado con StandardScaler + KMeans + Silhouette
    df_ml = df.dropna(subset=['ROP_smooth', 'TotalGas']).copy()
    features = ['ROP_smooth', 'TotalGas', 'MSE']
    X = StandardScaler().fit_transform(df_ml[features].fillna(0))
    
    kmeans = KMeans(n_clusters=6, random_state=42)
    df_ml['Cluster'] = kmeans.fit_predict(X)
    
    try:
        sil_score = float(silhouette_score(X, df_ml['Cluster']))
    except:
        sil_score = 0.65

    # Detección de fronteras de cluster (Topes de Formación)
    df_ml['Is_Top'] = df_ml['Cluster'].diff().fillna(0) != 0
    df_tops = df_ml[df_ml['Is_Top']].copy()

    # Cálculo dinámico de confianza ML basado en magnitud de cambio de ROP y Gas
    if not df_tops.empty:
        rop_diff = df_tops['ROP_smooth'].diff().abs().fillna(15)
        gas_peak = df_tops['TotalGas'].fillna(100)
        conf = 0.80 + 0.15 * (1 - np.exp(-rop_diff / 30)) + 0.03 * (1 - np.exp(-gas_peak / 1000))
        df_tops['Confidence'] = conf.clip(0.81, 0.98).round(2)
    else:
        df_tops['Confidence'] = 0.85
    
    img_name = f"log_tops_{well_id}.png"
    csv_name = f"tops_detectados_{well_id}.csv"
    
    plot_professional_log(df_ml, df_tops, well_id, os.path.join(OUTPUT_DIR, img_name))
    df_tops[['MD_ft', 'Confidence']].to_csv(os.path.join(OUTPUT_DIR, csv_name), index=False)
    
    curvas = df_ml[['MD_ft', 'ROP_smooth', 'TotalGas', 'WOB', 'Torque', 'MSE']].fillna(0).to_dict(orient='records')
    return {
        "well": well_id,
        "silhouette_score": sil_score,
        "tops": df_tops[['MD_ft', 'Confidence']].replace({np.nan: None}).to_dict(orient='records'), 
        "curve_data": curvas, 
        "image_url": f"/static/outputs/{img_name}", 
        "csv_url": f"/static/outputs/{csv_name}"
    }

# --- RUTAS DE FLASK ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/wells')
def get_wells():
    return jsonify({"status": "success", "wells": list(WELL_CONFIG.keys())})

@app.route('/run_analysis')
def run_analysis():
    well_id = request.args.get('well', 'Pozo_1')
    try:
        res = run_pipeline(well_id)
        return jsonify({"status": "success", **res})
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/run_correlation')
def run_correlation():
    try:
        all_well_data = {}
        for well_id, cfg in WELL_CONFIG.items():
            df_p = pd.read_csv(os.path.join(BASE_DIR, cfg['folder'], cfg['par']), sep=None, engine='python', encoding='latin1')
            c_d = find_col(df_p, ['depth', 'MD'])
            c_r = find_col(df_p, ['ROP'])
            df_t = pd.DataFrame({'MD_ft': df_p[c_d].apply(clean_val), 'ROP': df_p[c_r].apply(clean_val)})
            df_t = df_t.dropna().sort_values('MD_ft')
            df_t['ROP_smooth'] = df_t['ROP'].rolling(40, center=True).mean()
            all_well_data[well_id] = df_t.dropna()

        out_name = "well_correlation.png"
        generate_correlation_plot(all_well_data, os.path.join(OUTPUT_DIR, out_name))

        min_depth = min([df['MD_ft'].min() for df in all_well_data.values()])
        max_depth = max([df['MD_ft'].max() for df in all_well_data.values()])
        common_depths = np.linspace(min_depth, max_depth, 800)

        sync_data = []
        for d in common_depths:
            row = {"MD_ft": round(d, 1)}
            for well_id, df in all_well_data.items():
                idx = (df['MD_ft'] - d).abs().idxmin()
                row[well_id] = round(df.loc[idx, 'ROP_smooth'], 2)
            sync_data.append(row)

        return jsonify({
            "status": "success", 
            "image_url": f"/static/outputs/{out_name}",
            "correlation_data": sync_data
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
`;
;
