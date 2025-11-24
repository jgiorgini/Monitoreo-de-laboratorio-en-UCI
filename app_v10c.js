// Monitor de Laboratorios UCI - V10c
// Lógica principal separada en app_v10c.js

// =============================
// 1. CONFIGURACIÓN DE PARÁMETROS
// =============================

const PARAMETERS = {
    // Hematología
    "Hemoglobina": { synonyms: /(HGB|HEMOGLOBINA|HB\b|HEMOG)/i, unit: "g/dL", hclab: "Hb" },
    "Hematocrito": { synonyms: /(HCT|HEMATOCRITO|HTO)/i, unit: "%", hclab: "Hto" },

    // Iones / electrolitos
    "Na": { synonyms: /\b(NA|SODIO|NATREMIA)\b/i, unit: "mEq/L", hclab: "Na" },
    "K": { synonyms: /\b(K|POTASIO|KALEMIA)\b/i, unit: "mEq/L", hclab: "K" },
    "Cl": { synonyms: /\b(CL|CLORO|CLOREMIA)\b/i, unit: "mEq/L", hclab: "Cl" },
    "Mg": { synonyms: /\b(MG|MAGNESIO)\b/i, unit: "mg/dL", hclab: "Mg" },
    "Ca_Total": { synonyms: /(CA\s*TOTAL|CALCIO\s*TOTAL)/i, unit: "mg/dL", hclab: "CaT" },
    "Ca_Ionizado": { synonyms: /(CA\s*IONIZADO|CALCIO\s*IONIZADO)/i, unit: "mmol/L", hclab: "CaI" },

    // Metabolismo / Renal
    "Glucosa": { synonyms: /(GLUCOSA|GLU|GLICEMIA|GLC)/i, unit: "mg/dL", hclab: "Glu" },
    "Urea": { synonyms: /(UREA|UREICO|BUN)/i, unit: "mg/dL", hclab: "Urea" },
    "Creatinina": { synonyms: /(CREATININA|\bCR\b|\bCREA\b)/i, unit: "mg/dL", hclab: "Cr" },
    "Acido_Urico": { synonyms: /(ÁCIDO\s*ÚRICO|ACIDO\s*URICO)/i, unit: "mg/dL", hclab: "AU" },
    "Osmolalidad": { synonyms: /(OSMOLALIDAD|OSMOL)/i, unit: "mOsm/Kg", hclab: "Osm" },

    // Hepatograma
    "BT": { synonyms: /(BT\b|BILIRRUBINA\s*TOTAL)/i, unit: "mg/dL", hclab: "BT" },
    "BD": { synonyms: /(BD\b|BILIRRUBINA\s*DIRECTA)/i, unit: "mg/dL", hclab: "BD" },
    "AST_TGO": { synonyms: /(AST\b|TGO\b|ASPARTATO\s+AMINOTRANSFERASA)/i, unit: "U/L", hclab: "AST" },
    "ALT_TGP": { synonyms: /(ALT\b|TGP\b|ALANINA\s+AMINOTRANSFERASA|GPT\b)/i, unit: "U/L", hclab: "ALT" },
    "Fosfatasa_Alcalina": { synonyms: /(FOSFATASA\s*ALCALINA|FAL\b)/i, unit: "U/L", hclab: "FA" },
    "GGT": { synonyms: /(GGT\b|GAMMA\s*GLUTAMIL|GAMMAGT)/i, unit: "U/L", hclab: "GGT" },
    "Albúmina": { synonyms: /(ALBÚMINA|ALBUMINA|ALBUMIN\b)/i, unit: "g/dL", hclab: "Alb" },
    "Proteínas_Totales": { synonyms: /(PROTE[IÍ]NAS?\s*TOTAL(ES)?|PROT\s*TOTAL)/i, unit: "g/dL", hclab: "Prot" },

    // Perfil lipídico
    "Colesterol_Total": { synonyms: /(COLESTEROL\s*TOTAL|CT\b)/i, unit: "mg/dL", hclab: "CT" },
    "LDL": { synonyms: /\b(LDL|C\s*LDL)\b/i, unit: "mg/dL", hclab: "LDL" },
    "HDL": { synonyms: /\b(HDL|C\s*HDL)\b/i, unit: "mg/dL", hclab: "HDL" },
    "Triglicéridos": { synonyms: /(TRIGLIC[EÉ]RIDOS|TGL\b|TG\b)/i, unit: "mg/dL", hclab: "TGL" },
    "Lipoproteína_a": { synonyms: /(LIPOPROTE[IÍ]NA\s*\(A\)|LP\(A\))/i, unit: "mg/dL", hclab: "Lpa" },
    "ApoB": { synonyms: /(APOB|APOLIPOPROTE[IÍ]NA\s*B)/i, unit: "mg/dL", hclab: "ApoB" },

    // Inflamación
    "PCR": { synonyms: /\b(PCR|PROTE[IÍ]NA\s*C\s*REACTIVA)\b/i, unit: "mg/L", hclab: "PCR" },
    "Procalcitonina": { synonyms: /(PROCALCITONINA|PCT\b)/i, unit: "ng/ml", hclab: "PCT" },
    "VSG": { synonyms: /(VSG|VELOCIDAD\s*DE\s*SEDIMENTACI[ÓO]N)/i, unit: "mm/h", hclab: "VSG" },
    "Ferritina": { synonyms: /FERRITINA/i, unit: "ng/ml", hclab: "Ferr" },

    // Cardíacos
    "CPK": { synonyms: /(CK\b|CPK\b|CREATIN(KINASA|QUINASA))/i, unit: "U/L", hclab: "CPK" },
    "CK_MB": { synonyms: /(CK\s*MB)/i, unit: "ng/ml", hclab: "CKMB" },
    "Troponina": { synonyms: /(TROPONINA\s*[TI]?)/i, unit: "ng/ml", hclab: "Trop" },
    "NT_proBNP": { synonyms: /(NT-?PROBNP|NT\s*PRO\s*BNP|BNP\b)/i, unit: "pg/ml", hclab: "BNP" },

    // Vitaminas / hormonas
    "Vitamina_B12": { synonyms: /(VITAMINA\s*B12|CIANOCOBALAMINA)/i, unit: "pg/ml", hclab: "B12" },
    "Acido_Fólico": { synonyms: /(ÁCIDO\s*F[ÓO]LICO|FOLATO)/i, unit: "ng/ml", hclab: "Fol" },
    "TSH": { synonyms: /\bTSH\b/i, unit: "uUI/ml", hclab: "TSH" },
    "Cortisol": { synonyms: /CORTISOL/i, unit: "mcg/dL", hclab: "Cort" },

    // Coagulación
    "TP": { synonyms: /\b(TP|TIEMPO\s*DE\s*PROTROMBINA)\b/i, unit: "%", hclab: "TP" },
    "INR": { synonyms: /\bINR\b/i, unit: "", hclab: "INR" },
    "TTPA": { synonyms: /(TTPA|TTP\b)/i, unit: "s", hclab: "TTPA" },
    "Fibrinógeno": { synonyms: /(FIBRIN[ÓO]GENO)/i, unit: "mg/dL", hclab: "Fib" },

    // Otros
    "Lactato": { synonyms: /(LACTATO|ÁCIDO\s*L[ÁA]CTICO)/i, unit: "mmol/L", hclab: "Lact" }
};

