/* ============================================================
   Monitor de Laboratorios UCI - V10c
   Archivo: app_v10c.js
   Versión completa y corregida
   ============================================================ */

/* ============================================================
   1. LISTA DE PARÁMETROS (sinónimos + unidades + nombre HCLAB)
   ============================================================ */
const PARAMETERS = {
    // Hematología
    "Hemoglobina": { synonyms: /(HGB|HEMOGLOBINA|HB\b|HEMOG)/i, unit: "g/dl", hclab: "Hb" },
    "Hematocrito": { synonyms: /(HCT|HEMATOCRITO|HTO)/i, unit: "%", hclab: "Hto" },

    // Electrolitos
    "Na": { synonyms: /\b(NA|SODIO|NATREMIA)\b/i, unit: "mEq/l", hclab: "Na" },
    "K": { synonyms: /\b(K|POTASIO|KALEMIA)\b/i, unit: "mEq/l", hclab: "K" },
    "Cl": { synonyms: /\b(CLORO|CL\b)\b/i, unit: "mEq/l", hclab: "Cl" },
    "Mg": { synonyms: /\b(MG|MAGNESIO)\b/i, unit: "mg/dl", hclab: "Mg" },
    "Ca_Total": { synonyms: /(CALCIO\s*TOTAL)/i, unit: "mg/dl", hclab: "CaT" },
    "Ca_Ionizado": { synonyms: /(IONIZADO|CA ION)/i, unit: "mmol/l", hclab: "CaI" },

    // Metabolismo / Renal
    "Glucosa": { synonyms: /(GLUCOSA|GLU|GLICEMIA)/i, unit: "mg/dl", hclab: "Glu" },
    "Urea": { synonyms: /(UREA)/i, unit: "mg/dl", hclab: "Urea" },
    "Creatinina": { synonyms: /(CREATININA|CREA\b|CR\b)/i, unit: "mg/dl", hclab: "Cr" },
    "Acido_Urico": { synonyms: /(ACIDO\s*URICO)/i, unit: "mg/dl", hclab: "AU" },

    // Hepatograma
    "BT": { synonyms: /(BILIRRUBINA TOTAL|BT\b)/i, unit: "mg/dl", hclab: "BT" },
    "BD": { synonyms: /(BILIRRUBINA DIRECTA|BD\b)/i, unit: "mg/dl", hclab: "BD" },
    "AST_TGO": { synonyms: /(ASAT|GOT|AST)/i, unit: "UI/l", hclab: "AST" },
    "ALT_TGP": { synonyms: /(ALAT|GPT|ALT|TGP)/i, unit: "UI/l", hclab: "ALT" },
    "Fosfatasa_Alc": { synonyms: /(FOSFATASA ALCALINA|FA SERICA|FAL\b)/i, unit: "UI/l", hclab: "FA" },
    "GGT": { synonyms: /(GGT|GAMMA.?GT)/i, unit: "UI/l", hclab: "GGT" },
    "Proteínas_Totales": { synonyms: /(PROTEINAS TOTALES|PTOTAL)/i, unit: "g/dl", hclab: "Prot" },
    "Albumina": { synonyms: /(ALBUMINA)/i, unit: "g/dl", hclab: "Alb" },

    // Perfil lipídico
    "Colesterol_Total": { synonyms: /(COLESTEROL TOTAL)/i, unit: "mg/dl", hclab: "CT" },
    "LDL": { synonyms: /(LDL)/i, unit: "mg/dl", hclab: "LDL" },
    "HDL": { synonyms: /(HDL)/i, unit: "mg/dl", hclab: "HDL" },
    "Trigliceridos": { synonyms: /(TRIGLICERIDOS|TGL|TG\b)/i, unit: "mg/dl", hclab: "TGL" },

    // Inflamación
    "Ferritina": { synonyms: /(FERRITINA)/i, unit: "ng/ml", hclab: "Ferr" },
    "PCR": { synonyms: /(PCR\b|C REACTIVA)/i, unit: "mg/l", hclab: "PCR" },
    "Procalcitonina": { synonyms: /(PCT|PROCALCITONINA)/i, unit: "ng/ml", hclab: "PCT" },

    // Cardíacos
    "CPK": { synonyms: /(CPK|CREATIN.?KINASA)/i, unit: "UI/l", hclab: "CPK" },

    // Hormonas
    "TSH": { synonyms: /(TSH)/i, unit: "uU/ml", hclab: "TSH" }
};

/* ============================================================
   2. UNIDADES DETECTABLES (Whitelist)
   ============================================================ */
const UNIT_REGEX = {
    "mg/dl": "mg\\s*\\/\\s*d[l1]",
    "g/dl": "g\\s*\\/\\s*d[l1]",
    "UI/l": "UI\\s*\\/\\s*l",
    "U/l": "U\\s*\\/\\s*l",
    "mEq/l": "mEq\\s*\\/\\s*l",
    "%": "%",
    "ng/ml": "ng\\s*\\/\\s*ml",
    "uU/ml": "uU\\s*\\/\\s*ml"
};

