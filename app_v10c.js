/* ============================================================
   Monitor de Laboratorios UCI - app_v10c.js
   Versión modular, robusta y lista para producción ligera.
   ============================================================ */

/* 1) Configuración de parámetros reconocidos */
const PARAMETERS = {
    // Hematología
    "Hemoglobina":      { synonyms: /(HGB|HEMOGLOBINA|HB\b|HEMOG\b)/i, unit: "g/dL",  hclab: "Hb"  },
    "Hematocrito":      { synonyms: /(HCT|HEMATOCRITO|HTO\b)/i,              unit: "%",     hclab: "Hto" },

    // Iones / electrolitos
    "Na":               { synonyms: /\bNA\b|SODIO|NATREMIA/i,                unit: "mEq/L", hclab: "Na"  },
    "K":                { synonyms: /\bK\b|POTASIO|KALEMIA/i,                unit: "mEq/L", hclab: "K"   },
    "Cl":               { synonyms: /\bCL\b|CLORO|CLOREMIA/i,                unit: "mEq/L", hclab: "Cl"  },
    "Mg":               { synonyms: /\bMG\b|MAGNESIO/i,                      unit: "mg/dL", hclab: "Mg"  },
    "Ca_Total":         { synonyms: /(CA\s*TOTAL|CALCIO\s*TOTAL)/i,          unit: "mg/dL", hclab: "CaT" },
    "Ca_Ionizado":      { synonyms: /(CA\s*IONIZADO|CALCIO\s*IONIZADO)/i,    unit: "mmol/L",hclab: "CaI" },

    // Metabolismo / renal
    "Glucosa":          { synonyms: /(GLUCOSA|GLICEMIA|GLUCOSE|\bGLU\b)/i,   unit: "mg/dL", hclab: "Glu" },
    "Urea":             { synonyms: /\BUREA\b|UREMIA|\bBUN\b/i,              unit: "mg/dL", hclab: "Urea"},
    "Creatinina":       { synonyms: /(CREATININA\b|\bCREAT\b|\bCR\b)/i,      unit: "mg/dL", hclab: "Cr"  },
    "Acido_Urico":      { synonyms: /(ÁCIDO\s*ÚRICO|ACIDO\s*URICO)/i,        unit: "mg/dL", hclab: "AU"  },
    "Osmolalidad":      { synonyms: /(OSMOLALIDAD|OSMOL)/i,                  unit: "mOsm/Kg",hclab: "Osm"},

    // Hepatograma
    "BT":               { synonyms: /(BILIRRUBINA\s*TOTAL|BT\b)/i,           unit: "mg/dL", hclab: "BT"  },
    "BD":               { synonyms: /(BILIRRUBINA\s*DIRECTA|BD\b)/i,         unit: "mg/dL", hclab: "BD"  },
    "AST_TGO":          { synonyms: /\bAST\b|\bTGO\b|ASPARTATO\s*AMINOTRANSFERASA/i, unit: "U/L", hclab: "AST" },
    "ALT_TGP":          { synonyms: /\bALT\b|\bTGP\b|ALANINA\s*AMINOTRANSFERASA|\bGPT\b/i, unit: "U/L", hclab: "ALT" },
    "Fosfatasa_Alcalina": { synonyms: /(FOSFATASA\s*ALCALINA|\bFA\b)/i,      unit: "U/L",   hclab: "FA"  },
    "GGT":              { synonyms: /\bGGT\b|GAMMA\s*GLUTAMIL|GAMMAGT/i,     unit: "U/L",   hclab: "GGT" },
    "Albúmina":         { synonyms: /(ALBUMIN|ALBÚMINA|ALBUMINA)/i,         unit: "g/dL",  hclab: "Alb" },
    "Proteínas_Totales": { synonyms: /(PROTEÍNAS?\s*TOTALES?\b|PROT\s*TOTALES?)/i, unit: "g/dL", hclab: "Prot" },

    // Perfil lipídico
    "Colesterol_Total": { synonyms: /(COLESTEROL\s*TOTAL|\bCT\b)/i,          unit: "mg/dL", hclab: "CT"  },
    "LDL":              { synonyms: /\bLDL\b|C\s*LDL/i,                      unit: "mg/dL", hclab: "LDL" },
    "HDL":              { synonyms: /\bHDL\b|C\s*HDL/i,                      unit: "mg/dL", hclab: "HDL" },
    "Triglicéridos":    { synonyms: /(TRIGLIC[ÍI]RIDOS|TRIGLICERIDOS|\bTG\b|\bTGL\b)/i, unit: "mg/dL", hclab: "TGL" },
    "Colesterol_no_HDL":{ synonyms: /(COLESTEROL\s*NO\s*HDL)/i,             unit: "mg/dL", hclab: "noHDL" },
    "Lipoproteína_a":   { synonyms: /(LIPOPROTE[IÍ]NA\s*\(A\)|LP\(A\))/i,    unit: "mg/dL", hclab: "Lp(a)" },
    "ApoB":             { synonyms: /(APOB\b|APOLIPOPROTE[IÍ]NA\s*B)/i,     unit: "mg/dL", hclab: "ApoB" },

    // Inflamación
    "PCR":              { synonyms: /\bPCR\b|PROTE[ÍI]NA\s*C\s*REACTIVA/i,   unit: "mg/L",  hclab: "PCR" },
    "Procalcitonina":   { synonyms: /(PROCALCITONINA|\bPCT\b)/i,            unit: "ng/ml", hclab: "PCT" },
    "VSG":              { synonyms: /\bVSG\b|VELOCIDAD\s*DE\s*SEDIMENTACI[ÓO]N|VELOCIDAD\s*SEDIMENTACION/i, unit: "mm/h", hclab: "VSG" },
    "Ferritina":        { synonyms: /(FERRITINA)/i,                         unit: "ng/ml", hclab: "Ferr" },

    // Cardíacos
    "CPK":              { synonyms: /\bCK\b|\bCPK\b|CREATIN[QK]UINASA|CREATINKINASA/i, unit: "U/L",   hclab: "CPK" },
    "Troponina":        { synonyms: /(TROPONINA\s*[TI]?)/i,                 unit: "ng/ml", hclab: "Trop" },
    "NT_proBNP":        { synonyms: /(NT-?PROBNP|\bBNP\b)/i,                unit: "pg/ml", hclab: "BNP" },

    // Vitaminas / hormonas
    "Vitamina_B12":     { synonyms: /(VITAMINA\s*B12|CIANOCOBALAMINA)/i,    unit: "pg/ml", hclab: "B12" },
    "Acido_Fólico":     { synonyms: /(ÁCIDO\s*FÓLICO|ACIDO\s*FOLICO|FOLATO)/i, unit: "ng/ml", hclab: "Fol" },
    "TSH":              { synonyms: /\bTSH\b/i,                             unit: "uUI/ml",hclab: "TSH" },

    // Coagulación
    "TP":               { synonyms: /(TIEMPO\s*DE\s*PROTROMBINA|TIEMPO\s*PROTROMBINA|\bTP\b)/i, unit: "%",    hclab: "TP" },
    "INR":              { synonyms: /\bINR\b/i,                             unit: "",      hclab: "INR" },
    "Fibrinógeno":      { synonyms: /(FIBRIN[ÓO]GENO)/i,                    unit: "mg/dL", hclab: "Fib" },

    // Otros
    "Lactato":          { synonyms: /(LACTATO|ÁCIDO\s*LÁCTICO|ACIDO\s*LACTICO)/i, unit: "mmol/L", hclab: "Lact" }
};

