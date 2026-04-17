import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { ClienteData, ConsultorData } from '../components/PDFModal'

// ── colores Windmar ────────────────────────────────────────────
const NAVY   = rgb(0.051, 0.125, 0.314)   // #0d2050
const BLUE   = rgb(0.102, 0.337, 0.769)   // #1a56c4
const ORANGE = rgb(0.973, 0.608, 0.141)   // #F89B24
const WHITE  = rgb(1, 1, 1)
const LIGHT  = rgb(0.918, 0.953, 1.0)     // #ebf3ff  filas alternas
const GRAY   = rgb(0.4, 0.4, 0.4)
const DARK   = rgb(0.1, 0.1, 0.1)
const BORDER = rgb(0.773, 0.831, 0.937)   // #c5d4ef

// ── datos que viene de la app ─────────────────────────────────
export interface LeaseResumen {
  paneles: string          // ej: "20 x QCells Q PEAK DUO BLK 410"
  baterias: string         // ej: "1 x Tesla Powerwall 3"
  sistemaKW: number        // ej: 8.2
  pagoFijo: number         // ej: 312
  pagoEscalador: number    // ej: 247
}

// ── función principal ─────────────────────────────────────────
export async function generateLeasePDF(
  cliente: ClienteData,
  consultor: ConsultorData,
  resumen: LeaseResumen,
) {
  // 1. Cargar el PDF modelo desde /public/pdfs/
  const res = await fetch('/lease-modelo.pdf')
  if (!res.ok) throw new Error('No se pudo cargar el PDF modelo')
  const originalBytes = await res.arrayBuffer()
  const originalDoc   = await PDFDocument.load(originalBytes)

  // 2. Crear doc de salida y copiar páginas 0-2 (primeras 3)
  const outputDoc = await PDFDocument.create()
  const boldFont  = await outputDoc.embedFont(StandardFonts.HelveticaBold)
  const regFont   = await outputDoc.embedFont(StandardFonts.Helvetica)

  const INSERT_AT = 2  // insertar como 3ª página (índice 2)
  const totalOrig = originalDoc.getPages().length

  // Copiar páginas ANTES del punto de inserción
  if (INSERT_AT > 0) {
    const before = await outputDoc.copyPages(originalDoc, range(0, INSERT_AT))
    before.forEach(p => outputDoc.addPage(p))
  }

  // 3. Cargar logo Windmar para la página de cotización
  let logoImage: any = null
  try {
    const logoRes = await fetch('https://i.postimg.cc/6T5J2v2G/logo.png')
    if (logoRes.ok) {
      const logoBytes = await logoRes.arrayBuffer()
      logoImage = await outputDoc.embedPng(logoBytes)
    }
  } catch { /* logo opcional, no bloquea */ }

  // 4. Crear la nueva página de cotización
  const { width, height } = originalDoc.getPages()[0].getSize()
  const newPage = outputDoc.addPage([width, height])
  drawCotizacionLease(newPage, { width, height }, boldFont, regFont,
    cliente, consultor, resumen, logoImage)

  // Copiar páginas DESPUÉS del punto de inserción
  if (INSERT_AT < totalOrig) {
    const after = await outputDoc.copyPages(originalDoc, range(INSERT_AT, totalOrig))
    after.forEach(p => outputDoc.addPage(p))
  }

  // 4. Descargar
  const bytes = await outputDoc.save()
  downloadPDF(bytes, `Cotizacion-Lease-${clean(cliente.nombre)}.pdf`)
}

