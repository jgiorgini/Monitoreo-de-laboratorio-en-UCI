// Monitor de Laboratorios UCI – V10b
const STORAGE_KEY = 'uci_labs_registros_v10b';

function loadRegistros() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function saveRegistros(regs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(regs));
  } catch (e) {
    console.error(e);
  }
}

let registros = loadRegistros();

// ======== FECHA / HORA / PACIENTE / PROTOCOLO =================

function normalizarFecha(texto) {
  if (!texto) return '';
  const m = texto.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (!m) return '';
  let d = m[1].padStart(2, '0');
  let M = m[2].padStart(2, '0');
  let y = m[3];
  if (y.length === 2) {
    y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
  }
  return `${y}-${M}-${d}`;
}

function extraerFechaHora(texto) {
  let m = texto.match(/Toma de Muestra:?\s*([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})(?:\s+([0-9]{1,2}:[0-9]{2}))?/i);
  if (!m) {
    m = texto.match(/Toma de muestra:?\s*([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})(?:\s+([0-9]{1,2}:[0-9]{2}))?/i);
  }
  if (!m) {
    m = texto.match(/Fecha de extracción:?\s*([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})(?:\s+([0-9]{1,2}:[0-9]{2}))?/i);
  }
  if (!m) {
    m = texto.match(/Fecha:?s*([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})(?:\s+([0-9]{1,2}:[0-9]{2}))?/i);
  }
  if (m) {
    const fechaOriginal = m[1].trim();
    const horaOriginal = (m[2] || '').trim();
    const fechaISO = normalizarFecha(fechaOriginal);
    let horaISO = '';
    if (horaOriginal) {
      const hm = horaOriginal.match(/(\d{1,2}):(\d{2})/);
      if (hm) horaISO = hm[1].padStart(2, '0') + ':' + hm[2].padStart(2, '0');
    }
    return {
      fechaISO,
      horaISO,
      original: (fechaOriginal + (horaISO ? ' ' + horaISO : '')).trim()
    };
  }
  return { fechaISO: '', horaISO: '', original: '' };
}

function extraerPaciente(texto) {
  const m = texto.match(/Paciente:\s*([^\n\r]+)/i);
  if (!m) return '';
  return m[1].replace(/F\.\s*Nac:.+$/i, '').trim();
}

function extraerProtocolo(texto) {
  const m = texto.match(/Protocolo\s*N[ºo]?:?\s*([^\n\r]+)/i);
  if (!m) return '';
  let proto = m[1].trim();
  const token = proto.match(/[A-Z0-9\-\/.]+/i);
  if (token) proto = token[0];
  return proto;
}

function limpiarNumero(str) {
  if (!str) return null;
  str = String(str).trim();
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    str = str.replace(',', '.');
  }
  const v = parseFloat(str);
  return isNaN(v) ? null : v;
}

// ================= PARSER DETALLADO =====================

