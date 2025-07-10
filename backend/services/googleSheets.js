import { google } from 'googleapis';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });


// Alumnos

async function getNextId(range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range,
  });
  const existingIds = (res.data.values ?? [])
    .flat()
    .map(id => parseInt(id, 10))
    .filter(n => !isNaN(n));
  return (existingIds.length ? Math.max(...existingIds) : 0) + 1;
}

export async function getAlumnosFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!A1:N',
  });

  const [headers, ...rows] = res.data.values;

  const alumnos = rows.map((row) => {
    const alumno = {};
    headers.forEach((header, i) => {
      alumno[header] = row[i] || '';
    });
    return alumno;
  });
  alumnos.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
  return alumnos;
}

export async function appendAlumnoToSheet(alumno) {
  const dniRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!B2:B',
  });

  const existingDNIs = dniRes.data.values?.flat() || [];

  if (existingDNIs.includes(alumno.DNI)) {
    throw new Error('El DNI ya está registrado');
  }

  const nuevoID = await getNextId('Alumnos!A2:A');

  const values = [[
    String(nuevoID),
    alumno.DNI || '',
    alumno['Nombre'] || '',
    alumno.Email || '',
    alumno.Telefono || '',
    alumno.Sexo || '',
    alumno['Fecha_nacimiento'] || '',
    alumno.Plan || '',
    alumno['Clases_pagadas'] || '',
    alumno['Clases_realizadas'] || '0',
    alumno['Fecha_inicio'] || '',
    alumno['Fecha_vencimiento'] || '',
    alumno['Profesor_asignado'] || '',
    alumno['GymCoins'] || '0'
  ]];

  sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!A1:N1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

export async function updateAlumnoByDNI(dni, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!A1:N',
  });

  const [headers, ...rows] = res.data.values;
  const index = rows.findIndex((row) => row[1] === dni);

  if (index === -1) return false;

  // Actualizar esa fila
  const nuevaFila = headers.map((key, i) =>
    nuevosDatos.hasOwnProperty(key) ? nuevosDatos[key] : rows[index][i]
  );

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Alumnos!A${index + 2}:N${index + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });


  return true;
}

export async function deleteAlumnoByDNI(dni) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Alumnos!A1:N',
  });

  const [headers, ...rows] = res.data.values;

  const rowIndex = rows.findIndex((row) => row[1] === dni);

  if (rowIndex === -1) return false;

  const sheetRowIndex = rowIndex + 2;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: sheetRowIndex - 1,
              endIndex: sheetRowIndex,
            },
          },
        },
      ],
    },
  });

  return true;
}