// =============================
// 2. UNIDADES (solo para mostrar / doc, ya no obligan a matchear)
// =============================

const UNIT_REGEX = {
    "U/L": "(U|UI)\\s*\\/?\\s*[Ll1]",
    "mg/dL": "mg\\s*\\/\\s*d[Ll1]",
    "g/dL": "g\\s*\\/\\s*d[Ll1]",
    "%": "%",
    "mEq/L": "mEq\\s*\\/\\s*[Ll1]",
    "mmol/L": "mmol\\s*\\/\\s*[Ll1]",
    "ng/ml": "ng\\s*\\/\\s*ml",
    "pg/ml": "pg\\s*\\/\\s*ml",
    "mm/h": "mm\\s*\\/\\s*h",
    "mOsm/Kg": "mOsm\\s*\\/\\s*Kg",
    "uUI/ml": "uUI\\s*\\/\\s*ml",
    "mcg/dL": "mcg\\s*\\/\\s*d[Ll1]",
    "s": "\\ss\\b",
    "": "\\s*$"
};

// =============================
// 3. ALMACENAMIENTO
// =============================

let labData = {};
let chartInstance = null;
const LOCAL_STORAGE_KEY = "uciLabMonitorData_V10c";

function saveData() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(labData));
    } catch (e) {
        console.warn("No se pudo guardar en localStorage", e);
    }
}

