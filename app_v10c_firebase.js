// Monitor UCI - Versión Firebase (Definitiva y Blindada)
// ======================================================

// --- 1. CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAnQUto5Kqs-YvPsDL-ZIPVHIzwxaZ-Kw8",
  authDomain: "laboratorios-uco.firebaseapp.com",
  projectId: "laboratorios-uco",
  storageBucket: "laboratorios-uco.firebasestorage.app",
  messagingSenderId: "435400240534",
  appId: "1:435400240534:web:1cb4c57beb4b69e933c1b7",
  measurementId: "G-Q0FE3ZD4P7"
};

// Inicializar Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- CONFIG PARAMETROS ---
const TARGET_PARAMS = [
    "Hemoglobina", "Hematocrito", "Plaquetas", "Leucocitos",
    "Na", "K", "Cl", "Mg", "Ca_Total",
    "Glucosa", "Urea", "Creatinina", "Acido_Urico", 
    "BT", "BD", "AST_TGO", "ALT_TGP", "Fosfatasa_Alcalina", "Albúmina",
    "PCR", "Procalcitonina", "Lactato", "pH", "pCO2", "pO2", "Bicarbonato", "SatO2"
];

const UNITS = {
    "Hemoglobina": "g/dL", "Hematocrito": "%", "Na": "mEq/L", "K": "mEq/L",
    "Glucosa": "mg/dL", "Lactato": "mmol/L", "Creatinina": "mg/dL"
};

let labData = {}; 
let chartInstance = null;

// =============================
// 2. SINCRONIZACIÓN REAL-TIME
// =============================

function initRealTimeListener() {
    db.collection("muestras").orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            labData = {}; 
            snapshot.forEach((doc) => {
                const data = doc.data();
                const pac = data.paciente;
                if (!labData[pac]) labData[pac] = [];
                labData[pac].push({ ...data, id: doc.id });
            });
            refreshUI();
        }, (error) => {
            console.error("Error recibiendo datos:", error);
        });
}

function refreshUI() {
    const selector = document.getElementById("patientSelector");
    if(!selector) return;
    const currentPatient = selector.value;
    loadPatientSelector(currentPatient); 
    if(currentPatient) loadPatientData(); 
}

