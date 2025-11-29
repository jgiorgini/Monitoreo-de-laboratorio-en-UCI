// Monitor de Laboratorios UCI - V10c (MEJORADO)
// =============================================
// Lógica principal con Validación de Rangos y Procesamiento Lineal

// =============================
// 1. CONFIGURACIÓN DE PARÁMETROS
// =============================

/* MEJORA: Se agregaron 'min' y 'max' a cada parámetro.
   Esto actúa como un "Sanity Check". Si el OCR lee el año "2024" 
   pero estamos buscando Potasio (que va de 2 a 8), el sistema
   sabrá que 2024 es un error y lo ignorará.
*/

const PARAMETERS = {
    // Hematología
    "Hemoglobina": { synonyms: /(HGB|HEMOGLOBINA|HB\b|HEMOG)/i, unit: "g/dL", hclab: "Hb", min: 2, max: 25 },
    "Hematocrito": { synonyms: /(HCT|HEMATOCRITO|HTO)/i, unit: "%", hclab: "Hto", min: 10, max: 70 },
    "Plaquetas": { synonyms: /(PLAQUETAS|PLT\b)/i, unit: "mm3", hclab: "Plq", min: 1000, max: 1000000 },
    "Leucocitos": { synonyms: /(LEUCOCITOS|WBC|GLOBULOS\s*BLANCOS)/i, unit: "mm3", hclab: "WBC", min: 100, max: 100000 },

    // Iones / electrolitos
    "Na": { synonyms: /\b(NA|SODIO|NATREMIA)\b/i, unit: "mEq/L", hclab: "Na", min: 100, max: 200 },
    "K": { synonyms: /\b(K|POTASIO|KALEMIA)\b/i, unit: "mEq/L", hclab: "K", min: 1, max: 10 },
    "Cl": { synonyms: /\b(CL|CLORO|CLOREMIA)\b/i, unit: "mEq/L", hclab: "Cl", min: 60, max: 150 },
    "Mg": { synonyms: /\b(MG|MAGNESIO)\b/i, unit: "mg/dL", hclab: "Mg", min: 0.5, max: 10 },
    "Ca_Total": { synonyms: /(CA\s*TOTAL|CALCIO\s*TOTAL)/i, unit: "mg/dL", hclab: "CaT", min: 2, max: 20 },
    "Ca_Ionizado": { synonyms: /(CA\s*IONIZADO|CALCIO\s*IONIZADO)/i, unit: "mmol/L", hclab: "CaI", min: 0.5, max: 5 },

    // Metabolismo / Renal
    "Glucosa": { synonyms: /(GLUCOSA|GLU|GLICEMIA|GLC)/i, unit: "mg/dL", hclab: "Glu", min: 10, max: 1500 },
    "Urea": { synonyms: /(UREA|UREICO|BUN)/i, unit: "mg/dL", hclab: "Urea", min: 5, max: 400 },
    "Creatinina": { synonyms: /(CREATININA|CR\s?\b|CREA\b)/i, unit: "mg/dL", hclab: "Cr", min: 0.1, max: 20 },
    "Acido_Urico": { synonyms: /(ACIDO\s*URICO|ÁCIDO\s*ÚRICO)/i, unit: "mg/dL", hclab: "AU", min: 1, max: 20 },
    "Osmolalidad": { synonyms: /(OSMOLALIDAD|OSMOL)/i, unit: "mOsm/Kg", hclab: "Osm", min: 200, max: 400 },

    // Hepatograma
    "BT": { synonyms: /(BT\b|BILIRRUBINA\s*TOTAL)/i, unit: "mg/dL", hclab: "BT", min: 0.1, max: 40 },
    "BD": { synonyms: /(BD\b|BILIRRUBINA\s*DIRECTA)/i, unit: "mg/dL", hclab: "BD", min: 0, max: 30 },
    "AST_TGO": { synonyms: /(AST\b|TGO\b|ASPARTATO\s+AMINOTRANSFERASA|ASAT-GOT)/i, unit: "U/L", hclab: "AST", min: 5, max: 5000 },
    "ALT_TGP": { synonyms: /(ALT\b|TGP\b|ALANINA\s+AMINOTRANSFERASA|ALAT-GPT|GPT\b)/i, unit: "U/L", hclab: "ALT", min: 5, max: 5000 },
    "Fosfatasa_Alcalina": { synonyms: /(FOSFATASA\s*ALCALINA|FAL\b)/i, unit: "U/L", hclab: "FA", min: 20, max: 2000 },
    "GGT": { synonyms: /(GGT\b|GAMMA\s*GLUTAMIL|GAMMAGT)/i, unit: "U/L", hclab: "GGT", min: 5, max: 1500 },
    "Albúmina": { synonyms: /(ALBÚMINA|ALBUMINA|ALBUMIN\b)/i, unit: "g/dL", hclab: "Alb", min: 1, max: 6 },
    "Proteínas_Totales": { synonyms: /(PROTE[IÍ]NAS?\s*TOTAL(ES)?|PROT\s*TOTAL)/i, unit: "g/dL", hclab: "Prot", min: 3, max: 10 },

    // Perfil lipídico
    "Colesterol_Total": { synonyms: /(COLESTEROL\s*TOTAL)/i, unit: "mg/dL", hclab: "CT", min: 50, max: 500 },
    "LDL": { synonyms: /\b(LDL|C\s*LDL)\b/i, unit: "mg/dL", hclab: "LDL", min: 10, max: 400 },
    "HDL": { synonyms: /\b(HDL|C\s*HDL)\b/i, unit: "mg/dL", hclab: "HDL", min: 5, max: 150 },
    "Triglicéridos": { synonyms: /(TRIGLIC[EÉ]RIDOS|TGL\b|TG\b)/i, unit: "mg/dL", hclab: "TGL", min: 20, max: 2000 },

    // Inflamación / Cardíacos
    "PCR": { synonyms: /\b(PCR|PROTE[IÍ]NA\s*C\s*REACTIVA)\b/i, unit: "mg/L", hclab: "PCR", min: 0, max: 500 },
    "Procalcitonina": { synonyms: /(PROCALCITONINA|PCT\b)/i, unit: "ng/ml", hclab: "PCT", min: 0, max: 200 },
    "VSG": { synonyms: /(VSG|VELOCIDAD\s*DE\s*SEDIMENTACI[ÓO]N)/i, unit: "mm/h", hclab: "VSG", min: 0, max: 150 },
    "Ferritina": { synonyms: /FERRITINA/i, unit: "ng/ml", hclab: "Ferr", min: 5, max: 5000 },
    "CPK": { synonyms: /(CK\b|CPK\b|CREATIN(KINASA|QUINASA))/i, unit: "U/L", hclab: "CPK", min: 10, max: 20000 },
    "Troponina": { synonyms: /(TROPONINA\s*[TI]?)/i, unit: "ng/ml", hclab: "Trop", min: 0, max: 50000 },
    "NT_proBNP": { synonyms: /(NT-?PROBNP|NT\s*PRO\s*BNP|BNP\b)/i, unit: "pg/ml", hclab: "BNP", min: 10, max: 35000 },

    // Coagulación
    "TP": { synonyms: /\b(TP|TIEMPO\s*DE\s*PROTROMBINA)\b/i, unit: "%", hclab: "TP", min: 10, max: 150 },
    "INR": { synonyms: /\bINR\b/i, unit: "", hclab: "INR", min: 0.5, max: 10 },
    "TTPA": { synonyms: /(TTPA|TTP\b)/i, unit: "s", hclab: "TTPA", min: 15, max: 200 },
    "Fibrinógeno": { synonyms: /(FIBRIN[ÓO]GENO)/i, unit: "mg/dL", hclab: "Fib", min: 50, max: 1000 },

    // Otros
    "Lactato": { synonyms: /(LACTATO|ÁCIDO\s*L[ÁA]CTICO)/i, unit: "mmol/L", hclab: "Lact", min: 0.1, max: 30 }
};