function parseParametrosDetallado(texto) {
  const params = {};
  const T = texto.replace(/\s+/g, ' ');

  const defs = [
    // básicos
    ['Hemoglobina', /(HEMOGLOBINA(?! GLICOSILADA)[^0-9]{0,40})([\d.,]+)/i],
    ['Hematocrito', /(HEMATOCRITO[^0-9]{0,40})([\d.,]+)/i],
    ['Glucosa', /(GLUCOSA EN SANGRE|GLUCEMIA)[^0-9]{0,40}([\d.,]+)/i],
    ['HbA1c', /(HEMOGLOBINA GLICOSILADA|HBA1C)[^0-9]{0,40}([\d.,]+)/i],
    ['Urea', /(UREA EN SANGRE|UREMIA)[^0-9]{0,40}([\d.,]+)/i],
    ['Creatinina', /(CREATININA EN SANGRE(?!.*ORINA)|CREATININA\b(?!.*ORINA))[^0-9]{0,40}([\d.,]+)/i],
    ['Ácido úrico', /(ACIDO URICO EN SANGRE|URICEMIA)[^0-9]{0,40}([\d.,]+)/i],
    ['Na', /(SODIO\b)[^0-9]{0,40}([\d.,]+)/i],
    ['K', /(POTASIO\b)[^0-9]{0,40}([\d.,]+)/i],
    ['Cl', /(CLORO\b)[^0-9]{0,40}([\d.,]+)/i],
    ['Magnesio', /(MAGNESIO EN SANGRE)[^0-9]{0,40}([\d.,]+)/i],
    ['Calcio', /(CALCEMIA TOTAL|CALCIO EN SANGRE)[^0-9]{0,40}([\d.,]+)/i],

    // Lípidos
    ['Colesterol total', /(COLESTEROL TOTAL(?!.*NO)[^0-9]{0,40})([\d.,]+)/i],
    ['Colesterol HDL', /(COLESTEROL HDL(?!.*NO)[^0-9]{0,40})([\d.,]+)/i],
    ['Colesterol LDL', /(COLESTEROL LDL[^0-9]{0,40})([\d.,]+)/i],
    ['Colesterol no HDL', /(COLESTEROL NO HDL[^0-9]{0,40})([\d.,]+)/i],
    ['Triglicéridos', /(TRIGLICERIDOS?[^0-9]{0,40})([\d.,]+)/i],

    // Hepático
    ['Bilirrubina directa', /(BILIRRUBINA DIRECTA[^0-9]{0,40})([\d.,]+)/i],
    ['Bilirrubina total', /(BILIRRUBINA TOTAL[^0-9]{0,40})([\d.,]+)/i],
    ['AST/TGO', /(ASPARTATO AMINOTRANSFERASA|ASAT.?GOT|TGO\b)[^0-9]{0,40}([\d.,]+)/i],
    ['ALT/TGP', /(ALANINA AMINOTRANSFERASA|ALAT.?GPT|TGP\b)[^0-9]{0,40}([\d.,]+)/i],
    ['Fosfatasa alcalina', /(FOSFATASA ALCALINA[^0-9]{0,40})([\d.,]+)/i],
    ['GGT', /(GGT\b|GAMMA ?GLUTAMIL ?TRANSFERASA)[^0-9]{0,40}([\d.,]+)/i],
    ['Proteínas totales', /(PROTEINAS TOTALES[^0-9]{0,40})([\d.,]+)/i],
    ['Albúmina', /(ALBUMINA\b(?!.*ORINA)[^0-9]{0,40})([\d.,]+)/i],

    // Enzimas / músculo / corazón
    ['CPK', /(CREATINQUINASA \(CPK\)|CPK\b)[^0-9]{0,40}([\d.,]+)/i],
    ['CPK-MB', /(CPK.?MB|CREATINQUINASA MB)[^0-9]{0,40}([\d.,]+)/i],
    ['LDH', /(LACTATO DESHIDROGENASA|LDH\b)[^0-9]{0,40}([\d.,]+)/i],
    ['Troponina', /(TROPONINA(?: ULTRASENSIBLE)?)[^0-9]{0,40}([\d.,]+)/i],
    ['NT-proBNP', /(NT.?PRO.?BNP)[^0-9]{0,40}([\d.,]+)/i],

    // Inflamación / sepsis
    ['PCR', /(PROTEINA C REACTIVA|PCR\b)[^0-9]{0,40}([\d.,]+)/i],
    ['Procalcitonina', /(PROCALCITONINA)[^0-9]{0,40}([\d.,]+)/i],
    ['Ferritina', /(FERRITINA\b)[^0-9]{0,40}([\d.,]+)/i],

    // Coagulación
    ['INR', /(INR\b)[^0-9]{0,40}([\d.,]+)/i],
    ['TP', /(TIEMPO DE PROTROMBINA|TP\b)[^0-9]{0,40}([\d.,]+)/i],
    ['TTPa', /(TTPA\b|TIEMPO DE TROMBOPLASTINA PARCIAL ACTIVADO)[^0-9]{0,40}([\d.,]+)/i],
    ['Fibrinógeno', /(FIBRINOGENO\b)[^0-9]{0,40}([\d.,]+)/i],
    ['D-dímero', /(D.?D[ÍI]MERO)[^0-9]{0,40}([\d.,]+)/i],

    // Metabólico extra
    ['Fosfato', /(FOSFATO\b|FOSFORO INORGANICO)[^0-9]{0,40}([\d.,]+)/i],
    ['Lactato', /(LACTATO(?! DESHIDROGENASA)[^0-9]{0,40})([\d.,]+)/i],

    // Enzimas digestivas
    ['Amilasa', /(AMILASA\b)[^0-9]{0,40}([\d.,]+)/i],
    ['Lipasa', /(LIPASA\b)[^0-9]{0,40}([\d.,]+)/i],

    // Tiroideo
    ['TSH', /(TIROTROFINA \(TSH\)|TSH\b)[^0-9]{0,40}([\d.,]+)/i]
  ];

  for (const [nombre, regex] of defs) {
    const m = T.match(regex);
    if (m && m[2]) {
      let val = limpiarNumero(m[2]);
      if (val !== null) {
        if (nombre === 'HbA1c' && (val < 3 || val > 20)) continue;
        params[nombre] = val;
      }
    }
  }
  return params;
}