export async function reiniciarPuntosAlumnos() {
  try {
    console.log('🔄 Iniciando reinicio de puntos...');

    // Leer todas las filas de la columna N a partir de la fila 2
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Alumnos!N2:N`,
    });

    const filas = res.data.values || [];
    const totalFilas = filas.length;

    console.log(`Filas leídas para puntos: ${totalFilas}`);

    if (totalFilas === 0) {
      console.log('No hay datos en la columna N para actualizar.');
      return;
    }

    // Crear un array con 0 para cada fila leída
    const nuevosPuntos = filas.map(() => [0]);
    console.log('Valores a actualizar:', nuevosPuntos);

    const filaInicio = 2;
    const filaFin = filaInicio + totalFilas - 1;

    // Actualizar todas las filas con 0
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Alumnos!N${filaInicio}:N${filaFin}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: nuevosPuntos }
    });

    console.log('Update response:', updateResponse.status, updateResponse.statusText);
    console.log('✅ Puntos reiniciados para todos los alumnos');
  } catch (error) {
    console.error('❌ Error al reiniciar puntos:', error);
    throw error;
  }
}


// Pagos

export async function getPagosFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A1:L',
  });

  const [headers, ...rows] = res.data.values;

  const pagos = rows.map((row) => {
    const pago = {};
    headers.forEach((header, i) => {
      pago[header] = row[i] || '';
    });
    return pago;
  });

  return pagos;
}

export async function appendPagoToSheet(pago) {
  const nuevoID = await getNextId('Pagos!A2:A');

  const horaActual = new Date().toLocaleTimeString("es-AR", {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  pago.Hora = horaActual;

  const values = [[
    String(nuevoID),
    pago['Socio DNI'] || '',
    pago.Nombre || '',
    pago.Monto || '',
    pago['Método de Pago'] || '',
    pago['Fecha de Pago'] || '',
    pago['Fecha de Vencimiento'] || '',
    pago.Responsable || '',
    pago.Turno || '',
    pago.Hora || '',
    pago['Tipo'] || '',
    pago['Ultimo_Plan'] || ''
  ]];

  sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A1:L1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

export async function updatePagoByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A1:H',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((header, i) => nuevosDatos[header] || rows[rowIndex][i]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Pagos!A${rowIndex + 2}:H${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function deletePagoByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A1:H',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 1211942960,
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }
      ]
    }
  });

  return true;
}

// Roles 

export async function getRolesFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Roles!A1:C', // Asegurate que el nombre de la hoja sea correcto
  });

  const [headers, ...rows] = res.data.values;

  const roles = rows.map((row) => {
    const user = {};
    headers.forEach((header, i) => {
      user[header] = row[i] || '';
    });
    return user;
  });

  return roles;
}

// Asistencias 

export async function appendAsistenciaToSheet(asistencia) {
  const nuevoID = await getNextId('Asistencias!A2:A');

  const values = [[
    String(nuevoID),
    asistencia.Fecha,
    asistencia.Hora,
    asistencia.DNI,
    asistencia.Nombre,
    asistencia.Plan,
    asistencia.Responsable
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Asistencias!A1:G1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

export async function getAsistenciasFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Asistencias!A1:G', // Ajustalo según tu hoja real
  });

  const [headers, ...rows] = res.data.values;

  const asistencias = rows.map((row) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] || '';
    });
    return obj;
  });

  return asistencias;
}

// Clases diarias 

export async function appendClaseDiariaToSheet(clase) {
  const nuevoID = await getNextId('ClasesDiarias!A2:A');

  const values = [[
    String(nuevoID),
    clase.Fecha,
    clase.Tipo,
    String(clase.Cantidad),
    clase.Responsable
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

export async function updateClaseDiariaByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((header, i) => nuevosDatos[header] || rows[rowIndex][i]);

  sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `ClasesDiarias!A${rowIndex + 2}:E${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function deleteClaseDiariaByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 801252478,
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }
      ]
    }
  });

  return true;
}

export async function getClasesDiariasFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E',
  });

  const [headers, ...rows] = res.data.values;

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
}

// Caja

export async function appendCajaToSheet(caja) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A2:A',
  });

  const nuevoID = await getNextId('Caja!A2:A');

  const values = [[
    String(nuevoID),
    caja.Fecha,
    caja.Turno,
    caja['Hora Apertura'],
    caja['Saldo Inicial'],
    caja['Total Efectivo'],
    caja['Total Tarjeta'],
    caja['Total Final'],
    caja.Responsable,
    caja['Hora Cierre']
  ]];

  sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A1:J1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });

  return { id: values[0][0], message: 'Caja añadida correctamente' };
}

export async function updateCajaByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A1:J',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  if (nuevosDatos['Saldo Inicial'] !== undefined) {
    rows[rowIndex][headers.indexOf('Saldo Inicial')] = nuevosDatos['Saldo Inicial']
  }

  if (
    nuevosDatos['Total Efectivo'] !== undefined &&
    nuevosDatos['Total Tarjeta'] !== undefined
  ) {
    const efectivo = parseFloat(nuevosDatos['Total Efectivo']) || 0
    const tarjeta = parseFloat(nuevosDatos['Total Tarjeta']) || 0

    const saldoInicialStr = rows[rowIndex][headers.indexOf('Saldo Inicial')] || '0'
    const saldoInicial = parseFloat(saldoInicialStr) || 0

    nuevosDatos['Total Final'] = (saldoInicial + efectivo + tarjeta).toString()
  }

  const nuevaFila = headers.map((header, i) => nuevosDatos[header] || rows[rowIndex][i]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Caja!A${rowIndex + 2}:J${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function deleteCajaByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A1:J',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 404044225,
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }
      ]
    }
  });

  return true;
}

export async function getCajasFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A1:J',
  });

  const [headers, ...rows] = res.data.values;

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
}

// Planes 

export async function getPlanesFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'PlanesYprecios!A1:F',
  });

  const [headers, ...rows] = res.data.values;
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    return obj;
  });
}