function loadData() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) labData = JSON.parse(stored);
    } catch (e) {
        console.warn("No se pudo leer localStorage", e);
        labData = {};
    }
}

// =============================
// 4. PARSING DE VALORES (versión simplificada)
// =============================

function parseLabValue(text, paramName) {
    const config = PARAMETERS[paramName];
    if (!config) return null;

    // Trabajamos sobre 1 sola versión en mayúsculas para robustez,
    // pero dejamos los números tal cual para no romper decimales.
    const upperText = text.toUpperCase();
    const paramRegexSource = config.synonyms.source.toUpperCase();

    // 1) Encontrar el índice del parámetro (primer match)
    const paramRegex = new RegExp(paramRegexSource, "i");
    const matchParam = upperText.match(paramRegex);
    if (!matchParam) return null;

    const startIdx = matchParam.index || 0;

    // 2) Tomar una ventana después del nombre (hasta 120–150 caracteres)
    const windowText = text.slice(startIdx, startIdx + 150);

    // 3) Buscar el PRIMER número razonable en esa ventana
    //    - permite decimales con coma o punto
    //    - ignora números muy largos tipo "2025" SOLO si hay otros más “de laboratorio”
    const numRegex = /(\d+[\d\.,]*)/g;
    let candidate = null;
    let m;
    while ((m = numRegex.exec(windowText)) !== null) {
        const raw = m[1];

        // descartamos cosas muy raras (ej: números de protocolo largos) si hay otras opciones
        if (raw.length > 8) continue;

        candidate = raw;
        break; // primer número en la ventana
    }

    if (!candidate) return null;

    // Normalizar: 1.234,56 -> 1234.56
    let valueStr = candidate.replace(/\./g, "").replace(",", ".");
    const value = parseFloat(valueStr);
    return isNaN(value) ? null : value;
}

// =============================
// 5. PARSING DE METADATOS
// =============================

function normalizeDate(dateStr) {
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length !== 3) return null;
    let d = parts[0].padStart(2, "0");
    let m = parts[1].padStart(2, "0");
    let y = parts[2];
    if (y.length === 2) y = "20" + y;
    return `${y}-${m}-${d}`;
}