// =============================
// 2. ALMACENAMIENTO
// =============================

let labData = {}; // { paciente: [ muestras ] }
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
// 3. HELPERS DE TEXTO / NÚMEROS
// =============================

// Normaliza el texto pero preservando los saltos de línea importantes
function normalizeText(raw) {
    if (!raw) return "";
    let t = raw.replace(/\r/g, "\n");
    // Unificar separadores decimales: 3,9 -> 3.9 (pero cuidado de no romper fechas 20,10,23)
    // Usaremos un regex conservador para números flotantes
    return t;
}

function cleanNumberString(str) {
    // Convierte "1.234,50" -> 1234.50
    // Convierte "3,5" -> 3.5
    // Convierte "123" -> 123
    if (!str) return null;
    let clean = str.trim();
    
    // Si tiene un solo punto y ninguna coma: 10.5 -> ok
    // Si tiene una sola coma y ningun punto: 10,5 -> 10.5
    // Si tiene puntos y coma: 1.000,50 -> 1000.50
    
    // Quitar puntos de miles si existen seguidos de coma: 1.200,50
    if (clean.includes(".") && clean.includes(",")) {
        clean = clean.replace(/\./g, "").replace(",", ".");
    } else if (clean.includes(",")) {
        clean = clean.replace(",", ".");
    }
    
    const val = parseFloat(clean);
    return isNaN(val) ? null : val;
}