/* 2) Unidades flexibles (tolerancia a OCR) */
const UNIT_REGEX = {
    "U/L":       "(?:U|UI)\\s*\\/?\\s*(?:[Ll1])",
    "mg/dL":     "mg\\/dl",
    "g/dL":      "g\\/dl",
    "%":         "%",
    "mEq/L":     "mEq\\/(?:[Ll1])",
    "mmol/L":    "mmol\\/(?:[Ll1])",
    "ng/ml":     "ng\\/ml",
    "pg/ml":     "pg\\/ml",
    "ng/L":      "ng\\/L",
    "mm/h":      "mm\\/h",
    "mOsm/Kg":   "mOsm\\/Kg",
    "uUI/ml":    "uUI\\/ml",
    "mcg/dL":    "mcg\\/dl",
    "s":         "s",
    "":          "\\s*$"
};

/* 3) Estado global y persistencia */
let labData = {};           
let chartInstance = null;
const LOCAL_STORAGE_KEY = "uciLabMonitorData_V10c";

function saveData() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(labData));
}

function loadData() {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
        try {
            labData = JSON.parse(stored);
        } catch (e) {
            console.error("Error al parsear datos almacenados:", e);
            labData = {};
        }
    }
}

/* 4) Parsing de valores */
function parseLabValue(text, paramName, unitKey) {
    const config = PARAMETERS[paramName];
    if (!config) return null;

    const unitPattern = UNIT_REGEX[unitKey] || "mg\\/dl";
    const paramSource = config.synonyms.source;

    const masterRegex = new RegExp(
        "(" + paramSource + ")[\\s\\S]{0,250}?\\s*([\\d.,]+)\\s*[↑↓]?\\s*(" + unitPattern + ")",
        "im"
    );

    const match = text.match(masterRegex);
    if (!match) return null;

    let valueStr = match[2].replace(",", ".");
    const value = parseFloat(valueStr);
    return isNaN(value) ? null : value;
}