function extractMetadata(text) {
    const upper = text.toUpperCase();
    const result = { paciente: null, protocolo: null, fecha: null, hora: "00:00:00" };

    // 1) PACIENTE
    const patientRegex = /(PACIENTE|NOMBRE|PT)\s*[:]?\s*([A-ZÁÉÍÓÚÑ\s\.,]{5,})/i;
    let match = upper.match(patientRegex);
    if (match) {
        result.paciente = match[2].trim().replace(/\s{2,}/g, " ");
    }

    // 2) PROTOCOLO
    const protocolRegex = /(PROTOCOLO\s*(N[º°O]?|N°)?\s*[:#]?\s*)([A-Z0-9-]{4,})/i;
    match = upper.match(protocolRegex);
    if (match) {
        result.protocolo = match[3].trim();
    }

    // 3) TOMA DE MUESTRA (fecha y hora preferidas)
    let fecha = null;
    let hora = null;

    const tomaRegex = /(TOMA\s+DE\s+MUESTRA[^0-9]*)(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})(?:\s+(\d{1,2}:\d{2}))?/i;
    match = upper.match(tomaRegex);
    if (match) {
        fecha = match[2];
        if (match[3]) hora = match[3];
    }

    // 4) Evitar F. NAC si no encontramos "Toma de muestra"
    if (!fecha) {
        const allDates = [...upper.matchAll(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g)].map(m => m[0]);

        let birthDate = null;
        const fnacRegex =
            /(F\.?\s*NAC|FECHA\s*NAC(IMIENTO)?)[^0-9]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;
        const fnacMatch = upper.match(fnacRegex);
        if (fnacMatch) birthDate = fnacMatch[3];

        const candidates = allDates.filter(d => d !== birthDate);
        if (candidates.length > 0) {
            fecha = candidates[0];
        }
    }

    if (fecha) {
        result.fecha = normalizeDate(fecha);
    }

    if (hora) {
        result.hora = hora + ":00";
    } else if (result.fecha) {
        result.hora = "12:00:00";
    }

    return result;
}

// =============================
// 6. PROCESAMIENTO DE ENTRADA
// =============================

function processInput(text) {
    if (!text || !text.trim()) {
        alert("Pegue el texto del laboratorio o cargue un PDF.");
        return;
    }

    // Normalizar comas decimales
    text = text.replace(/(\d),(\d)/g, "$1.$2");

    const metadata = extractMetadata(text);
    if (!metadata.paciente) {
        alert("No se pudo identificar el nombre del paciente. La muestra no se guardará.");
        return;
    }

    const newSample = {
        ...metadata,
        parametros: {},
        timestamp: metadata.fecha ? new Date(`${metadata.fecha}T${metadata.hora}`).getTime() : Date.now()
    };

    let detected = 0;
    for (const paramName in PARAMETERS) {
        const value = parseLabValue(text, paramName);
        if (value !== null) {
            newSample.parametros[paramName] = value;
            detected++;
        }
    }

    if (detected === 0) {
        alert("No se detectó ningún parámetro conocido en este informe. Revisar formato o lista blanca.");
        return;
    }

    const patientName = newSample.paciente;
    if (!labData[patientName]) labData[patientName] = [];

    const isDuplicate = labData[patientName].some(
        s => s.protocolo && newSample.protocolo && s.protocolo === newSample.protocolo
    );

    if (isDuplicate) {
        alert(`La muestra con protocolo ${newSample.protocolo} ya existe para este paciente. No se duplicó.`);
    } else {
        labData[patientName].push(newSample);
        labData[patientName].sort((a, b) => a.timestamp - b.timestamp);
        saveData();
        alert(
            `Muestra guardada para ${patientName} (${newSample.fecha || "sin fecha"} ${
                newSample.hora.substring(0, 5)
            }). Parámetros detectados: ${detected}.`
        );
    }

    loadPatientSelector(patientName);
    const ta = document.getElementById("labInput");
    if (ta) ta.value = "";
}

// =============================
// 7. UI: SELECTORES Y TABLAS
// =============================

function loadPatientSelector(selectPatient = null) {
    const selector = document.getElementById("patientSelector");
    if (!selector) return;
    const current = selector.value;

    selector.innerHTML = '<option value="">-- Seleccionar paciente --</option>';

    const names = Object.keys(labData).sort();
    names.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        selector.appendChild(opt);
    });

    if (selectPatient && names.includes(selectPatient)) {
        selector.value = selectPatient;
    } else if (names.includes(current)) {
        selector.value = current;
    }

    if (selector.value) {
        loadPatientData();
    }
}

