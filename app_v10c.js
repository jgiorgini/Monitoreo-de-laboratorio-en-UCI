// Monitor de Laboratorios UCI - Versión IA (Definitiva)
// =====================================================

// CONFIGURACIÓN: Lista de parámetros que queremos que la IA busque.
const TARGET_PARAMS = [
    "Hemoglobina", "Hematocrito", "Plaquetas", "Leucocitos",
    "Na", "K", "Cl", "Mg", "Ca_Total", "Ca_Ionizado",
    "Glucosa", "Urea", "Creatinina", "Acido_Urico", "Osmolalidad",
    "BT", "BD", "AST_TGO", "ALT_TGP", "Fosfatasa_Alcalina", "GGT", "Albúmina", "Proteínas_Totales",
    "Colesterol_Total", "LDL", "HDL", "Triglicéridos",
    "PCR", "Procalcitonina", "VSG", "Ferritina",
    "CPK", "Troponina", "NT_proBNP",
    "TP", "INR", "TTPA", "Fibrinógeno",
    "Lactato"
];

// Unidades para visualización (solo cosmético)
const UNITS = {
    "Hemoglobina": "g/dL", "Hematocrito": "%", "Na": "mEq/L", "K": "mEq/L",
    "Glucosa": "mg/dL", "Creatinina": "mg/dL", "Lactato": "mmol/L"
};

// =============================
// 1. ALMACENAMIENTO (Igual que antes)
// =============================
let labData = {};
const LOCAL_STORAGE_KEY = "uciLabMonitorData_AI";
let chartInstance = null;

function loadData() {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) labData = JSON.parse(stored);
}
function saveData() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(labData));
}

// =============================
// 2. CORAZÓN: LLAMADA A LA IA
// =============================