// =============================
// 4. PARSING DE VALORES (LOGICA NUEVA)
// =============================

function extractParameters(text) {
    const result = {};
    const lines = text.split('\n'); // Procesamos línea por línea

    // Expresión regular para quitar fechas y horas de la línea para evitar confusiones
    // Ej: 12/05/2023 o 14:00
    const dateCleanerRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{1,2}:\d{2})/g;

    for (const [key, cfg] of Object.entries(PARAMETERS)) {
        
        // Buscamos en cada línea
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Verifica si el nombre del parámetro está en la línea
            if (cfg.synonyms.test(line)) {
                
                // IMPORTANTE: Limpiamos fechas y horas de esta línea para que no las detecte como valores
                // Creamos una copia de la línea sin las fechas
                let cleanLine = line.replace(dateCleanerRegex, " ");

                // Buscamos números en la parte de la línea que está DESPUÉS del nombre del parámetro
                const matchIndex = line.search(cfg.synonyms);
                const stringAfterName = cleanLine.substring(matchIndex); // Cortamos desde el nombre en adelante

                // Regex para capturar números candidatos (enteros o decimales)
                // Captura: 123 | 123.45 | 123,45
                const numberPattern = /(\d+([.,]\d+)?)/g;
                const matches = [...stringAfterName.matchAll(numberPattern)];

                // Iteramos sobre los números encontrados en la línea
                for (const m of matches) {
                    const candidateRaw = m[0];
                    const val = cleanNumberString(candidateRaw);

                    if (val !== null) {
                        // VALIDACIÓN DE RANGO (Sanity Check)
                        // Si encontramos "2023" (año) pero buscamos Potasio (max 10), esto lo descarta.
                        if (cfg.min !== undefined && val < cfg.min) continue;
                        if (cfg.max !== undefined && val > cfg.max) continue;

                        // Si pasó la validación, asumimos que es el valor correcto
                        // (Tomamos el primero válido que encontremos a la derecha del nombre)
                        result[key] = val;
                        break; // Dejamos de buscar para este parámetro
                    }
                }
            }
            // Si ya encontramos el valor, pasamos al siguiente parámetro
            if (result[key] !== undefined) break;
        }
    }

    return result;
}

// =============================
// 5. PARSING DE METADATOS
// =============================

