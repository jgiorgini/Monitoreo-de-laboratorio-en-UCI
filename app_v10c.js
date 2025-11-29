/****************************************************
 * Monitor de Laboratorios UCI – Versión V10c (estable)
 * Parser robusto – Sin duplicados – Sin NaN
 ****************************************************/

// =============================
// 1. PARÁMETROS DE LABORATORIO
// =============================

const PARAMETERS = {
    // Hematología
    "Hemoglobina": { synonyms: /(HEMOGLOBINA|HGB|HB\b)/i, unit: "g/dl", hclab: "Hb" },
    "Hematocrito": { synonyms: /(HEMATOCRITO|HCT|HTO)/i, unit: "%", hclab: "Hto" },

    // Electrolitos
    "Na": { synonyms: /\b(SODIO|NA)\b/i, unit: "mEq/l", hclab: "Na" },
    "K": { synonyms: /\b(POTASIO|K)\b/i, unit: "mEq/l", hclab: "K" },
    "Cl": { synonyms: /\b(CLORO|CL)\b/i, unit: "mEq/l", hclab: "Cl" },
    "Mg": { synonyms: /\b(MAGNESIO|MG)\b/i, unit: "mg/dl", hclab: "Mg" },

    // Renal / Metabólico
    "Glucosa": { synonyms: /(GLUCOSA|GLUCOSE|GLU\b)/i, unit: "mg/dl", hclab: "Glu" },
    "Urea": { synonyms: /\b(UREA)\b/i, unit: "mg/dl", hclab: "Urea" },
    "Creatinina": { synonyms: /(CREATININA|CREA\b|CR\b)/i, unit: "mg/dl", hclab: "Cr" },
    "Acido_Urico": { synonyms: /(ACIDO URICO|ÁCIDO ÚRICO)/i, unit: "mg/dl", hclab: "AU" },

    // Hepatograma
    "BT": { synonyms: /(BILIRRUBINA TOTAL|BT\b)/i, unit: "mg/dl", hclab: "BT" },
    "BD": { synonyms: /(BILIRRUBINA DIRECTA|BD\b)/i, unit: "mg/dl", hclab: "BD" },
    "AST_TGO": { synonyms: /(ASAT|AST|GOT)/i, unit: "UI/l", hclab: "AST" },
    "ALT_TGP": { synonyms: /(ALAT|ALT|GPT|TGP)/i, unit: "UI/l", hclab: "ALT" },
    "Fosfatasa_Alcalina": { synonyms: /(FOSFATASA ALCALINA|FOSFATASA)/i, unit: "UI/l", hclab: "FA" },
    "Proteinas_Totales": { synonyms: /(PROTEINAS TOTALES|PROTEÍNAS TOTALES)/i, unit: "g/dl", hclab: "Prot" },
    "Albúmina": { synonyms: /(ALBUMINA|ALBÚMINA)/i, unit: "g/dl", hclab: "Alb" },

    // Perfil lipídico
    "Colesterol_Total": { synonyms: /(COLESTEROL TOTAL)/i, unit: "mg/dl", hclab: "CT" },
    "LDL": { synonyms: /\b(LDL)\b/i, unit: "mg/dl", hclab: "LDL" },
    "HDL": { synonyms: /\b(HDL)\b/i, unit: "mg/dl", hclab: "HDL" },
    "Trigliceridos": { synonyms: /(TRIGLICERIDOS|TRIGLICÉRIDOS)/i, unit: "mg/dl", hclab: "TGL" },

    // Endócrino
    "TSH": { synonyms: /\bTSH\b/i, unit: "uUI/ml", hclab: "TSH" },

    // Cardíacos
    "CPK": { synonyms: /(CPK|CK\b|CREATINQUINASA)/i, unit: "UI/l", hclab: "CPK" },

    // Inflamación
    "PCR": { synonyms: /(PCR|C REACTIVA)/i, unit: "mg/l", hclab: "PCR" }
};

// =============================
// 2. UNIDADES
// =============================

const UNIT_REGEX = {
    "mg/dl": "mg\\s*\\/\\s*d[l1]",
    "g/dl": "g\\s*\\/\\s*d[l1]",
    "mEq/l": "mEq\\s*\\/\\s*[l1]",
    "UI/l": "(UI|U)\\s*\\/\\s*[l1]",
    "%": "%",
    "uUI/ml": "uUI\\s*\\/\\s*ml",
    "mg/l": "mg\\s*\\/\\s*l"
};