export async function appendPlanToSheet(data) {
  const nuevoID = await getNextId('PlanesYprecios!A2:A');

  const values = [[
    nuevoID,
    data.Tipo,
    data['Plan o Producto'],
    data.Precio,
    data.numero_Clases,
    data.Coins
  ]]

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'PlanesYprecios!A:F',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values }
  })

  return {
    ID: nuevoID,
    Tipo: data.Tipo,
    'Plan o Producto': data['Plan o Producto'],
    Precio: data.Precio,
    numero_Clases: data.numero_Clases,
    Coins: data.Coins
  }
}

export async function updatePlanInSheet(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'PlanesYprecios!A1:F',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);
  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((header, i) => {
    return nuevosDatos[header] ?? rows[rowIndex][i] ?? '';
  });

  sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `PlanesYprecios!A${rowIndex + 2}:F${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] }
  });

  return true;
}

export async function deletePlanInSheet(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'PlanesYprecios!A1:F',
  });

  const rows = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 222062821,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }
      ]
    }
  });

  return true;
}

export const appendAumentoToSheet = async ({
  Fecha,
  Precio_anterior,
  Precio_actualiza,
  Porcentaje_aumento,
  Plan
}) => {
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Aumentos_planes!A:F',
    valueInputOption: 'RAW',
    resource: {
      values: [
        [Fecha, Precio_anterior, Precio_actualiza, Porcentaje_aumento, Plan]
      ]
    }
  });
};

export const getAumentosPlanesFromSheet = async () => {

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const range = 'Aumentos_planes!A:F';

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) return [];

  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });

  return data;
};


// Anotaciones

export async function getAnotacionesFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F1000',
  });

  const [headers, ...rows] = res.data.values;
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    return obj;
  });
}

export async function appendAnotacionToSheet(data) {
  const registros = await getAnotacionesFromSheet();
  const nuevoID = String((registros.length || 0) + 1);

  const values = [[
    nuevoID,
    data.Fecha,
    data.Hora,
    data['Alumno DNI'],
    data.Nota,
    data.ProfeaCargo
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values }
  });
}

export async function updateAnotacionInSheet(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);
  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((h, i) => nuevosDatos[h] || rows[rowIndex][i]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Anotaciones!A${rowIndex + 2}:F${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] }
  });

  return true;
}

export async function deleteAnotacionInSheet(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F',
  });

  const rows = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);
  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 1095798724,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }
      ]
    }
  });

  return true;
}

// Clases del Club

export async function getClasesElClubFromSheet() {
  const alumnos = await getAlumnosFromSheet();
  const alumnosMap = alumnos.reduce((map, alumno) => {
    map[alumno.DNI] = alumno.Nombre;
    return map;
  }, {});

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesElClub!A1:F',
  });
  const [headers, ...rows] = res.data.values;
  if (!headers || !rows) {
    throw new Error('No se encontraron datos en la hoja de Clases del Club.');
  }

  const inscriptosIdx = headers.findIndex(h => h === 'Inscriptos');

  return rows.map(row => {
    const clase = headers.reduce((obj, header, i) => {
      obj[header] = row[i] || '';
      return obj;
    }, {});

    const dniList = (clase.Inscriptos || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const nombreList = dniList.map(dni =>
      alumnosMap[dni] || `(DNI ${dni} no encontrado)`
    );

    clase.InscriptosNombres = nombreList.join(', ');

    return clase;
  });
}


export async function updateClaseElClubInSheet(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesElClub!A1:F',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const actual = rows[rowIndex];

  const nuevaFila = headers.map((header, i) =>
    nuevosDatos[header] !== undefined ? nuevosDatos[header] : actual[i]
  );

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `ClasesElClub!A${rowIndex + 2}:F${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function appendToRegistrosClasesSheet(registro) {
  const sheets = google.sheets({ version: 'v4', auth });

  const values = [[
    registro.IDClase,
    registro['Nombre de clase'],
    registro.Fecha,
    registro.Hora,
    registro['DNI Alumno'],
    registro['Nombre Alumno']
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'RegistrosClasesElClub!A1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values
    }
  });
}

export async function eliminarRegistroDeClase({ IDClase, DNI, Fecha }) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'RegistrosClasesElClub!A1:F',
  });

  const [headers, ...rows] = res.data.values;
  const idIndex = headers.indexOf('ID');
  const dniIndex = headers.indexOf('DNI Alumno');
  const fechaIndex = headers.indexOf('Fecha');

  const rowIndex = rows.findIndex(row =>
    String(row[idIndex]) === String(IDClase) &&
    String(row[dniIndex]) === String(DNI) &&
    dayjs(row[fechaIndex], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).format('D/M/YYYY') ===
    dayjs(Fecha, ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).format('D/M/YYYY')
  );

  if (rowIndex === -1) {
    console.log("❌ No se encontró el registro a eliminar");
    return false;
  }

  console.log("✅ Eliminando fila:", rowIndex + 2);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 1279938571,
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }
      ]
    }
  });

  return true;
}