async function extractDataWithOpenAI(rawText, apiKey) {
    const prompt = `
    Actúa como un analista de datos médicos experto.
    Analiza el siguiente texto extraído de un laboratorio (puede tener errores de OCR, texto desordenado o fechas sueltas).
    
    Tu tarea:
    1. Identifica el PACIENTE (Nombre).
    2. Identifica la FECHA de la muestra (formato YYYY-MM-DD). Si hay varias, prioriza la "fecha de toma" o "muestra". Ignora fecha de nacimiento.
    3. Identifica el PROTOCOLO (o ID de orden).
    4. Extrae los valores numéricos para los siguientes parámetros: ${TARGET_PARAMS.join(", ")}.
    
    Reglas CRÍTICAS:
    - Devuelve SOLO un objeto JSON válido. Nada más.
    - Si un parámetro no está en el texto, NO lo incluyas en el JSON.
    - Convierte todos los números a formato decimal con punto (ej: "1.350" -> 1350, "3,5" -> 3.5).
    - NO confundas el año (2023, 2024) con valores de análisis.
    - Formato JSON esperado:
    {
      "paciente": "NOMBRE COMPLETO",
      "fecha": "YYYY-MM-DD",
      "hora": "HH:MM",
      "protocolo": "string",
      "parametros": {
          "Glucosa": 98,
          "K": 4.1,
          ...
      }
    }

    TEXTO A ANALIZAR:
    """
    ${rawText.substring(0, 12000)} 
    """
    (Fin del texto, procesa y responde solo JSON).
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Modelo rápido y barato
                messages: [{ role: "user", content: prompt }],
                temperature: 0
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Error en la API");
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Limpiar bloques de código markdown si la IA los pone
        const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);

    } catch (e) {
        console.error(e);
        alert("Error consultando a la IA: " + e.message);
        return null;
    }
}

// =============================
// 3. PROCESAMIENTO
// =============================

async function processInput() {
    const rawText = document.getElementById("labInput").value;
    const apiKey = document.getElementById("apiKey").value.trim();

    if (!rawText) return alert("Cargue un PDF o pegue texto primero.");
    if (!apiKey) return alert("Se requiere una API Key de OpenAI para usar la extracción inteligente.");

    // UI Loading
    const btn = document.getElementById("btnProcesarIA");
    const originalText = btn.innerText;
    btn.innerText = "Analizando con IA...";
    btn.disabled = true;

    // Llamada a la IA
    const result = await extractDataWithOpenAI(rawText, apiKey);

    // Restaurar UI
    btn.innerText = originalText;
    btn.disabled = false;

    if (!result) return; // Hubo error

    // Validaciones básicas sobre el resultado JSON
    if (!result.paciente || result.paciente === "NO ENCONTRADO") {
        const manual = prompt("La IA no detectó el nombre exacto. Ingréselo:");
        if (manual) result.paciente = manual.toUpperCase();
        else return;
    }
    
    // Si la fecha falla, poner hoy
    if (!result.fecha) result.fecha = new Date().toISOString().split('T')[0];
    if (!result.hora) result.hora = "12:00";

    const numParams = Object.keys(result.parametros || {}).length;
    if (numParams === 0) {
        alert("La IA leyó el texto pero no encontró resultados de laboratorio compatibles en la lista.");
        return;
    }

    // --- GUARDADO (Lógica existente) ---
    const patientName = result.paciente;
    if (!labData[patientName]) labData[patientName] = [];

    // Chequeo duplicados por protocolo
    const exists = labData[patientName].some(s => 
        (result.protocolo && s.protocolo === result.protocolo) ||
        (s.fecha === result.fecha && s.hora === result.hora)
    );

    if (exists) {
        alert("Este laboratorio ya parece estar cargado (coincide protocolo o fecha/hora).");
        return;
    }

    const newSample = {
        paciente: patientName,
        fecha: result.fecha,
        hora: result.hora,
        protocolo: result.protocolo,
        parametros: result.parametros,
        timestamp: new Date(result.fecha + "T" + result.hora).getTime()
    };

    labData[patientName].push(newSample);
    labData[patientName].sort((a, b) => a.timestamp - b.timestamp);
    saveData();
    
    loadPatientSelector(patientName);
    alert(`¡Éxito! Se extrajeron ${numParams} parámetros para ${patientName}.`);
    document.getElementById("labInput").value = ""; // Limpiar
}

// =============================
// 4. INTERFAZ (Tablas y Gráficos)
// =============================

function loadPatientSelector(preselect = null) {
    const sel = document.getElementById("patientSelector");
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccionar --</option>';
    
    Object.keys(labData).sort().forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.innerText = p;
        sel.appendChild(opt);
    });

    if (preselect) sel.value = preselect;
    if (sel.value) loadPatientData();
}

function loadPatientData() {
    const patientName = document.getElementById("patientSelector").value;
    const tbody = document.querySelector("#uciTable tbody");
    const thead = document.querySelector("#uciTable thead");
    if (!patientName) return;

    const samples = labData[patientName];
    
    // Obtener todas las columnas
    let allKeys = new Set();
    samples.forEach(s => Object.keys(s.parametros).forEach(k => allKeys.add(k)));
    let sortedKeys = Array.from(allKeys).sort();

    // Render Header
    let headHTML = `<tr class="bg-blue-100 text-left text-xs font-bold uppercase text-gray-700">
        <th class="p-3 sticky left-0 bg-blue-100 z-10">Fecha</th>
        <th class="p-3">Protocolo</th>`;
    sortedKeys.forEach(k => {
        headHTML += `<th class="p-3 text-center whitespace-nowrap">${k} <span class="text-[9px] text-gray-500">${UNITS[k]||""}</span></th>`;
    });
    headHTML += "</tr>";
    thead.innerHTML = headHTML;

    // Render Body
    let bodyHTML = "";
    samples.forEach(s => {
        let row = `<tr class="border-b hover:bg-gray-50">
            <td class="p-3 sticky left-0 bg-white font-medium text-sm whitespace-nowrap">${s.fecha} <span class="text-xs text-gray-400">${s.hora}</span></td>
            <td class="p-3 text-xs text-gray-500">${s.protocolo || "-"}</td>`;
        
        sortedKeys.forEach(k => {
            const val = s.parametros[k];
            row += `<td class="p-3 text-center text-sm">${val !== undefined ? val : ""}</td>`;
        });
        row += "</tr>";
        bodyHTML += row;
    });
    tbody.innerHTML = bodyHTML;
    
    updateParamSelector();
}

function updateParamSelector() {
    const patientName = document.getElementById("patientSelector").value;
    const pSel = document.getElementById("paramSelector");
    pSel.innerHTML = "";
    if(!patientName) return;

    let allKeys = new Set();
    labData[patientName].forEach(s => Object.keys(s.parametros).forEach(k => allKeys.add(k)));
    
    Array.from(allKeys).sort().forEach(k => {
        const opt = document.createElement("option");
        opt.value = k;
        opt.innerText = k;
        pSel.appendChild(opt);
    });
    updateGraph(); // Render inicial
}

// =============================
// 5. GRÁFICO SIMPLE
// =============================
function updateGraph() {
    const patientName = document.getElementById("patientSelector").value;
    const param = document.getElementById("paramSelector").value;
    const ctx = document.getElementById("evolutionChart").getContext("2d");
    
    if (chartInstance) chartInstance.destroy();
    if (!patientName || !param) return;

    const data = labData[patientName]
        .filter(s => s.parametros[param] !== undefined)
        .map(s => ({ x: s.fecha + " " + s.hora, y: s.parametros[param] }));

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.x),
            datasets: [{
                label: param,
                data: data.map(d => d.y),
                borderColor: 'rgb(37, 99, 235)',
                tension: 0.2
            }]
        }
    });
}

// =============================
// 6. INIT & PDF (pdf.js)
// =============================
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    loadPatientSelector();
    
    // Listeners
    document.getElementById("btnProcesarIA")?.addEventListener("click", processInput);
    document.getElementById("patientSelector")?.addEventListener("change", loadPatientData);
    document.getElementById("paramSelector")?.addEventListener("change", updateGraph);
    document.getElementById("btnLimpiarEntrada")?.addEventListener("click", () => document.getElementById("labInput").value = "");
    document.getElementById("btnReset")?.addEventListener("click", () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        location.reload();
    });

    setupPdf();
});

function setupPdf() {
    const input = document.getElementById("pdfInput");
    if(!input) return;
    
    // Config PDF.js worker
    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js";

    input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        document.getElementById("labInput").value = "Leyendo PDF...";
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(buffer).promise;
        
        let fullText = "";
        for(let i=1; i<=pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(it => it.str).join(" ") + "\n";
        }
        
        document.getElementById("labInput").value = fullText;
    });
}