// ================= PARSER SIMPLE =====================

function parseParametrosSimple(texto) {
  const params = {};
  const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  const listaAceptada = [
    'colesterol','hdl','ldl','no hdl','trig','gluc','glucosa','hba1c','glicosil',
    'sodio','na','potasio','k','cloro','cl','creatinina','urea','uremia','urico','úrico',
    'magnesio','calcio','hemoglobina','hematocrito','acido urico',
    'lactato','ldh','pcr','procalcitonina','inr','tp','ttpa','fibrinog','d-dim',
    'ferritina','troponina','ntprobnp','ggt','amilasa','lipasa'
  ];

  for (const linea of lineas) {
    const m = linea.match(/^(.+?)\s+(-?\d+[.,]?\d*)\b/);
    if (!m) continue;
    let nombre = m[1].trim();
    const valor = limpiarNumero(m[2]);
    if (valor === null) continue;

    const low = nombre.toLowerCase();
    const esValido = listaAceptada.some(p => low.includes(p));
    if (!esValido) continue;

    if (low.includes('colesterol total')) nombre = 'Colesterol total';
    else if (low.includes('hdl') && !low.includes('no hdl')) nombre = 'Colesterol HDL';
    else if (low.includes('ldl') && !low.includes('no hdl')) nombre = 'Colesterol LDL';
    else if (low.includes('no hdl')) nombre = 'Colesterol no HDL';
    else if (low.includes('trig')) nombre = 'Triglicéridos';
    else if (low.includes('hba1c') || low.includes('glicosil')) nombre = 'HbA1c';
    else if (low.includes('gluc')) nombre = 'Glucosa';
    else if (low.includes('sodio') || low === 'na') nombre = 'Na';
    else if (low.includes('potasio') || low === 'k') nombre = 'K';
    else if (low.includes('cloro') || low === 'cl') nombre = 'Cl';
    else if (low.includes('creatinina')) nombre = 'Creatinina';
    else if (low.includes('urea') || low.includes('uremia')) nombre = 'Urea';
    else if (low.includes('urico') || low.includes('úrico')) nombre = 'Ácido úrico';
    else if (low.includes('magnesio')) nombre = 'Magnesio';
    else if (low.includes('calcio')) nombre = 'Calcio';
    else if (low.includes('hemoglobina')) nombre = 'Hemoglobina';
    else if (low.includes('hematocrito')) nombre = 'Hematocrito';
    else if (low.includes('lactato')) nombre = 'Lactato';
    else if (low.includes('ldh')) nombre = 'LDH';
    else if (low.includes('pcr')) nombre = 'PCR';
    else if (low.includes('procalcitonina')) nombre = 'Procalcitonina';
    else if (low.includes('inr')) nombre = 'INR';
    else if (low.includes('fibrinog')) nombre = 'Fibrinógeno';
    else if (low.includes('d-dim')) nombre = 'D-dímero';
    else if (low.includes('ferritina')) nombre = 'Ferritina';
    else if (low.includes('troponina')) nombre = 'Troponina';
    else if (low.includes('ntprobnp')) nombre = 'NT-proBNP';
    else if (low.includes('ggt')) nombre = 'GGT';
    else if (low.includes('amilasa')) nombre = 'Amilasa';
    else if (low.includes('lipasa')) nombre = 'Lipasa';

    params[nombre] = valor;
  }
  return params;
}