// Turnos

export async function getTurnosFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Turnos!A1:G',
  });

  const [headers, ...rows] = res.data.values || [];

  return rows.map(row => {
    const turno = {};
    headers.forEach((h, i) => {
      turno[h] = row[i] || '';
    });
    return turno;
  });
}

export async function appendTurnoToSheet(turno) {
  const nuevoID = await getNextId('Turnos!A2:A');

  const turnoConID = {
    ID: String(nuevoID),
    ...turno
  };

  const values = [[
    turnoConID.ID,
    turnoConID.Fecha,
    turnoConID.Tipo,
    turnoConID.Fecha_turno,
    turnoConID.Profesional,
    turnoConID.Responsable,
    turnoConID.Hora
  ]];
  console.log(values)

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Turnos!A1:G1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });

  return turnoConID;
}

export async function updateTurnoByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Turnos!A1:G',
  });

  const [headers, ...rows] = res.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const actual = rows[rowIndex];

  const nuevaFila = headers.map((header, i) =>
    nuevosDatos[header] !== undefined ? nuevosDatos[header] : actual[i]
  );

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Turnos!A${rowIndex + 2}:G${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function deleteTurnoByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Turnos!A1:G',
  });

  const [headers, ...rows] = res.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const sheetRowIndex = rowIndex + 1 + 1;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 1421664716,
              dimension: 'ROWS',
              startIndex: sheetRowIndex - 1,
              endIndex: sheetRowIndex
            }
          }
        }
      ]
    }
  });

  return true;
}

// Egresos

export async function getEgresosFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Egresos!A1:F',
  });

  const [headers, ...rows] = res.data.values || [];
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    return obj;
  });
}

export async function appendEgresoToSheet(data) {
  const nuevoID = await getNextId('Egresos!A2:A');

  const values = [[
    String(nuevoID),
    data.Fecha || '',
    data.Motivo || '',
    data.Monto || '',
    data.Responsable || '',
    data.Tipo || ''
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Egresos!A1:F1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });

  return { id: nuevoID, ...data };
}

export async function deleteEgresoByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Egresos!A1:E',
  });

  const [headers, ...rows] = res.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 590711251,
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }
      ]
    }
  });

  return true;
}

export async function getEgresosByMesYAnio(anio, mes) {
  const todos = await getEgresosFromSheet()

  return todos.filter(e => {
    const fecha = dayjs(e.Fecha, ["D/M/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"], true)
    return fecha.isValid() && fecha.month() + 1 === mes && fecha.year() === anio
  })
}

// Deudas

export async function getDeudasFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Deudas!A1:I",
  })

  const [headers, ...rows] = res.data.values || []
  return rows.map((row) => {
    const deuda = {}
    headers.forEach((h, i) => {
      deuda[h] = row[i] || ""
    })
    return deuda
  })
}

export async function appendDeudaToSheet(deuda) {
  const nuevoID = await getNextId("Deudas!A2:A")

  const deudaConID = {
    ID: String(nuevoID),
    ...deuda,
  }

  const values = [[
    deudaConID.ID,
    deudaConID.DNI,
    deudaConID.Nombre,
    deudaConID.Tipo,
    deudaConID.Monto,
    deudaConID.Motivo,
    deudaConID.Fecha,
    deudaConID.Estado,
    deudaConID.Responsable
  ]]

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Deudas!A1:I1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    resource: { values },
  })

  return deudaConID
}

export async function updateDeudaByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Deudas!A1:I",
  });

  const [headers, ...rows] = res.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const actual = rows[rowIndex];

  const nuevaFila = headers.map((header, i) =>
    nuevosDatos[header] !== undefined ? nuevosDatos[header] : actual[i]
  );

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Deudas!A${rowIndex + 2}:I${rowIndex + 2}`,
    valueInputOption: "USER_ENTERED",
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function deleteDeudaByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Deudas!A1:I",
  });

  const [headers, ...rows] = res.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const sheetRowIndex = rowIndex + 2;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 1774869975,
              dimension: "ROWS",
              startIndex: sheetRowIndex - 1,
              endIndex: sheetRowIndex,
            },
          },
        },
      ],
    },
  });

  return true;
}