// =============================
// 3. LOGICA IA
// =============================
async function extractDataWithOpenAI(rawText, apiKey) {
    const prompt = `
    Analiza este texto de laboratorio médico. Devuelve JSON.
    Campos: "paciente" (Nombre completo, MAYUSCULAS), "fecha" (YYYY-MM-DD), "hora" (HH:MM), "protocolo" (string).
    Busca valores numéricos para: ${TARGET_PARAMS.join(", ")}.
    
    Reglas:
    - JSON válido estricto.
    - Si no encuentras paciente, pon "DESCONOCIDO".
    
    TEXTO:
    """${rawText.substring(0, 10000)}"""
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0
            })
        });

        if (!response.ok) throw new Error("Error OpenAI");
        const data = await response.json();
        const content = data.choices[0].message.content.replace(/```json|```/g, "").trim();
        return JSON.parse(content);
    } catch (e) {
        console.error(e);
        return null;
    }
}

// =============================
// 4. PROCESAR Y SUBIR (BLINDADO)
// =============================

// Función auxiliar para eliminar 'undefined' recursivamente
function cleanObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(cleanObject).filter(v => v !== undefined);
    }
    
    const newObj = {};
    for (const key in obj) {
        const value = cleanObject(obj[key]);
        if (value !== undefined) {
            newObj[key] = value;
        }
    }
    return newObj;
}

async function processAndUpload() {
    const rawText = document.getElementById("labInput").value;
    
    let apiKey = document.getElementById("apiKey").value.trim();
    if(!apiKey) apiKey = localStorage.getItem("my_openai_key_v1");

    if (!rawText) return alert("Cargue un PDF primero.");
    if (!apiKey) {
        document.getElementById("configDetails").open = true;
        document.getElementById("apiKey").focus();
        return alert("Por favor, configure su API Key en el menú de engranaje.");
    }

    localStorage.setItem("my_openai_key_v1", apiKey);

    const btn = document.getElementById("btnProcesarIA");
    btn.disabled = true;
    btn.innerText = "⏳ Procesando...";

    const result = await extractDataWithOpenAI(rawText, apiKey);
    
    if (!result) {
        alert("Error al interpretar los datos. Revise su API Key o el PDF.");
        btn.disabled = false;
        btn.innerText = "✨ Extraer y Subir";
        return;
    }

    if (!result.paciente || result.paciente === "DESCONOCIDO") {
        const manual = prompt("Nombre del paciente no detectado. Ingréselo:");
        if (manual) result.paciente = manual.toUpperCase();
        else {
            btn.disabled = false; 
            btn.innerText = "✨ Extraer y Subir";
            return;
        }
    }
    
    if(!result.fecha) result.fecha = new Date().toISOString().split('T')[0];
    if(!result.hora) result.hora = "12:00";

    // Creamos el objeto crudo
    const rawDoc = {
        paciente: result.paciente,
        fecha: result.fecha,
        hora: result.hora,
        protocolo: result.protocolo || "",
        parametros: result.parametros || {}, 
        timestamp: new Date(result.fecha + "T" + result.hora).getTime(),
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // LIMPIEZA PROFUNDA: Esto elimina cualquier rastro de 'undefined'
    const finalDoc = cleanObject(rawDoc);

    try {
        await db.collection("muestras").add(finalDoc);
        alert(`¡Guardado en la nube! Paciente: ${result.paciente}`);
        document.getElementById("labInput").value = "";
    } catch (e) {
        console.error("ERROR CRÍTICO:", e);
        alert("Error subiendo a Firebase: " + e.message);
    }

    btn.disabled = false;
    btn.innerText = "✨ Extraer y Subir";
}

// =============================
// 5. UI HELPERS
// =============================

function loadPatientSelector(preserveValue = null) {
    const sel = document.getElementById("patientSelector");
    if(!sel) return;
    const current = preserveValue || sel.value;
    sel.innerHTML = '<option value="">-- Seleccionar --</option>';
    Object.keys(labData).sort().forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.innerText = p;
        sel.appendChild(opt);
    });
    if (current && labData[current]) sel.value = current;
    else if (!current) {
        const tbody = document.querySelector("#uciTable tbody");
        if(tbody) tbody.innerHTML = "";
    }
}

function loadPatientData() {
    const patientName = document.getElementById("patientSelector").value;
    const tbody = document.querySelector("#uciTable tbody");
    const thead = document.querySelector("#uciTable thead");
    const paramSel = document.getElementById("paramSelector");

    if (!patientName || !labData[patientName]) return;
    const samples = labData[patientName];
    
    let allKeys = new Set();
    samples.forEach(s => Object.keys(s.parametros || {}).forEach(k => allKeys.add(k)));
    let sortedKeys = Array.from(allKeys).sort();

    let headHTML = `<tr class="bg-blue-100 text-left text-xs font-bold uppercase text-gray-700">
        <th class="p-3 sticky left-0 bg-blue-100 z-10 border-b border-blue-200">Fecha</th>`;
    sortedKeys.forEach(k => {
        headHTML += `<th class="p-3 text-center whitespace-nowrap border-b border-blue-200">${k} <span class="text-[9px] text-gray-500 block">${UNITS[k]||""}</span></th>`;
    });
    headHTML += "</tr>";
    if(thead) thead.innerHTML = headHTML;

    let bodyHTML = "";
    samples.forEach(s => {
        let row = `<tr class="border-b hover:bg-gray-50 transition">
            <td class="p-3 sticky left-0 bg-white font-medium text-sm whitespace-nowrap border-r border-gray-100">
                ${s.fecha} <span class="text-xs text-gray-400 ml-1">${s.hora}</span>
            </td>`;
        sortedKeys.forEach(k => {
            const val = s.parametros[k];
            row += `<td class="p-3 text-center text-sm text-gray-700">${val !== undefined ? val : "-"}</td>`;
        });
        row += "</tr>";
        bodyHTML += row;
    });
    if(tbody) tbody.innerHTML = bodyHTML;

    const currentParam = paramSel.value;
    paramSel.innerHTML = "";
    sortedKeys.forEach(k => {
        const opt = document.createElement("option");
        opt.value = k;
        opt.innerText = k;
        paramSel.appendChild(opt);
    });
    if(sortedKeys.includes(currentParam)) paramSel.value = currentParam;
    updateGraph();
}

function updateGraph() {
    const patientName = document.getElementById("patientSelector").value;
    const param = document.getElementById("paramSelector").value;
    const ctx = document.getElementById("evolutionChart").getContext("2d");
    if (chartInstance) chartInstance.destroy();
    if (!patientName || !param) return;

    const dataPoints = labData[patientName]
        .filter(s => s.parametros[param] !== undefined)
        .map(s => ({ x: s.fecha + " " + s.hora, y: s.parametros[param] }));

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dataPoints.map(d => d.x),
            datasets: [{
                label: param,
                data: dataPoints.map(d => d.y),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// =============================
// 6. INIT (Versión UNIFICADA)
// =============================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar API Key oculta
    const savedKey = localStorage.getItem("my_openai_key_v1");
    if (savedKey) {
        const el = document.getElementById("apiKey");
        if(el) el.value = savedKey;
    }

    initRealTimeListener();

    document.getElementById("btnProcesarIA")?.addEventListener("click", processAndUpload);
    document.getElementById("patientSelector")?.addEventListener("change", loadPatientData);
    document.getElementById("paramSelector")?.addEventListener("change", updateGraph);
    document.getElementById("btnLimpiarEntrada")?.addEventListener("click", () => document.getElementById("labInput").value = "");
    
    setupPdf();
});

// Función PDF (Versión Moderna v3.11)
function setupPdf() {
    const input = document.getElementById("pdfInput");
    if(!input) return;

    input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if(!file) return;

        const textArea = document.getElementById("labInput");
        textArea.value = "⏳ Iniciando lectura del PDF... por favor espera.";

        // Intentamos obtener la librería
        const pdfjsLib = window.pdfjsLib || window["pdfjs-dist/build/pdf"];

        if (!pdfjsLib) {
            textArea.value = "Error crítico: La librería PDF no se cargó.";
            return alert("Error: No se pudo cargar el lector de PDF.");
        }

        // Worker Moderno v3.11
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        try {
            const buffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument(buffer);
            
            const pdf = await loadingTask.promise;
            let fullText = "";
            
            // Leemos página por página
            for(let i=1; i<=pdf.numPages; i++) {
                textArea.value = `⏳ Leyendo página ${i} de ${pdf.numPages}...`; 
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                fullText += `--- PÁGINA ${i} ---\n${pageText}\n\n`;
            }

            textArea.value = fullText;
            console.log("PDF leído correctamente.");

        } catch (error) {
            console.error("Error leyendo PDF:", error);
            textArea.value = "Error al leer el PDF:\n" + error.message;
            alert("Error leyendo el archivo. Asegúrate que no sea una imagen escaneada.");
        }
    });
}