function parseParametros(texto) {
  const det = parseParametrosDetallado(texto);
  const simp = parseParametrosSimple(texto);
  return Object.assign({}, simp, det);
}

// ================== PDF =====================

const pdfInput = document.getElementById('pdfInput');
const labText = document.getElementById('labText');
const parseStatus = document.getElementById('parseStatus');

pdfInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  parseStatus.textContent = 'Leyendo PDF...';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map(it => it.str);
      fullText += strings.join(' ') + '\n';
    }
    labText.value = fullText;
    parseStatus.textContent = 'PDF convertido a texto. Revisá y luego "Analizar laboratorio".';
  } catch (err) {
    console.error(err);
    parseStatus.textContent = 'Error al leer el PDF.';
  }
});

// ================== INGRESO / GUARDADO =====================

const btnParse = document.getElementById('btnParse');
const inputPaciente = document.getElementById('pacienteNombre');
const inputFecha = document.getElementById('fechaMuestra');
const ultimoResultadoDiv = document.getElementById('ultimoResultado');
const resumenPaciente = document.getElementById('resumenPaciente');
const tablaUltimoBody = document.querySelector('#tablaUltimo tbody');
const hclabOutput = document.getElementById('hclabOutput');
const btnHCLAB = document.getElementById('btnHCLAB');
const btnCopiarHCLAB = document.getElementById('btnCopiarHCLAB');

function registrosIguales(a, b) {
  if (a.protocolo && b.protocolo && a.protocolo === b.protocolo) return true;
  if (a.paciente !== b.paciente) return false;
  if ((a.fechaISO || '') !== (b.fechaISO || '')) return false;
  if ((a.horaISO || '') !== (b.horaISO || '')) return false;
  const ka = Object.keys(a.parametros).sort();
  const kb = Object.keys(b.parametros).sort();
  if (ka.length !== kb.length) return false;
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i]) return false;
    if (a.parametros[ka[i]] !== b.parametros[ka[i]]) return false;
  }
  return true;
}

btnParse.addEventListener('click', () => {
  const texto = labText.value.trim();
  if (!texto) {
    parseStatus.textContent = 'Pegá primero el laboratorio o cargá un PDF.';
    return;
  }
  parseStatus.textContent = 'Analizando...';

  const pacienteAut = extraerPaciente(texto);
  if (pacienteAut) {
    const actual = inputPaciente.value.trim();
    if (actual && actual !== pacienteAut.trim()) {
      const resp = confirm(
        `Se detectó el paciente "${pacienteAut}".\nActualmente está "${actual}".\n\n¿Reemplazar por el nuevo paciente?`
      );
      if (resp) inputPaciente.value = pacienteAut;
    } else {
      inputPaciente.value = pacienteAut;
    }
  }

  const fh = extraerFechaHora(texto);
  if (fh.fechaISO && !inputFecha.value) {
    inputFecha.value = fh.fechaISO;
  }

  const parametros = parseParametros(texto);
  const paciente = inputPaciente.value.trim() || 'Paciente sin nombre';
  const fechaISO = inputFecha.value || fh.fechaISO || '';
  const horaISO = fh.horaISO || '';
  const fechaTexto = fh.original || fechaISO || '(sin fecha detectable)';
  const protocolo = extraerProtocolo(texto);

  const nuevo = {
    id: Date.now(),
    paciente,
    fechaISO,
    horaISO,
    fechaTexto,
    protocolo,
    parametros,
    raw: texto
  };

  const duplicado = registros.find(r => registrosIguales(r, nuevo));
  if (duplicado) {
    parseStatus.textContent = 'Este laboratorio ya estaba cargado.';
    renderUltimo(duplicado);
    actualizarSelects();
    renderHistorial();
    renderGrafico();
    renderTablaUCI();
    return;
  }

  if (!fechaISO) {
    parseStatus.textContent = 'Analizado. No se detectó fecha clara; completala si querés.';
  } else if (!horaISO) {
    parseStatus.textContent = 'Laboratorio analizado. No se detectó hora de muestra.';
  } else {
    parseStatus.textContent = 'Laboratorio analizado y guardado.';
  }

  registros.push(nuevo);
  registros.sort((a, b) => {
    const fa = (a.fechaISO || '') + ' ' + (a.horaISO || '00:00') + ' ' + (a.protocolo || '');
    const fb = (b.fechaISO || '') + ' ' + (b.horaISO || '00:00') + ' ' + (b.protocolo || '');
    if (fa > fb) return 1;
    if (fa < fb) return -1;
    return 0;
  });
  saveRegistros(registros);

  renderUltimo(nuevo);
  actualizarSelects();
  renderHistorial();
  renderGrafico();
  renderTablaUCI();
});