/* 5) Extracción de metadata: paciente, protocolo, fecha, hora */
function extractMetadata(text) {
    const result = { paciente: null, protocolo: null, fecha: null, hora: "00:00:00" };

    // Paciente
    const patientRegex = /(PACIENTE|NOMBRE)\s*[:]?\s*([A-ZÁÉÍÓÚÑ\s\.,]{5,})/i;
    let match = text.match(patientRegex);
    if (match) {
        result.paciente = match[2].trim().replace(/\s{2,}/g, " ");
    }

    // Protocolo
    const protocolRegex = /(PROTOCOLO|ACCESSION|SOLICITUD)\s*[:]?\s*([A-Z0-9-]{4,})/i;
    match = text.match(protocolRegex);
    if (match) {
        result.protocolo = match[2].trim();
    }

    // Fecha
    const dateRegex = /(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/;
    match = text.match(dateRegex);
    if (match) {
        const parts = match[1].split(/[\/\.-]/);
        if (parts.length === 3) {
            let day = parts[0].padStart(2, "0");
            let month = parts[1].padStart(2, "0");
            let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            result.fecha = `${year}-${month}-${day}`;
        }
    }

    // Hora
    const timeRegex = /(\d{1,2}:\d{2})/;
    match = text.match(timeRegex);
    if (match) {
        result.hora = match[1] + ":00";
    } else if (result.fecha) {
        result.hora = "12:00:00";
    }

    return result;
}

/* 6) Procesamiento de entrada */
function processInput(textRaw) {
    const textArea = document.getElementById("labInput");
    const inputText = (textRaw || textArea.value || "").trim();

    if (!inputText) {
        alert("Pegue el texto del laboratorio o cargue un PDF.");
        return;
    }

    let text = inputText.replace(/(\d),(\d)/g, "$1.$2");
    const normalized = text.toUpperCase();

    const metadata = extractMetadata(normalized);
    if (!metadata.paciente) {
        alert("No se pudo identificar el nombre del paciente. La muestra no se guardará.");
        return;
    }

    const newSample = {
        ...metadata,
        parametros: {},
        timestamp: metadata.fecha ? new Date(`${metadata.fecha}T${metadata.hora}`).getTime() : Date.now()
    };

    let detectedCount = 0;
    for (const paramName in PARAMETERS) {
        const { unit } = PARAMETERS[paramName];
        const value = parseLabValue(text, paramName, unit);
        if (value !== null && !isNaN(value)) {
            newSample.parametros[paramName] = value;
            detectedCount++;
        }
    }

    if (detectedCount === 0) {
        alert("Advertencia: no se detectó ningún parámetro válido en el texto.");
        return;
    }

    const patientName = newSample.paciente;
    if (!labData[patientName]) {
        labData[patientName] = [];
    }

    const isDuplicate = labData[patientName].some(
        s => s.protocolo === newSample.protocolo && s.fecha === newSample.fecha
    );

    if (isDuplicate) {
        alert(`La muestra ${newSample.protocolo || ""} del ${newSample.fecha || "-"} ya existe. No se cargó.`);
        return;
    }

    labData[patientName].push(newSample);
    labData[patientName].sort((a, b) => a.timestamp - b.timestamp);
    saveData();

    alert(`Muestra cargada para ${patientName}. Parámetros detectados: ${detectedCount}.`);

    loadPatientSelector(patientName);
    loadPatientData(true);
    clearInput();
}

/* 7) UI: selectores y tablas */
function loadPatientSelector(selectThisPatient = null) {
    const selector = document.getElementById("patientSelector");
    const current = selector.value;
    selector.innerHTML = "";

    const optEmpty = document.createElement("option");
    optEmpty.value = "";
    optEmpty.textContent = "-- Seleccionar paciente --";
    selector.appendChild(optEmpty);

    const patientNames = Object.keys(labData).sort();
    patientNames.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        selector.appendChild(opt);
    });

    if (selectThisPatient && patientNames.includes(selectThisPatient)) {
        selector.value = selectThisPatient;
    } else if (patientNames.includes(current)) {
        selector.value = current;
    }
}