function extractMetadata(text) {
    const meta = {
        paciente: null,
        protocolo: null,
        fecha: null,
        hora: "12:00:00"
    };

    // Paciente (Busca líneas que empiecen con Paciente/Nombre)
    let m = text.match(/(?:PACIENTE|NOMBRE)\s*[:\-]\s*([A-ZÁÉÍÓÚÑ\s\.]+)/i);
    if (m) {
        // Limpiamos palabras basura comunes que puedan quedar
        let rawName = m[1].replace(/EDAD|SEXO|FECHA|PROTOCOLO/i, "").trim();
        meta.paciente = rawName.replace(/\s{2,}/g, " ");
    }

    // Protocolo
    // Mejora: Busca patrones numéricos largos aislados o con etiqueta
    m = text.match(/(?:PROTOCOLO|ORDEN|ID)\s*N?[º°]?\s*[:#]?\s*([0-9\-]+)/i);
    if (m) {
        meta.protocolo = m[1].trim();
    } else {
        // Fallback: busca un número de 6 a 12 dígitos que NO sea una fecha
        // Esto es arriesgado, pero útil si el OCR pierde la palabra "Protocolo"
        const possibleProto = text.match(/\b\d{6,12}\b/);
        if(possibleProto) meta.protocolo = possibleProto[0];
    }

    // Fecha
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const allDates = [...text.matchAll(new RegExp(dateRegex, "g"))];
    
    // Lógica para elegir la fecha correcta:
    // Preferimos la fecha que esté cerca de palabras como "FECHA", "MUESTRA", "INGRESO"
    // Evitamos "NACIMIENTO"
    let chosenDate = null;
    
    // Buscar explícitamente fecha de muestra
    const fechaMuestraRegex = /(?:FECHA|TOMA|MUESTRA).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
    const dateMatch = text.match(fechaMuestraRegex);
    
    if (dateMatch) {
        chosenDate = dateMatch[1];
    } else if (allDates.length > 0) {
        // Si no hay etiqueta explícita, tomamos la primera fecha que NO esté cerca de "NACIMIENTO"
        for (const d of allDates) {
            const context = text.substring(Math.max(0, d.index - 20), d.index);
            if (!/NAC|NACIM/i.test(context)) {
                chosenDate = d[0];
                break;
            }
        }
    }

    if (chosenDate) {
        const parts = chosenDate.split(/[\/\-]/);
        if (parts.length === 3) {
            let d = parts[0].padStart(2, "0");
            let mo = parts[1].padStart(2, "0");
            let y = parts[2].length === 2 ? "20" + parts[2] : parts[2];
            meta.fecha = `${y}-${mo}-${d}`;
        }
    } else {
        // Si todo falla, fecha de hoy
        meta.fecha = new Date().toISOString().split('T')[0];
    }
    
    // Hora
    const timeMatch = text.match(/(\d{1,2}:\d{2})/);
    if(timeMatch) {
        meta.hora = timeMatch[1] + ":00";
    }

    return meta;
}

// =============================
// 6. PROCESAMIENTO DE ENTRADA
// =============================

function processInput(rawText) {
    if (!rawText || !rawText.trim()) {
        alert("Pegue el texto del laboratorio o cargue un PDF.");
        return;
    }

    const text = normalizeText(rawText);
    const metadata = extractMetadata(text);

    if (!metadata.paciente) {
        // Intento de fallback: preguntar al usuario si no se detecta
        const manualName = prompt("No se detectó el nombre del paciente automáticamente. Ingréselo manualmente (o cancele para abortar):");
        if(manualName) {
            metadata.paciente = manualName.toUpperCase();
        } else {
            return;
        }
    }

    const parametros = extractParameters(text);
    const detected = Object.keys(parametros).length;

    if (detected === 0) {
        alert("No se detectaron parámetros válidos. Revise que el texto sea legible o intente copiar y pegar manualmente.");
        return;
    }

    const newSample = {
        ...metadata,
        parametros,
        timestamp: metadata.fecha
            ? new Date(`${metadata.fecha}T${metadata.hora}`).getTime()
            : Date.now()
    };

    const patientName = metadata.paciente;

    if (!labData[patientName]) labData[patientName] = [];

    // DUPLICADOS: Verificación más robusta
    // 1. Por Protocolo exacto (si existe protocolo)
    let isDuplicated = false;
    if (newSample.protocolo) {
        isDuplicated = labData[patientName].some(s => s.protocolo === newSample.protocolo);
    } 
    // 2. Si no hay protocolo, verificamos por Fecha exacta (misma fecha y cant de parametros similar)
    if (!newSample.protocolo && !isDuplicated) {
        isDuplicated = labData[patientName].some(s => s.fecha === newSample.fecha && Math.abs(s.timestamp - newSample.timestamp) < 3600000); // Mismo día/hora aprox
    }

    if (isDuplicated) {
        alert(`Ya existe una muestra cargada con este protocolo (${newSample.protocolo || 'N/A'}) o fecha para este paciente.`);
        return;
    }

    labData[patientName].push(newSample);
    // Ordenar por fecha descendente o ascendente
    labData[patientName].sort((a, b) => a.timestamp - b.timestamp);

    saveData();
    loadPatientSelector(patientName);

    alert(
        `Muestra guardada para ${patientName}.\nFecha: ${newSample.fecha}\nParámetros detectados: ${detected}.`
    );

    const ta = document.getElementById("labInput");
    if (ta) ta.value = "";
}

// =============================
// 7. UI: SELECTORES Y TABLAS (Sin Cambios Mayores)
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
    } else {
        clearTable();
    }
}