// =============================
// 3. BASE DE DATOS
// =============================

let labData = {};
const LOCAL_KEY = "uciLabMonitor";

// Guardar
function saveData() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(labData));
}

// Cargar
function loadData() {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) labData = JSON.parse(stored);
}

// Reset general
function resetAllData() {
    if (!confirm("¿Eliminar todos los datos cargados?")) return;
    labData = {};
    localStorage.removeItem(LOCAL_KEY);
    loadPatientSelector();
    document.getElementById("uciTable").querySelector("tbody").innerHTML = "";
    alert("Todos los datos fueron eliminados.");
}

// =============================
// 4. PARSE DE VALORES
// =============================

function parseLabValue(text, paramName, unitKey) {
    const cfg = PARAMETERS[paramName];
    if (!cfg) return null;

    const unitPattern = UNIT_REGEX[unitKey];
    if (!unitPattern) return null;

    // Captura: número, número con coma/punto, valores con < >
    const regex = new RegExp(
        cfg.synonyms.source +
            "[\\s\\S]{0,80}?([<>]?)\\s*([0-9]+[\\.,]?[0-9]*)\\s*(?:↑|↓)?\\s*" +
            unitPattern,
        "i"
    );

    const m = text.match(regex);
    if (!m) return null;

    let value = parseFloat(m[2].replace(",", "."));
    if (Number.isNaN(value)) return null;

    return value;
}

// =============================
// 5. PARSE DE METADATOS
// =============================

function extractMetadata(text) {
    let paciente = null;
    let protocolo = null;

    // PACIENTE
    const rePac = /(PACIENTE[: ]+|Paciente[: ]+)([A-ZÁÉÍÓÚÑ ]{3,})/i;
    const mp = text.match(rePac);
    if (mp) paciente = mp[2].trim();

    // PROTOCOLO
    const reProt = /(PROTOCOLO\s*(N°|Nº|NO)?[: ]*)([A-Z0-9\-]+)/i;
    const pr = text.match(reProt);
    if (pr) protocolo = pr[3].trim();

    // FECHA
    const reFecha = /TOMA DE MUESTRA[: ]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
    const rf = text.match(reFecha);

    let fecha = null;
    if (rf) {
        const parts = rf[1].split(/[\/\-]/);
        let d = parts[0].padStart(2, "0");
        let m = parts[1].padStart(2, "0");
        let y = parts[2].length === 2 ? "20" + parts[2] : parts[2];
        fecha = `${y}-${m}-${d}`;
    }

    // HORA
    const reHora = /TOMA DE MUESTRA[^\d]*(\d{1,2}:\d{2})/i;
    const rh = text.match(reHora);
    const hora = rh ? rh[1] + ":00" : "12:00:00";

    return { paciente, protocolo, fecha, hora };
}

// =============================
// 6. PROCESAR INPUT
// =============================

function processInput(text) {
    if (!text.trim()) {
        alert("Pegue el texto del laboratorio.");
        return;
    }

    const meta = extractMetadata(text);
    if (!meta.paciente) {
        alert("No se detectó nombre del paciente.");
        return;
    }

    const sample = {
        paciente: meta.paciente,
        protocolo: meta.protocolo,
        fecha: meta.fecha,
        hora: meta.hora,
        parametros: {}
    };

    // PARSE DE CADA PARÁMETRO
    let detected = 0;
    for (const p in PARAMETERS) {
        const u = PARAMETERS[p].unit;
        const v = parseLabValue(text, p, u);
        if (v !== null) {
            sample.parametros[p] = v;
            detected++;
        }
    }

    if (detected === 0) {
        alert("No se detectaron parámetros en este informe.");
        return;
    }

    // GUARDADO – evitar duplicados
    if (!labData[meta.paciente]) labData[meta.paciente] = [];

    let idx = -1;
    if (meta.protocolo) {
        idx = labData[meta.paciente].findIndex(
            s => s.protocolo === meta.protocolo
        );
    }

    if (idx !== -1) {
        labData[meta.paciente][idx] = sample;
    } else {
        labData[meta.paciente].push(sample);
    }

    saveData();
    loadPatientSelector(meta.paciente);

    alert("Laboratorio procesado correctamente.");
}

// =============================
// 7. SELECTORES
// =============================