function loadParamSelector() {
    const patientName = document.getElementById("patientSelector").value;
    const selector = document.getElementById("paramSelector");
    if (!selector) return;

    selector.innerHTML = "";

    if (!patientName || !labData[patientName]) return;

    const allParams = new Set();
    labData[patientName].forEach(sample => {
        Object.keys(sample.parametros).forEach(p => allParams.add(p));
    });

    const sorted = Array.from(allParams).sort();
    sorted.forEach(param => {
        const opt = document.createElement("option");
        opt.value = param;
        opt.textContent = param.replace(/_/g, " ");
        selector.appendChild(opt);
    });
}

function loadPatientData() {
    const patientName = document.getElementById("patientSelector").value;
    const table = document.getElementById("uciTable");
    if (!table) return;
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    if (!patientName || !labData[patientName] || labData[patientName].length === 0) {
        thead.innerHTML = "";
        tbody.innerHTML =
            '<tr><td class="text-center py-4 text-gray-500" colspan="10">Seleccione un paciente con muestras cargadas.</td></tr>';
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        return;
    }

    const samples = labData[patientName];

    const allParams = new Set();
    samples.forEach(sample => Object.keys(sample.parametros).forEach(p => allParams.add(p)));
    const sortedParams = Array.from(allParams).sort();

    let headHTML = `
        <tr>
            <th class="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Fecha/Hora</th>
            <th class="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Protocolo</th>
    `;
    sortedParams.forEach(p => {
        const unit = PARAMETERS[p]?.unit || "";
        headHTML += `<th class="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase">${p.replace(
            /_/g,
            " "
        )}${unit ? " (" + unit + ")" : ""}</th>`;
    });
    headHTML += "</tr>";
    thead.innerHTML = headHTML;

    let bodyHTML = "";
    samples.forEach(sample => {
        const dt = sample.fecha
            ? new Date(sample.fecha + "T" + sample.hora)
            : new Date(sample.timestamp || Date.now());
        const displayDate = dt.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });

        bodyHTML += `<tr class="hover:bg-gray-50">
            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${displayDate}</td>
            <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500">${sample.protocolo || "N/A"}</td>
        `;

        sortedParams.forEach(p => {
            const v = sample.parametros[p];
            bodyHTML += `<td class="px-3 py-2 text-sm text-center">${v !== undefined ? v : "-"}</td>`;
        });
        bodyHTML += "</tr>";
    });

    tbody.innerHTML = bodyHTML;

    loadParamSelector();
    updateGraph();
}

// =============================
// 8. GRÁFICO
// =============================

function updateGraph() {
    const patientName = document.getElementById("patientSelector").value;
    const param = document.getElementById("paramSelector").value;
    const canvas = document.getElementById("evolutionChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (!patientName || !param || !labData[patientName]) {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        return;
    }

    const samples = labData[patientName];
    const dataPoints = samples
        .filter(s => s.parametros[param] !== undefined)
        .map(s => {
            const dt = s.fecha ? new Date(s.fecha + "T" + s.hora) : new Date(s.timestamp);
            return {
                x: dt.toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                y: s.parametros[param]
            };
        });

    const labels = dataPoints.map(d => d.x);
    const values = dataPoints.map(d => d.y);
    const unit = PARAMETERS[param]?.unit || "";

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: `${param.replace(/_/g, " ")}${unit ? " (" + unit + ")" : ""}`,
                    data: values,
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.15)",
                    borderWidth: 2,
                    tension: 0.25,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: `Evolución de ${param.replace(/_/g, " ")}` }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: unit ? `Valor (${unit})` : "Valor" }
                },
                x: {
                    title: { display: true, text: "Fecha y hora de muestra" }
                }
            }
        }
    });
}

// =============================
// 9. HCLAB Y CSV
// =============================