function clearTable() {
    const tbody = document.querySelector("#uciTable tbody");
    const thead = document.querySelector("#uciTable thead");
    if (thead) thead.innerHTML = "";
    if (tbody) {
        tbody.innerHTML = '<tr><td class="text-center py-4 text-gray-500" colspan="10">Seleccione un paciente.</td></tr>';
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
        clearTable();
        return;
    }

    const samples = labData[patientName];

    // Recopilar todos los parámetros posibles para armar las columnas
    const allParams = new Set();
    samples.forEach(sample => Object.keys(sample.parametros).forEach(p => allParams.add(p)));
    const sortedParams = Array.from(allParams).sort();

    // Cabecera
    let headHTML = `
        <tr>
            <th class="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase bg-blue-100 sticky left-0 z-10">Fecha/Hora</th>
            <th class="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase bg-blue-100">Protocolo</th>
    `;
    sortedParams.forEach(p => {
        const unit = PARAMETERS[p]?.unit || "";
        headHTML += `<th class="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase whitespace-nowrap">${p.replace(/_/g," ")} <span class="text-gray-500 text-[10px]">${unit}</span></th>`;
    });
    headHTML += "</tr>";
    thead.innerHTML = headHTML;

    // Cuerpo
    let bodyHTML = "";
    samples.forEach(sample => {
        const dt = sample.fecha
            ? new Date(sample.fecha + "T" + sample.hora)
            : new Date(sample.timestamp || Date.now());
        
        const displayDate = dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
        const displayTime = dt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

        bodyHTML += `<tr class="hover:bg-gray-50 border-b">
            <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium sticky left-0 bg-white">${displayDate} <span class="text-xs text-gray-500">${displayTime}</span></td>
            <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500">${sample.protocolo || "-"}</td>
        `;

        sortedParams.forEach(p => {
            const v = sample.parametros[p];
            // Resaltar valores anormales (simple visual check)
            let colorClass = "text-gray-700";
            if(v !== undefined && PARAMETERS[p]) {
                 if(PARAMETERS[p].min && v < PARAMETERS[p].min) colorClass = "text-blue-600 font-bold"; // bajo
                 if(PARAMETERS[p].max && v > PARAMETERS[p].max) colorClass = "text-red-600 font-bold"; // alto
            }
            
            bodyHTML += `<td class="px-3 py-2 text-sm text-center ${colorClass}">${v !== undefined ? v : ""}</td>`;
        });
        bodyHTML += "</tr>";
    });

    tbody.innerHTML = bodyHTML;
    loadParamSelector();
    updateGraph();
}

// =============================
// 8. GRÁFICO (Chart.js)
// =============================