function loadParamSelector() {
    const patientName = document.getElementById("patientSelector").value;
    const selector = document.getElementById("paramSelector");
    selector.innerHTML = "";

    if (!patientName || !labData[patientName] || labData[patientName].length === 0) return;

    const allParams = new Set();
    labData[patientName].forEach(s => {
        Object.keys(s.parametros).forEach(p => allParams.add(p));
    });

    const sortedParams = Array.from(allParams).sort();
    sortedParams.forEach(param => {
        const opt = document.createElement("option");
        opt.value = param;
        opt.textContent = param.replace(/_/g, " ");
        selector.appendChild(opt);
    });
}

function loadPatientData(resetGraph = false) {
    const patientName = document.getElementById("patientSelector").value;
    const table = document.getElementById("uciTable");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    if (!patientName || !labData[patientName] || labData[patientName].length === 0) {
        thead.innerHTML = "";
        tbody.innerHTML = '<tr><td class="text-center py-4 text-gray-500">Seleccione un paciente con muestras.</td></tr>';
        if (chartInstance) chartInstance.destroy();
        return;
    }

    const samples = labData[patientName];

    loadParamSelector();

    const allParams = new Set();
    samples.forEach(s => {
        Object.keys(s.parametros).forEach(p => allParams.add(p));
    });
    const sortedParams = Array.from(allParams).sort();

    let headHTML = `
        <tr>
            <th class="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Fecha/Hora</th>
            <th class="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Protocolo</th>
    `;
    sortedParams.forEach(p => {
        const unit = PARAMETERS[p]?.unit || "";
        headHTML += `<th class="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase">${p.replace(/_/g, " ")}${unit ? " (" + unit + ")" : ""}</th>`;
    });
    headHTML += "</tr>";
    thead.innerHTML = headHTML;

    let bodyHTML = "";
    samples.forEach(s => {
        const fechaMostrar = s.fecha
            ? new Date(s.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
            : "-";
        bodyHTML += `<tr class="hover:bg-gray-50">
            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${fechaMostrar} ${s.hora ? s.hora.substring(0,5) : ""}</td>
            <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500">${s.protocolo || "N/A"}</td>
        `;
        sortedParams.forEach(p => {
            const v = s.parametros[p] !== undefined ? s.parametros[p] : "-";
            bodyHTML += `<td class="px-3 py-2 text-sm text-center">${v}</td>`;
        });
        bodyHTML += "</tr>";
    });
    tbody.innerHTML = bodyHTML;

    updateGraph();
}

/* 8) Gráfico */
function updateGraph() {
    const patientName = document.getElementById("patientSelector").value;
    const param = document.getElementById("paramSelector").value;
    const canvas = document.getElementById("evolutionChart");
    const ctx = canvas ? canvas.getContext("2d") : null;

    if (!patientName || !param || !ctx || !labData[patientName]) {
        if (chartInstance) chartInstance.destroy();
        return;
    }

    const samples = labData[patientName];
    const dataPoints = samples
        .filter(s => s.parametros[param] !== undefined)
        .map(s => ({
            x: new Date((s.fecha || "2000-01-01") + "T" + (s.hora || "00:00:00"))
                .toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
            y: s.parametros[param]
        }));

    const labels = dataPoints.map(d => d.x);
    const data = dataPoints.map(d => d.y);
    const unit = PARAMETERS[param]?.unit || "";

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: `${param.replace(/_/g, " ")}${unit ? " (" + unit + ")" : ""}`,
                data,
                borderColor: "rgb(59,130,246)",
                backgroundColor: "rgba(59,130,246,0.1)",
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: `Evolución de ${param.replace(/_/g, " ")}` }
            },
            scales: {
                y: {
                    title: { display: true, text: `Valor ${unit ? "(" + unit + ")" : ""}` }
                },
                x: {
                    title: { display: true, text: "Fecha y hora de muestra" }
                }
            }
        }
    });
}