function loadPatientSelector(selected = null) {
    const sel = document.getElementById("patientSelector");
    sel.innerHTML = `<option value="">-- Seleccionar paciente --</option>`;

    const names = Object.keys(labData).sort();
    for (const n of names) {
        const opt = document.createElement("option");
        opt.value = n;
        opt.textContent = n;
        sel.appendChild(opt);
    }

    if (selected && names.includes(selected)) sel.value = selected;

    loadPatientData();
}

// =============================
// 8. TABLA UCI
// =============================

function loadPatientData() {
    const sel = document.getElementById("patientSelector");
    const name = sel.value;
    const table = document.getElementById("uciTable");
    const tbody = table.querySelector("tbody");
    const thead = table.querySelector("thead");

    if (!name || !labData[name].length) {
        tbody.innerHTML = "";
        thead.innerHTML = "";
        return;
    }

    const samples = labData[name];

    const allParams = new Set();
    samples.forEach(s => {
        Object.keys(s.parametros).forEach(p => allParams.add(p));
    });

    const sortedParams = Array.from(allParams).sort();

    // HEADER
    let h = `<tr><th>Fecha</th>`;
    sortedParams.forEach(p => h += `<th>${p}</th>`);
    h += "</tr>";
    thead.innerHTML = h;

    // BODY
    let out = "";
    samples.forEach(s => {
        out += `<tr><td>${s.fecha} ${s.hora.slice(0,5)}</td>`;
        sortedParams.forEach(p => {
            const v = s.parametros[p];
            out += `<td>${v !== undefined ? v : "-"}</td>`;
        });
        out += "</tr>";
    });

    tbody.innerHTML = out;

    loadParamSelector();
}

// =============================
// 9. GRAFICO
// =============================

function loadParamSelector() {
    const selP = document.getElementById("paramSelector");
    const name = document.getElementById("patientSelector").value;
    selP.innerHTML = "";

    if (!name || !labData[name]) return;

    const params = new Set();
    labData[name].forEach(s =>
        Object.keys(s.parametros).forEach(p => params.add(p))
    );

    Array.from(params).sort().forEach(p => {
        const o = document.createElement("option");
        o.value = p;
        o.textContent = p;
        selP.appendChild(o);
    });

    updateGraph();
}

let chartInstance = null;

function updateGraph() {
    const patient = document.getElementById("patientSelector").value;
    const param = document.getElementById("paramSelector").value;
    const canvas = document.getElementById("evolutionChart");

    if (!patient || !param) return;

    const samples = labData[patient];
    const points = samples
        .filter(s => s.parametros[param] !== undefined)
        .map(s => ({
            x: `${s.fecha} ${s.hora}`,
            y: s.parametros[param]
        }));

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: points.map(p => p.x),
            datasets: [{
                label: param,
                data: points.map(p => p.y),
                borderColor: "rgb(30, 110, 250)",
                backgroundColor: "rgba(30,110,250,0.2)"
            }]
        }
    });
}

// =============================
// 10. HCLAB Y CSV
// =============================

function generateHCLAB() {
    alert("HCLAB pendiente de integrar en esta versión.");
}

function downloadCSV() {
    alert("CSV pendiente de integrar en esta versión.");
}

// =============================
// 11. PDF
// =============================

function setupPdfHandling() {
    const pdfInput = document.getElementById("pdfInput");
    const loading = document.getElementById("loading");

    if (!pdfInput) return;

    pdfInput.addEventListener("change", async (evt) => {
        const file = evt.target.files[0];
        if (!file) return;

        loading.classList.remove("hidden");

        try {
            const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(a => a.str).join(" ") + "\n";
            }

            document.getElementById("labInput").value = fullText;
            processInput(fullText);

        } catch (e) {
            alert("Error leyendo PDF.");
            console.error(e);
        }

        loading.classList.add("hidden");
    });
}

// =============================
// 12. INICIALIZACIÓN
// =============================

document.addEventListener("DOMContentLoaded", () => {

    loadData();
    loadPatientSelector();
    setupPdfHandling();

    document.getElementById("btnProcesarTexto")
        .addEventListener("click", () =>
            processInput(document.getElementById("labInput").value)
        );

    document.getElementById("btnLimpiarEntrada")
        .addEventListener("click", () =>
            (document.getElementById("labInput").value = "")
        );

    document.getElementById("btnReset")
        ?.addEventListener("click", () => resetAllData());
});