function updateGraph() {
    const patientName = document.getElementById("patientSelector").value;
    const param = document.getElementById("paramSelector").value;
    const canvas = document.getElementById("evolutionChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    if (!patientName || !param || !labData[patientName]) return;

    const samples = labData[patientName];
    const dataPoints = [];
    
    samples.forEach(s => {
        if (s.parametros[param] !== undefined) {
             const dt = s.fecha ? new Date(s.fecha + "T" + s.hora) : new Date(s.timestamp);
             dataPoints.push({
                 x: dt, // Pasamos el objeto fecha directamente (requiere adaptador de tiempo o formateo manual labels)
                 y: s.parametros[param],
                 labelDate: dt.toLocaleDateString("es-AR", {day:'2-digit', month:'2-digit'}) + ' ' + dt.toLocaleTimeString("es-AR", {hour:'2-digit', minute:'2-digit'})
             });
        }
    });

    // Chart.js simple config (usando labels de texto para simplificar sin adaptadores de fecha)
    const labels = dataPoints.map(d => d.labelDate);
    const values = dataPoints.map(d => d.y);
    const unit = PARAMETERS[param]?.unit || "";

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: `${param.replace(/_/g, " ")} (${unit})`,
                data: values,
                borderColor: "rgb(37, 99, 235)", // Blue 600
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

// =============================
// 9. UTILIDADES Y DESCARGAS
// =============================

function generateHCLAB() {
    const patientName = document.getElementById("patientSelector").value;
    if (!patientName || !labData[patientName]) return;

    const samples = labData[patientName];
    const lastSample = samples[samples.length - 1]; // Última muestra

    const outputList = [];
    // Orden de exportación deseado
    const exportOrder = ["Na","K","Cl","Hemoglobina","Hematocrito","Glucosa","Urea","Creatinina","AST_TGO","ALT_TGP","BT","BD","Albúmina","CPK","PCR","Lactato"];
    
    exportOrder.forEach(key => {
        if(lastSample.parametros[key] !== undefined && PARAMETERS[key]) {
            outputList.push(`${PARAMETERS[key].hclab} ${lastSample.parametros[key]}`);
        }
    });

    const text = outputList.join(", ");
    const outDiv = document.getElementById("hclabOutput");
    outDiv.innerHTML = `
        <p class="font-bold text-gray-700 text-sm mb-1">Copia para HCLAB (última muestra):</p>
        <textarea id="hclabCopyArea" class="w-full text-sm p-2 border rounded bg-white" rows="2" readonly>${text}</textarea>
    `;
    outDiv.classList.remove("hidden");
}

function downloadCSV() {
    const patientName = document.getElementById("patientSelector").value;
    if (!patientName) return;
    
    const samples = labData[patientName];
    // Obtener todas las keys
    const allKeys = new Set();
    samples.forEach(s => Object.keys(s.parametros).forEach(k => allKeys.add(k)));
    const sortedKeys = Array.from(allKeys).sort();

    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "Fecha,Hora,Protocolo," + sortedKeys.join(",") + "\n";

    samples.forEach(s => {
        let row = `${s.fecha},${s.hora},${s.protocolo || ""}`;
        sortedKeys.forEach(k => {
            row += "," + (s.parametros[k] !== undefined ? s.parametros[k] : "");
        });
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LAB_${patientName}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetAllData() {
    if(confirm("¿Seguro que desea borrar TODOS los datos de TODOS los pacientes?")) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        location.reload();
    }
}

// =============================
// 10. INICIALIZACIÓN Y PDF
// =============================

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    loadPatientSelector();
    setupPdfHandling();

    // Event Listeners
    document.getElementById("btnProcesarTexto")?.addEventListener("click", () => {
        processInput(document.getElementById("labInput").value);
    });
    document.getElementById("btnLimpiarEntrada")?.addEventListener("click", () => {
        document.getElementById("labInput").value = "";
    });
    document.getElementById("patientSelector")?.addEventListener("change", loadPatientData);
    document.getElementById("paramSelector")?.addEventListener("change", updateGraph);
    document.getElementById("btnHCLAB")?.addEventListener("click", generateHCLAB);
    document.getElementById("btnCSV")?.addEventListener("click", downloadCSV);
    document.getElementById("btnReset")?.addEventListener("click", resetAllData);
});

function setupPdfHandling() {
    const pdfInput = document.getElementById("pdfInput");
    const loading = document.getElementById("loading");
    if (!pdfInput) return;

    // Configura PDF.js
    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    if (!pdfjsLib) { 
        console.error("PDF.js library not loaded"); 
        return; 
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js";

    pdfInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if(loading) loading.classList.remove("hidden");
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // MEJORA PDF: Tratamos de reconstruir líneas visuales básicas
                // Concatenamos items, pero agregamos \n si la posición Y cambia significativamente
                // Ojo: PDF.js devuelve items en orden a veces errático, pero usualmente de arriba a abajo.
                // Para simplificar, unimos con espacios, pero intentaremos detectar saltos grandes.
                
                let lastY = -1;
                let pageText = "";
                
                for(const item of textContent.items) {
                    // item.transform[5] es la posición Y
                    const currentY = item.transform[5];
                    if (lastY !== -1 && Math.abs(currentY - lastY) > 10) {
                        pageText += "\n"; // Salto de línea si cambia mucho la altura
                    }
                    pageText += item.str + " "; 
                    lastY = currentY;
                }
                fullText += pageText + "\n\n";
            }
            
            document.getElementById("labInput").value = fullText;
            processInput(fullText);

        } catch (err) {
            console.error(err);
            alert("Error leyendo el PDF: " + err.message);
        } finally {
            if(loading) loading.classList.add("hidden");
        }
    });
}