// ── dibujar contenido de la página ────────────────────────────
function drawCotizacionLease(
  page: any,
  { width, height }: { width: number; height: number },
  bold: any,
  reg: any,
  cliente: ClienteData,
  consultor: ConsultorData,
  resumen: LeaseResumen,
  logoImage: any = null,
) {
  const M = 36   // margen lateral
  const dataW = width - M * 2

  // ── Fondo blanco ──
  rect(page, 0, 0, width, height, WHITE)

  // ── Header navy ──
  const headerH = 60
  rect(page, 0, height - headerH, width, headerH, NAVY)
  rect(page, 0, height - headerH - 8, width * 0.58, 8, ORANGE)

  // Texto WINDMAR/ENERGY (izquierda)
  text(page, 'WINDMAR', 22, M, height - 22, bold, WHITE)
  text(page, 'ENERGY by Qcells', 9, M, height - 38, reg, ORANGE)

  // Logo Windmar (derecha, grande, centrado verticalmente en el header)
  if (logoImage) {
    const lDims = logoImage.scale(0.28)
    const lx    = width - lDims.width - 20
    const ly    = height - headerH + Math.round((headerH - lDims.height) / 2)
    page.drawImage(logoImage, { x: lx, y: ly, width: lDims.width, height: lDims.height })
  }

  // ── Título Cotizacion ──
  text(page, 'Cotizacion', 22, M, height - headerH - 26, bold, BLUE)

  const today = new Date().toLocaleDateString('es-PR')

  // ── Bloque cliente/consultor ──
  // Dividir en dos columnas iguales
  const colW  = Math.round(width * 0.46)
  const col2X = M + colW + 10
  const col2W = width - col2X - M

  // Info cliente (izquierda)
  const cY = height - headerH - 60
  text(page, clean(cliente.nombre),   11, M, cY,       bold, DARK)
  text(page, clean(cliente.direccion),  9, M, cY - 16, reg,  GRAY)
  text(page, `${clean(cliente.ciudad)}, PR ${cliente.zipCode}`, 9, M, cY - 29, reg, GRAY)
  text(page, cliente.telefono,          9, M, cY - 42, reg,  GRAY)
  text(page, clean(cliente.email),      9, M, cY - 55, reg,  BLUE)

  // Tabla consultor (derecha) — filas con alineación correcta
  const rowH = 20
  const tRows: [string, string][] = [
    ['Cotizacion No.', `001   Fecha: ${today}`],
    ['Consultor:', clean(consultor.nombre)],
    ['Telefono:', consultor.telefono],
    ['Correo:', clean(consultor.email)],
  ]
  const tTop = cY + 6   // alineado con nombre del cliente
  tRows.forEach(([lbl, val], i) => {
    const ry = tTop - i * rowH
    if (i % 2 === 0) rect(page, col2X, ry - rowH + 5, col2W, rowH, LIGHT)
    text(page, lbl, 8, col2X + 5, ry - 8, bold, BLUE)
    text(page, val, 8, col2X + 84, ry - 8, reg,  DARK)
  })
  // Borde exterior de la tabla
  page.drawRectangle({
    x: col2X,
    y: tTop - tRows.length * rowH - 2,
    width:  col2W,
    height: tRows.length * rowH + rowH,
    borderColor: BORDER,
    borderWidth: 0.6,
  })

  // ── Sección: Detalles del Sistema Solar ──
  const secY = height - headerH - 168
  text(page, 'Detalles del Sistema Solar', 13, M, secY, bold, BLUE)
  page.drawLine({
    start: { x: M, y: secY - 5 },
    end:   { x: M + 178, y: secY - 5 },
    thickness: 2, color: ORANGE,
  })

  // Filas del sistema (fondo centrado con texto)
  const sysRows: [string, string][] = [
    ['Cantidad de Paneles:', clean(resumen.paneles)],
    ['Cantidad de Baterias:', clean(resumen.baterias)],
    ['Tamano del Sistema:', `${resumen.sistemaKW} KW`],
  ]
  const rH = 20   // altura de fila
  const valX = 212
  let sy = secY - 30
  sysRows.forEach(([lbl, val], i) => {
    if (i % 2 === 0) rect(page, M, sy - 6, dataW, rH, LIGHT)
    text(page, lbl, 9, M + 8, sy + 3, bold, BLUE)
    text(page, val, 9, valX,  sy + 3, reg,  DARK)
    sy -= rH + 4
  })

  // Separador
  page.drawLine({
    start: { x: M, y: sy + 2 },
    end:   { x: width - M, y: sy + 2 },
    thickness: 0.5, color: BORDER,
  })
  sy -= 16

  // Filas de pagos
  rect(page, M, sy - 6, dataW, rH, LIGHT)
  text(page, 'Pago Mensual Fijo:', 10, M + 8, sy + 3, bold, DARK)
  text(page, `$${resumen.pagoFijo}`, 10, valX, sy + 3, bold, DARK)
  sy -= rH + 4

  rect(page, M, sy - 6, dataW, rH, LIGHT)
  text(page, 'Pago Mensual Escalador:', 10, M + 8, sy + 3, bold, DARK)
  text(page, `$${resumen.pagoEscalador}`, 10, valX, sy + 3, bold, DARK)
  sy -= 18

  text(page, '* Precios aproximados. Los pagos mensuales pueden variar +/- 2%.', 7.5, M + 8, sy, reg, GRAY)

  // ── CTA ──
  const ctaY = sy - 32
  text(page, 'Cotiza hoy y empieza a ahorrar con energia confiable.', 13, M, ctaY, reg, BLUE)
  text(page, 'Accesible, simple y rapido.', 15, M, ctaY - 19, bold, NAVY)

  // Financieras — dos badges navy
  const bY = ctaY - 48
  rect(page, M,       bY - 5, 66,  22, NAVY)
  text(page, 'ENFIN', 8, M + 12, bY + 5, bold, WHITE)

  rect(page, M + 76,  bY - 5, 168, 22, NAVY)
  text(page, 'PALMETTO LIGHTREACH', 8, M + 86, bY + 5, bold, WHITE)

  // ── Beneficios ──
  const benY = ctaY - 80
  const benW = dataW / 3
  const bens = [
    'Aprobacion rapida y flexible',
    'Garantia, instalacion y servicio incluidos',
    'Servicio al cliente 24/7',
  ]
  bens.forEach((b, i) => {
    text(page, b, 8, M + 4 + i * benW, benY, i === 2 ? bold : reg, i === 2 ? NAVY : GRAY)
    if (i < 2) page.drawLine({
      start: { x: M + (i + 1) * benW, y: benY + 12 },
      end:   { x: M + (i + 1) * benW, y: benY - 8 },
      thickness: 0.5, color: GRAY,
    })
  })

  // ── Footer ──
  const footerH = 104
  rect(page, 0, 0, width, footerH, NAVY)
  rect(page, 0, footerH - 3, width, 3, ORANGE)
  rect(page, 0, 0, 4, footerH, ORANGE)

  // Logo en footer (misma escala que header)
  if (logoImage) {
    const fD = logoImage.scale(0.34)
    const fY  = Math.round((footerH - fD.height) / 2)
    page.drawImage(logoImage, { x: 14, y: fY, width: fD.width, height: fD.height })
  }

  page.drawLine({ start: { x: 230, y: 92 }, end: { x: 230, y: 12 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.7) })
  text(page, 'Contactanos', 7, 242, 78, bold, WHITE)
  text(page, 'ventas@windmarhome.com', 7, 242, 60, reg, rgb(0.8, 0.8, 0.9))
  text(page, '(787) 395-7766', 7, 242, 44, reg, rgb(0.8, 0.8, 0.9))

  page.drawLine({ start: { x: 390, y: 92 }, end: { x: 390, y: 12 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.7) })
  text(page, 'Direccion', 7, 402, 78, bold, WHITE)
  text(page, '1255 Avenida F.D. Roosevelt,', 7, 402, 60, reg, rgb(0.8, 0.8, 0.9))
  text(page, 'San Juan, 00920, Puerto Rico.', 7, 402, 44, reg, rgb(0.8, 0.8, 0.9))
}

// ── helpers ───────────────────────────────────────────────────
function rect(page: any, x: number, y: number, w: number, h: number, color: any) {
  page.drawRectangle({ x, y, width: w, height: h, color })
}
function text(page: any, t: string, size: number, x: number, y: number, font: any, color: any) {
  try { page.drawText(t, { x, y, size, font, color }) } catch { /* chars no soportados */ }
}
function clean(s: string): string {
  // pdf-lib Helvetica estándar no soporta tildes/ñ → reemplazar
  return s
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[ÁÀÄ]/g, 'A').replace(/[ÉÈË]/g, 'E')
    .replace(/[ÍÌÏ]/g, 'I').replace(/[ÓÒÖ]/g, 'O')
    .replace(/[ÚÙÜ]/g, 'U').replace(/[Ñ]/g, 'N')
}
function range(from: number, to: number) {
  return Array.from({ length: to - from }, (_, i) => i + from)
}
function downloadPDF(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