/* 9) HCLAB */
function generateHCLAB() {
    const patientName = document.getElementById("patientSelector").value;
    if (!patientName || !labData[patientName] || labData[patientName].length === 0) {
        alert("Seleccione un paciente con muestras.");
        return;
    }

    const lastSample = labData[patientName][labData[patientName].length - 1];

    const hclabOrder = [
        "Na","K","Cl","Hemoglobina","Hematocrito","Glucosa","Urea","Creatinina",
        "ALT_TGP","AST_TGO","BT","BD","Albúmina","Proteínas_Totales",
        "CPK","PCR","INR","Lactato"
    ];

    const parts = [];
    hclabOrder.forEach(p => {
        const cfg = PARAMETERS[p];
        const v = lastSample.parametros[p];
        if (cfg && v !== undefined) {
            parts.push(`${cfg.hclab} ${v}`);
        }
    });

    const hclabString = parts.join(", ");
    const outputDiv = document.getElementById("hclabOutput");
    outputDiv.innerHTML = `
        <p class="font-bold text-gray-800 mb-1">
            Salida HCLAB (última muestra de ${patientName}):
        </p>
        <textarea id="hclabTextarea" class="w-full p-2 border rounded" rows="3" readonly>${hclabString}</textarea>
        <button id="btnCopiarHCLAB" class="mt-2 text-sm text-blue-600 hover:underline">Copiar al portapapeles</button>
    `;
    outputDiv.classList.remove("hidden");

    const btnCopy = document.getElementById("btnCopiarHCLAB");
    btnCopy.onclick = () => copyToClipboard(hclabString);
}

/* 10) CSV */
function downloadCSV() {
    const patientName = document.getElementById("patientSelector").value;
    if (!patientName || !labData[patientName] || labData[patientName].length === 0) {
        alert("Seleccione un paciente con muestras.");
        return;
    }

    const samples = labData[patientName];

    const allParams = new Set();
    samples.forEach(s => {
        Object.keys(s.parametros).forEach(p => allParams.add(p));
    });
    const sortedParams = Array.from(allParams).sort();

    let csv = "Paciente,Protocolo,Fecha,Hora," + sortedParams.join(",") + "\n";

    samples.forEach(s => {
        let row = `${s.paciente || ""},${s.protocolo || ""},${s.fecha || ""},${s.hora || ""},`;
        sortedParams.forEach(p => {
            row += (s.parametros[p] !== undefined ? s.parametros[p] : "") + ",";
        });
        csv += row.slice(0, -1) + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `LAB_UCI_${patientName.replace(/\s/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* 11) Utilitarios */
function clearInput() {
    const ta = document.getElementById("labInput");
    if (ta) ta.value = "";
}

function copyToClipboard(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand("copy");
        alert("Copiado al portapapeles.");
    } catch (e) {
        console.error("No se pudo copiar:", e);
        alert("Error al copiar. Seleccione el texto manualmente.");
    }
    document.body.removeChild(ta);
}

/* 12) Manejo de PDF con pdf.js */
function setupPdfHandling() {
    const pdfjsLib = window["pdfjsLib"];
    if (!pdfjsLib) {
        console.error("pdf.js no está disponible. La carga de PDF no funcionará.");
        return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js";

    const input = document.getElementById("pdfInput");
    if (!input) return;

    input.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function () {
            const overlay = document.getElementById("loading");
            if (overlay) overlay.classList.remove("hidden");

            const pdfData = new Uint8Array(this.result);
            try {
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(it => it.str).join(" ") + "\n\n";
                }
                const ta = document.getElementById("labInput");
                if (ta) ta.value = fullText;
                processInput(fullText);
            } catch (err) {
                console.error(err);
                alert("Error al procesar el PDF: " + err.message);
            } finally {
                const overlay2 = document.getElementById("loading");
                if (overlay2) overlay2.classList.add("hidden");
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

/* 13) Inicialización */
function initApp() {
    loadData();
    loadPatientSelector();

    const patientSelector = document.getElementById("patientSelector");
    if (patientSelector && patientSelector.options.length > 1) {
        patientSelector.value = patientSelector.options[1].value;
        loadPatientData(true);
    }

    const btnTexto = document.getElementById("btnProcesarTexto");
    if (btnTexto) btnTexto.onclick = () => processInput();

    const btnLimpiar = document.getElementById("btnLimpiarEntrada");
    if (btnLimpiar) btnLimpiar.onclick = () => clearInput();

    const btnHCLAB = document.getElementById("btnHCLAB");
    if (btnHCLAB) btnHCLAB.onclick = () => generateHCLAB();

    const btnCSV = document.getElementById("btnCSV");
    if (btnCSV) btnCSV.onclick = () => downloadCSV();

    if (patientSelector) {
        patientSelector.onchange = () => loadPatientData(true);
    }

    const paramSelector = document.getElementById("paramSelector");
    if (paramSelector) {
        paramSelector.onchange = () => updateGraph();
    }

    setupPdfHandling();
}

document.addEventListener("DOMContentLoaded", initApp);