/* ============================================================
   3. ALMACENAMIENTO
   ============================================================ */
let labData = {};
const LOCAL_STORAGE_KEY = "uciLabMonitorData_V10c";

function saveData() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(labData));
}

function loadData() {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) labData = JSON.parse(stored);
}

/* ============================================================
   4. PARSER DE VALORES
   ============================================================ */
function parseLabValue(text, paramName, unitKey) {
    const cfg = PARAMETERS[paramName];
    if (!cfg) return null;

    const unitPattern = UNIT_REGEX[unitKey];
    if (!unitPattern) return null;

    const regex = new RegExp(
        cfg.synonyms.source +
            "[\\s\\S]{0,80}?([<>]?)\\s*([0-9]+[\\.,]?[0-9]*)\\s*(?:↑|↓)?\\s*" +
            unitPattern,
        "i"
    );

    const m = text.match(regex);
    if (!m) return null;

    let num = m[2].replace(",", ".");
    return parseFloat(num);
}

/* ============================================================
   5. METADATOS (Nombre, Protocolo, Fecha)
   ============================================================ */
function extractMetadata(text) {
    const out = { paciente: null, protocolo: null, fecha: null, hora: "12:00:00" };

    // PACIENTE
    let m = text.match(/PACIENTE.?[: ]+([A-ZÁÉÍÓÚÑ ]{5,50})/i);
    if (m) out.paciente = m[1].trim();

    // PROTOCOLO
    m = text.match(/PROTOCOLO.?[: ]+([A-Z0-9-]+)/i);
    if (m) out.protocolo = m[1].trim();

    // TOMA DE MUESTRA
    m = text.match(/TOMA DE MUESTRA.?[: ]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s*(\d{1,2}:\d{2})?/i);
    if (m) {
        out.fecha = normalizeDate(m[1]);
        if (m[2]) out.hora = m[2] + ":00";
    }

    return out;
}

function normalizeDate(d) {
    const p = d.split(/[\/-]/);
    let dd = p[0].padStart(2, "0");
    let mm = p[1].padStart(2, "0");
    let yy = p[2].length === 2 ? "20" + p[2] : p[2];
    return `${yy}-${mm}-${dd}`;
}

/* ============================================================
   6. PROCESAR ENTRADA COMPLETA
   ============================================================ */
function processInput(text) {
    if (!text.trim()) return alert("Pegá el laboratorio primero.");

    const meta = extractMetadata(text);
    if (!meta.paciente) return alert("No se detectó el nombre del paciente.");

    const sample = {
        ...meta,
        parametros: {},
        timestamp: meta.fecha ? new Date(meta.fecha + "T" + meta.hora).getTime() : Date.now()
    };

    let detected = 0;
    for (const p in PARAMETERS) {
        const cfg = PARAMETERS[p];
        const v = parseLabValue(text, p, cfg.unit);
        if (v !== null) {
            sample.parametros[p] = v;
            detected++;
        }
    }

    if (detected === 0) return alert("No se detectaron valores.");

    if (!labData[meta.paciente]) labData[meta.paciente] = [];
    labData[meta.paciente].push(sample);
    saveData();

    loadPatientSelector(meta.paciente);

    alert(`Guardado correctamente (${detected} parámetros).`);
}

/* ============================================================
   7. TABLA UCI
   ============================================================ */

function loadPatientSelector(sel = null) {
    const s = document.getElementById("patientSelector");
    if (!s) return;

    s.innerHTML = "<option value=''>-- Seleccionar paciente --</option>";

    Object.keys(labData)
        .sort()
        .forEach(n => {
            const o = document.createElement("option");
            o.value = n;
            o.textContent = n;
            s.appendChild(o);
        });

    if (sel) s.value = sel;

    if (s.value) loadPatientData();
}

function loadPatientData() {
    const p = document.getElementById("patientSelector").value;
    const table = document.getElementById("uciTable");

    if (!p || !labData[p]) {
        table.querySelector("thead").innerHTML = "";
        table.querySelector("tbody").innerHTML =
            "<tr><td class='p-4 text-center text-gray-500'>Sin datos</td></tr>";
        return;
    }

    const samples = labData[p];

    // Reunir columnas
    const params = new Set();
    samples.forEach(s => Object.keys(s.parametros).forEach(x => params.add(x)));
    const sorted = [...params].sort();

    let thead = "<tr><th>Fecha</th>";
    sorted.forEach(p => {
        thead += `<th>${p}</th>`;
    });
    thead += "</tr>";

    let tbody = "";
    samples.forEach(s => {
        const d = s.fecha + " " + s.hora.slice(0, 5);
        tbody += `<tr><td>${d}</td>`;
        sorted.forEach(p => {
            tbody += `<td>${s.parametros[p] ?? "-"}</td>`;
        });
        tbody += "</tr>";
    });

    table.querySelector("thead").innerHTML = thead;
    table.querySelector("tbody").innerHTML = tbody;

    loadParamSelector();
}