function renderUltimo(reg) {
  ultimoResultadoDiv.style.display = 'block';
  const etiquetaFH = [reg.fechaISO || reg.fechaTexto, reg.horaISO].filter(Boolean).join(' ');
  const etiquetaProto = reg.protocolo ? ` – Protocolo: ${reg.protocolo}` : '';
  resumenPaciente.textContent = `${reg.paciente} – muestra: ${etiquetaFH}${etiquetaProto}`;
  tablaUltimoBody.innerHTML = '';
  const entries = Object.entries(reg.parametros);
  if (entries.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = 'No se detectaron parámetros conocidos.';
    tr.appendChild(td);
    tablaUltimoBody.appendChild(tr);
    return;
  }
  for (const [param, val] of entries) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    const td2 = document.createElement('td');
    td1.textContent = param;
    let vStr = val;
    if (typeof val === 'number') {
      if (Math.abs(val) < 10 && val !== Math.round(val)) vStr = val.toFixed(2);
      else if (Math.abs(val) < 100 && val !== Math.round(val)) vStr = val.toFixed(1);
    }
    td2.textContent = vStr;
    tr.appendChild(td1);
    tr.appendChild(td2);
    tablaUltimoBody.appendChild(tr);
  }
  hclabOutput.value = '';
}

// ================= HCLAB =====================

const HCLAB_ORDER = [
  'Hemoglobina','Hematocrito','Glucosa','HbA1c',
  'Urea','Creatinina','Na','K','Cl','Calcio','Magnesio',
  'Colesterol total','Colesterol LDL','Colesterol HDL',
  'Colesterol no HDL','Triglicéridos',
  'Ácido úrico',
  'Proteínas totales','Albúmina',
  'AST/TGO','ALT/TGP','Fosfatasa alcalina',
  'Bilirrubina total','Bilirrubina directa',
  'CPK','TSH'
];

const HCLAB_ABBR = {
  'Hemoglobina':'Hb',
  'Hematocrito':'Hto',
  'Glucosa':'Glu',
  'HbA1c':'HbA1c',
  'Urea':'Urea',
  'Creatinina':'Cr',
  'Na':'Na',
  'K':'K',
  'Cl':'Cl',
  'Calcio':'Ca',
  'Magnesio':'Mg',
  'Colesterol total':'CT',
  'Colesterol LDL':'LDL',
  'Colesterol HDL':'HDL',
  'Colesterol no HDL':'noHDL',
  'Triglicéridos':'TG',
  'Ácido úrico':'AU',
  'Proteínas totales':'ProtT',
  'Albúmina':'Alb',
  'AST/TGO':'AST',
  'ALT/TGP':'ALT',
  'Fosfatasa alcalina':'FA',
  'Bilirrubina total':'BT',
  'Bilirrubina directa':'BD',
  'CPK':'CPK',
  'TSH':'TSH'
};

function generarLineaHCLAB(reg) {
  const partes = [];
  for (const nombre of HCLAB_ORDER) {
    if (reg.parametros.hasOwnProperty(nombre)) {
      let v = reg.parametros[nombre];
      if (typeof v === 'number') {
        if (Math.abs(v) < 10 && v !== Math.round(v)) v = v.toFixed(2);
        else if (Math.abs(v) < 100 && v !== Math.round(v)) v = v.toFixed(1);
      }
      partes.push(`${HCLAB_ABBR[nombre] || nombre} ${v}`);
    }
  }
  return partes.join(', ');
}

btnHCLAB.addEventListener('click', () => {
  if (!registros.length) {
    hclabOutput.value = '';
    return;
  }
  const reg = registros[registros.length - 1];
  hclabOutput.value = generarLineaHCLAB(reg) || '(Sin parámetros reconocidos)';
});

