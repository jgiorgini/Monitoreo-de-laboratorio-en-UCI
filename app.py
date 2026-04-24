import json
import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
CORS(app)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Falta configurar la variable de entorno OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

TARGET_PARAMS = [
    "Hemoglobina", "Hematocrito", "Plaquetas", "Leucocitos", "Na", "K", "Cl", "Mg",
    "Ca_Total", "Ca_Ionizado", "Fosforo", "Glucosa", "Urea", "Creatinina",
    "Acido_Urico", "HbA1c", "BT", "BD", "AST_TGO", "ALT_TGP", "Fosfatasa_Alcalina",
    "Albúmina", "Proteinas_Totales", "CPK", "PCR", "Procalcitonina", "Lactato",
    "pH", "pCO2", "pO2", "Bicarbonato", "SatO2", "BEb", "TSH", "Colesterol_Total",
    "LDL", "HDL", "Triglicéridos", "TP", "RIN", "KPTT", "aPTT", "Tacrolimus",
    "Everolimus", "CMV", "BKV", "EBV"
]


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/api/extract-lab", methods=["POST"])
def extract_lab():
    data = request.get_json(force=True, silent=True) or {}
    text = (data.get("text") or "").strip()

    if len(text) < 10:
        return jsonify({"error": "Texto insuficiente para procesar"}), 400

    prompt = f"""
Medical Expert Task:
Analyze the following laboratory text from Hospital Argerich or Hospital Alemán (Buenos Aires, Argentina).
It may contain ONE or MULTIPLE reports from different dates/times.

Return a JSON OBJECT with key "muestras" — array of report objects:
{{
  "muestras": [{{
    "paciente": "FULL NAME UPPERCASE",
    "fecha": "YYYY-MM-DD",
    "hora": "HH:MM",
    "protocolo": "string",
    "parametros": {{ "KEY": value_number }}
  }}]
}}

Targets: {", ".join(TARGET_PARAMS)}.

CRITICAL MAPPING RULES:
1. "Sodio"→"Na", "Potasio"→"K", "Cloro"→"Cl"
2. "Calcio iónico"/"Calcio normalizado"→"Ca_Ionizado"
3. "Calcio" alone→"Ca_Total"
4. "Magnesio"→"Mg", "Fósforo"→"Fosforo"
5. "Aspartato Aminotransferasa (GOT)"→"AST_TGO"
6. "Alanina Aminotransferasa (GPT)"→"ALT_TGP"
7. "Fosfatasa Alcalina"→"Fosfatasa_Alcalina"
8. "Albúmina"→"Albúmina"
9. "Glucosa Plasmática"→"Glucosa"
10. "SatO2"→"SatO2", "BEb"→"BEb"
11. "Acido láctico"/"Lactato"→"Lactato"
12. "LDL Colesterol"→"LDL", "Colesterol HDL"→"HDL"
13. "Ácido Úrico"→"Acido_Urico"
14. "Tacrolimus"→"Tacrolimus", "Everolimus"→"Everolimus"
15. "Tirotrofina- TSH"→"TSH"
16. Multiple protocols/dates → separate objects in array
17. IONOGRAMA section inside EAB/GAS → extract all electrolytes
18. Numeric only: ignore null, non-numeric, or annotation-only values

Text:
\"\"\"{text[:35000]}\"\"\"
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content or ""
        parsed = json.loads(content)

        if isinstance(parsed, dict) and isinstance(parsed.get("muestras"), list):
            return jsonify(parsed)

        if isinstance(parsed, list):
            return jsonify({"muestras": parsed})

        if isinstance(parsed, dict):
            return jsonify({"muestras": [parsed]})

        return jsonify({"error": "La IA devolvió una estructura no válida"}), 502

    except json.JSONDecodeError:
        return jsonify({"error": "La IA no devolvió JSON válido"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=False)