/* ============================================================
   8. SELECTOR DE PARÁMETROS + GRÁFICO
   ============================================================ */
function loadParamSelector() {
    const p = document.getElementById("patientSelector").value;
    const sel = document.getElementById("paramSelector");

    sel.innerHTML = "";

    if (!p || !labData[p]) return;

    const params = new Set();
    labData[p].forEach(s => Object.keys(s.parametros).forEach(x => params.add(x)));

    [...params]
        .sort()
        .forEach(x => {
            const o = document.createElement("option");
            o.value = x;
            o.textContent = x;
            sel.appendChild(o);
        });

    updateGraph();
}

let chartInstance = null;

function updateGraph() {
    const p = document.getElementById("patientSelector").value;
    const param = document.getElementById("paramSelector").value;
    const canvas = document.getElementById("evolutionChart");

    if (!p || !param || !labData[p]) return;

    const data = labData[p]
        .filter(s => s.parametros[param] !== undefined)
        .map(s => ({
            x: s.fecha + " " + s.hora.slice(0, 5),
            y: s.parametros[param]
        }));

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: data.map(d => d.x),
            datasets: [
                {
                    label: param,
                    data: data.map(d => d.y),
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.2)",
                    borderWidth: 2,
                    pointRadius: 4
                }
            ]
        }
    });
}

/* ============================================================
   9. HCLAB
   ============================================================ */
function generateHCLAB() {
    const p = document.getElementById("patientSelector").value;
    if (!p || !labData[p]) return alert("Elegí un paciente");

    const last = labData[p][labData[p].length - 1];

    const order = [
        "Na",
        "K",
        "Cl",
        "Hemoglobina",
        "Hematocrito",
        "Glucosa",
        "Urea",
        "Creatinina",
        "LDL",
        "HDL",
        "Trigliceridos",
        "AST_TGO",
        "ALT_TGP",
        "BT",
        "BD",
        "CPK",
        "PCR",
        "Ferritina",
        "TSH"
    ];

    const parts = [];

    order.forEach(p => {
        const cfg = PARAMETERS[p];
        const v = last.parametros[p];
        if (cfg && v !== undefined) parts.push(`${cfg.hclab} ${v}`);
    });

    const out = document.getElementById("hclabOutput");
    out.innerHTML = `<textarea class="w-full p-2 border rounded">${parts.join(", ")}</textarea>`;
    out.classList.remove("hidden");
}

/* ============================================================
   10. CSV
   ============================================================ */
function downloadCSV() {
    const p = document.getElementById("patientSelector").value;
    if (!p || !labData[p]) return;

    const samples = labData[p];

    const params = new Set();
    samples.forEach(s => Object.keys(s.parametros).forEach(x => params.add(x)));
    const sorted = [...params].sort();

    let csv = "Paciente,Fecha,Hora," + sorted.join(",") + "\n";

    samples.forEach(s => {
        csv += `${p},${s.fecha},${s.hora},` +
            sorted.map(x => s.parametros[x] ?? "").join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${p.replace(/\s+/g, "_")}.csv`;
    a.click();
}

/* ============================================================
   11. RESET GENERAL
   ============================================================ */
function resetAllData() {
    if (!confirm("Esto borrará TODOS los datos. ¿Continuar?")) return;

    labData = {};
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    loadPatientSelector();

    const out = document.getElementById("hclabOutput");
    if (out) out.classList.add("hidden");

    const t = document.getElementById("uciTable");
    t.querySelector("thead").innerHTML = "";
    t.querySelector("tbody").innerHTML =
        "<tr><td class='p-4 text-center text-gray-500'>Sin datos</td></tr>";

    if (chartInstance) chartInstance.destroy();
}

/* ============================================================
   12. MANEJO DE PDF
   ============================================================ */
function setupPdfHandling() {
    const input = document.getElementById("pdfInput");

    input.addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function () {
            const pdfData = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

            let full = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const txt = await page.getTextContent();
                full += txt.items.map(t => t.str).join(" ") + "\n";
            }

            document.getElementById("labInput").value = full;
            processInput(full);
        };

        reader.readAsArrayBuffer(file);
    });
}

/* ============================================================
   13. INICIALIZACIÓN FINAL
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    loadPatientSelector();
    setupPdfHandling();

    document.getElementById("btnProcesarTexto").onclick = () =>
        processInput(document.getElementById("labInput").value);

    document.getElementById("btnLimpiarEntrada").onclick = () => {
        document.getElementById("labInput").value = "";
    };

    document.getElementById("btnHCLAB").onclick = generateHCLAB;
    document.getElementById("btnCSV").onclick = downloadCSV;

    document.getElementById("paramSelector").onchange = updateGraph;
    document.getElementById("patientSelector").onchange = loadPatientData;

    const btnReset = document.getElementById("btnReset");
    if (btnReset) btnReset.onclick = resetAllData;
});