btnCopiarHCLAB.addEventListener('click', () => {
  if (!hclabOutput.value) return;
  hclabOutput.select();
  document.execCommand('copy');
  btnCopiarHCLAB.textContent = 'Copiado';
  setTimeout(() => { btnCopiarHCLAB.textContent = 'Copiar'; }, 1200);
});

// ================= HISTORIAL / SELECTS =====================

const selectPaciente = document.getElementById('selectPaciente');
const selectParametro = document.getElementById('selectParametro');
const tablaHistorialBody = document.querySelector('#tablaHistorial tbody');
const resumenHistorial = document.getElementById('resumenHistorial');
const btnLimpiar = document.getElementById('btnLimpiar');
const tablaUCITHead = document.querySelector('#tablaUCI thead');
const tablaUCITBody = document.querySelector('#tablaUCI tbody');
const btnCSV = document.getElementById('btnCSV');

function getPacientesUnicos() {
  return Array.from(new Set(registros.map(r => r.paciente))).sort((a, b) => a.localeCompare(b));
}

function getParametrosDisponibles(pac) {
  const set = new Set();
  for (const r of registros) {
    if (!pac || r.paciente === pac) {
      Object.keys(r.parametros).forEach(k => set.add(k));
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function actualizarSelects() {
  const pacientes = getPacientesUnicos();
  const currentPac = selectPaciente.value;
  selectPaciente.innerHTML = '';
  if (!pacientes.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Sin datos';
    selectPaciente.appendChild(opt);
  } else {
    for (const p of pacientes) {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      selectPaciente.appendChild(opt);
    }
    if (currentPac && pacientes.includes(currentPac)) selectPaciente.value = currentPac;
    else selectPaciente.value = pacientes[0];
  }

  const pacAct = selectPaciente.value || '';
  const params = getParametrosDisponibles(pacAct);
  const currentParam = selectParametro.value;
  selectParametro.innerHTML = '';
  if (!params.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Sin parámetros';
    selectParametro.appendChild(opt);
  } else {
    for (const p of params) {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      selectParametro.appendChild(opt);
    }
    if (currentParam && params.includes(currentParam)) selectParametro.value = currentParam;
    else selectParametro.value = params[0];
  }
}

function renderHistorial() {
  const pac = selectPaciente.value;
  const param = selectParametro.value;
  tablaHistorialBody.innerHTML = '';
  if (!pac) {
    resumenHistorial.textContent = 'No hay registros aún.';
    return;
  }
  const filtrados = registros
    .filter(r => r.paciente === pac && (!param || r.parametros.hasOwnProperty(param)))
    .slice()
    .sort((a, b) => {
      const fa = (a.fechaISO || '') + ' ' + (a.horaISO || '00:00') + ' ' + (a.protocolo || '');
      const fb = (b.fechaISO || '') + ' ' + (b.horaISO || '00:00') + ' ' + (b.protocolo || '');
      if (fa > fb) return 1;
      if (fa < fb) return -1;
      return 0;
    });

  resumenHistorial.textContent = `${filtrados.length} registros para ${pac}${param ? ' – ' + param : ''}.`;

  for (const r of filtrados) {
    const valor = param ? r.parametros[param] : null;
    if (param && valor === undefined) continue;
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${r.fechaISO || ''}</td>` +
      `<td>${r.horaISO || ''}</td>` +
      `<td>${r.protocolo || ''}</td>` +
      `<td>${param}</td>` +
      `<td>${valor}</td>`;
    tablaHistorialBody.appendChild(tr);
  }
}

// ================= GRÁFICO =====================

let chart = null;
const ctx = document.getElementById('grafico').getContext('2d');

function renderGrafico() {
  const pac = selectPaciente.value;
  const param = selectParametro.value;
  if (chart) {
    chart.destroy();
    chart = null;
  }
  if (!pac || !param) return;
  const datos = registros
    .filter(r => r.paciente === pac && r.parametros.hasOwnProperty(param))
    .slice()
    .sort((a, b) => {
      const fa = (a.fechaISO || '') + ' ' + (a.horaISO || '00:00') + ' ' + (a.protocolo || '');
      const fb = (b.fechaISO || '') + ' ' + (b.horaISO || '00:00') + ' ' + (b.protocolo || '');
      if (fa > fb) return 1;
      if (fa < fb) return -1;
      return 0;
    })
    .map(r => ({
      label: [r.fechaISO || '', r.horaISO || '', r.protocolo || ''].filter(Boolean).join(' '),
      valor: r.parametros[param]
    }));
  if (!datos.length) return;

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: datos.map(d => d.label),
      datasets: [{
        label: `${param} – ${pac}`,
        data: datos.map(d => d.valor),
        fill: false,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Muestra (fecha / hora / protocolo)' }
        },
        y: {
          title: { display: true, text: param }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// ================= TABLA UCI =====================

function getRegistrosPacienteOrdenados(pac) {
  return registros
    .filter(r => r.paciente === pac)
    .slice()
    .sort((a, b) => {
      const fa = (a.fechaISO || '') + ' ' + (a.horaISO || '00:00') + ' ' + (a.protocolo || '');
      const fb = (b.fechaISO || '') + ' ' + (b.horaISO || '00:00') + ' ' + (b.protocolo || '');
      if (fa > fb) return 1;
      if (fa < fb) return -1;
      return 0;
    });
}

function renderTablaUCI() {
  const pac = selectPaciente.value;
  tablaUCITHead.innerHTML = '';
  tablaUCITBody.innerHTML = '';
  if (!pac) return;
  const regsPac = getRegistrosPacienteOrdenados(pac);
  const params = getParametrosDisponibles(pac);
  if (!regsPac.length || !params.length) return;

  const trHead = document.createElement('tr');
  let headHTML = '<th>Fecha</th><th>Hora</th><th>Protocolo</th>';
  for (const p of params) headHTML += `<th>${p}</th>`;
  trHead.innerHTML = headHTML;
  tablaUCITHead.appendChild(trHead);

  for (const r of regsPac) {
    const tr = document.createElement('tr');
    let rowHTML =
      `<td>${r.fechaISO || ''}</td>` +
      `<td>${r.horaISO || ''}</td>` +
      `<td>${r.protocolo || ''}</td>`;
    for (const p of params) {
      const val = r.parametros.hasOwnProperty(p) ? r.parametros[p] : '';
      rowHTML += `<td>${val}</td>`;
    }
    tr.innerHTML = rowHTML;
    tablaUCITBody.appendChild(tr);
  }
}

// ================= LIMPIAR / CSV =====================

btnLimpiar.addEventListener('click', () => {
  if (!confirm('Esto borrará todos los registros guardados en este navegador. ¿Continuar?')) return;
  registros = [];
  saveRegistros(registros);
  actualizarSelects();
  renderHistorial();
  renderGrafico();
  renderTablaUCI();
  ultimoResultadoDiv.style.display = 'none';
  hclabOutput.value = '';
});

btnCSV.addEventListener('click', () => {
  const pac = selectPaciente.value;
  if (!pac) {
    alert('Elegí primero un paciente.');
    return;
  }
  const regsPac = getRegistrosPacienteOrdenados(pac);
  const params = getParametrosDisponibles(pac);
  if (!regsPac.length || !params.length) {
    alert('No hay datos suficientes.');
    return;
  }
  const filas = [];
  filas.push(['Paciente', pac]);
  filas.push([]);
  filas.push(['Fecha', 'Hora', 'Protocolo', ...params]);
  for (const r of regsPac) {
    const row = [r.fechaISO || '', r.horaISO || '', r.protocolo || ''];
    for (const p of params) {
      row.push(r.parametros.hasOwnProperty(p) ? r.parametros[p] : '');
    }
    filas.push(row);
  }
  const csv = filas
    .map(r => r.map(v => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }).join(','))
    .join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'labs_' + pac.replace(/\s+/g, '_') + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

selectPaciente.addEventListener('change', () => {
  renderHistorial();
  renderGrafico();
  renderTablaUCI();
});

selectParametro.addEventListener('change', () => {
  renderHistorial();
  renderGrafico();
});

// ================= INIT =====================

(function init() {
  actualizarSelects();
  renderHistorial();
  renderGrafico();
  renderTablaUCI();
  if (registros.length) {
    renderUltimo(registros[registros.length - 1]);
  }
})();