function generateHCLAB() {
    const patientName = document.getElementById("patientSelector").value;
    if (!patientName || !labData[patientName] || labData[patientName].length === 0) {
        alert("Seleccione un paciente con al menos una muestra.");
        return;
    }

    const samples = labData[patientName];
    const lastSample = samples[samples.length - 1];

    const order = [
        "Na",
        "K",
        "Cl",
        "Hemoglobina",
        "Hematocrito",
        "Glucosa",
        "Urea",
        "Creatinina",
        "ALT_TGP",
        "AST_TGO",
        "BT",
        "BD",
        "Albúmina",
        "Proteínas_Totales",
        "CPK",
        "PCR",
        "INR",
        "Lactato"
    ];

    const parts = [];
    order.forEach(p => {
        const cfg = PARAMETERS[p];
        const value = lastSample.parametros[p];
        if (cfg && value !== undefined) {
            parts.push(`${cfg.hclab} ${value}`);
        }
    });

    const text = parts.join(", ");
    const outDiv = document.getElementById("hclabOutput");
    outDiv.innerHTML = `
        <p class="font-bold text-gray-800 mb-1">Salida HCLAB (última muestra):</p>
        <textarea id="hclabTextarea" class="w-full p-2 border rounded" rows="3" readonly>${text}</textarea>
        <button class="mt-2 text-sm text-blue-600 hover:underline" onclick="copyToClipboard(document.getElementById('hclabTextarea').value)">Copiar al portapapeles</button>
    `;
    outDiv.classList.remove("hidden");
}

function downloadCSV() {
    const patientName = document.getElementById("patientSelector").value;
    if (!patientName || !labData[patientName] || labData[patientName].length === 0) {
        alert("Seleccione un paciente con datos para descargar.");
        return;
    }

    const samples = labData[patientName];

    const allParams = new Set();
    samples.forEach(s => Object.keys(s.parametros).forEach(p => allParams.add(p)));
    const sorted = Array.from(allParams).sort();

    let csv = "Paciente,Protocolo,Fecha,Hora," + sorted.join(",") + "\n";

    samples.forEach(s => {
        const row = [
            `"${s.paciente}"`,
            `"${s.protocolo || ""}"`,
            s.fecha || "",
            s.hora || "",
            ...sorted.map(p => (s.parametros[p] !== undefined ? s.parametros[p] : ""))
        ];
        csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LAB_UCI_${patientName.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =============================
// 10. UTILIDADES
// =============================

function clearInput() {
    const ta = document.getElementById("labInput");
    if (ta) ta.value = "";
    const outDiv = document.getElementById("hclabOutput");
    if (outDiv) outDiv.classList.add("hidden");
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
        alert("No se pudo copiar. Seleccione y copie manualmente.");
    }
    document.body.removeChild(ta);
}

// =============================
// 11. MANEJO DE PDF (pdf.js)
// =============================

function setupPdfHandling() {
    const pdfInput = document.getElementById("pdfInput");
    const loading = document.getElementById("loading");
    if (!pdfInput) return;

    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    if (!pdfjsLib) {
        console.error("pdf.js no está disponible; la carga de PDF no funcionará.");
        return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js";

    pdfInput.addEventListener("change", event => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function () {
            if (loading) loading.classList.remove("hidden");
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
                alert("Error procesando el PDF: " + err.message);
            } finally {
                if (loading) loading.classList.add("hidden");
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// =============================
// 12. INICIALIZACIÓN
// =============================

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    loadPatientSelector();
    setupPdfHandling();

    const btnTexto = document.getElementById("btnProcesarTexto");
    const btnLimpiar = document.getElementById("btnLimpiarEntrada");
    const btnHCLAB = document.getElementById("btnHCLAB");
    const btnCSV = document.getElementById("btnCSV");

    if (btnTexto) btnTexto.addEventListener("click", () => processInput(document.getElementById("labInput").value));
    if (btnLimpiar) btnLimpiar.addEventListener("click", clearInput);
    if (btnHCLAB) btnHCLAB.addEventListener("click", generateHCLAB);
    if (btnCSV) btnCSV.addEventListener("click", downloadCSV);

    const patientSelector = document.getElementById("patientSelector");
    if (patientSelector && patientSelector.value) {
        loadPatientData();
    }
});
