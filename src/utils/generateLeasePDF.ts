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

  const INSERT_AT = 3  // insertar como 4ª página (índice 3)
  const totalOrig = originalDoc.getPages().length

  // Copiar páginas ANTES del punto de inserción
  if (INSERT_AT > 0) {
    const before = await outputDoc.copyPages(originalDoc, range(0, INSERT_AT))
    before.forEach(p => outputDoc.addPage(p))
  }

  // 3. Crear la nueva página de cotización
  const { width, height } = originalDoc.getPages()[0].getSize()
  const newPage = outputDoc.addPage([width, height])
  drawCotizacionLease(newPage, { width, height }, boldFont, regFont,
    cliente, consultor, resumen)

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
) {
  // Fondo blanco
  rect(page, 0, 0, width, height, WHITE)

  // ── Barra superior navy ──
  rect(page, 0, height - 72, width, 72, NAVY)

  // Acento naranja bajo la barra
  rect(page, 0, height - 82, width * 0.55, 10, ORANGE)

  // Texto logo en barra
  text(page, 'WINDMAR', 22, 38, height - 32, bold, WHITE)
  text(page, 'ENERGY', 11, 38, height - 48, reg, ORANGE)

  // ── Titulo "Cotizacion" ──
  text(page, 'Cotizacion', 24, 38, height - 102, bold, BLUE)

  const today = new Date().toLocaleDateString('es-PR')

  // ── Datos del cliente (izquierda) ──
  const clientY = height - 130
  text(page, clean(cliente.nombre),   11, 38, clientY,      bold, DARK)
  text(page, clean(cliente.direccion),  9, 38, clientY - 15, reg,  GRAY)
  text(page, `${clean(cliente.ciudad)}, PR ${cliente.zipCode}`, 9, 38, clientY - 27, reg, GRAY)
  text(page, cliente.telefono,          9, 38, clientY - 39, reg,  GRAY)
  text(page, clean(cliente.email),      9, 38, clientY - 51, reg,  BLUE)

  // ── Tabla info consultor (derecha) ──
  const col2X = width * 0.5
  const col2W = width - col2X - 30
  const rows = [
    ['Cotizacion No.', `001   Fecha: ${today}`],
    ['Consultor:', clean(consultor.nombre)],
    ['Telefono:', consultor.telefono],
    ['Correo:', clean(consultor.email)],
  ]
  let ry = height - 118
  rows.forEach(([lbl, val], i) => {
    if (i % 2 === 0) rect(page, col2X, ry - 14, col2W, 20, LIGHT)
    text(page, lbl, 8, col2X + 6, ry,  bold, BLUE)
    text(page, val, 8, col2X + 85, ry, reg,  DARK)
    ry -= 22
  })
  // borde de la tabla
  page.drawRectangle({
    x: col2X, y: ry - 2, width: col2W, height: 22 * rows.length + 4,
    borderColor: BORDER, borderWidth: 0.5,
  })

  // ── Titulo seccion sistema ──
  const secY = height - 210
  text(page, 'Detalles del Sistema Solar', 13, 38, secY, bold, BLUE)
  page.drawLine({ start: { x: 38, y: secY - 5 }, end: { x: 200, y: secY - 5 }, thickness: 2, color: ORANGE })

  // ── Tabla sistema ──
  const sysRows: [string, string][] = [
    ['Cantidad de Paneles:', clean(resumen.paneles)],
    ['Cantidad de Baterias:', clean(resumen.baterias)],
    ['Tamano del Sistema:', `${resumen.sistemaKW} KW`],
  ]
  let sy = secY - 30
  sysRows.forEach(([lbl, val], i) => {
    if (i % 2 === 0) rect(page, 38, sy - 12, width - 76, 20, LIGHT)
    text(page, lbl, 9, 46, sy, bold, BLUE)
    text(page, val, 9, 220, sy, reg, DARK)
    sy -= 22
  })

  // separador
  page.drawLine({ start: { x: 38, y: sy - 5 }, end: { x: width - 38, y: sy - 5 }, thickness: 0.5, color: BORDER })

  // Pagos
  sy -= 20
  rect(page, 38, sy - 12, width - 76, 20, LIGHT)
  text(page, 'Pago Mensual Fijo:', 10, 46, sy, bold, DARK)
  text(page, `$${resumen.pagoFijo}`, 10, 220, sy, bold, DARK)
  sy -= 22
  rect(page, 38, sy - 12, width - 76, 20, LIGHT)
  text(page, 'Pago Mensual Escalador:', 10, 46, sy, bold, DARK)
  text(page, `$${resumen.pagoEscalador}`, 10, 220, sy, bold, DARK)
  sy -= 20
  text(page, '*Pago mensual es un estimado. Puede variar por +/- 2%', 8, 46, sy, reg, GRAY)

  // ── CTA ──
  const ctaY = sy - 35
  text(page, 'Cotiza hoy y empieza a ahorrar con energia confiable.', 14, 38, ctaY, reg, BLUE)
  text(page, 'Accesible, simple y rapido.', 16, 38, ctaY - 22, bold, NAVY)

  // Botón portal
  rect(page, 38, ctaY - 52, 170, 22, NAVY)
  text(page, 'Portal de Financiamiento EnFin', 8, 46, ctaY - 44, bold, WHITE)

  // Beneficios
  const benY = ctaY - 90
  const benW = (width - 76) / 3
  const bens = ['Aprobacion rapida y flexible', 'Garantia, instalacion y servicio incluidos', 'Servicio al cliente 24/7']
  bens.forEach((b, i) => {
    text(page, b, 8, 46 + i * benW, benY, i === 2 ? bold : reg, i === 2 ? NAVY : GRAY)
    if (i < 2) page.drawLine({
      start: { x: 38 + (i + 1) * benW, y: benY + 15 },
      end:   { x: 38 + (i + 1) * benW, y: benY - 10 },
      thickness: 0.5, color: GRAY,
    })
  })

  // ── Footer ──
  rect(page, 0, 0, width, 55, NAVY)
  text(page, 'windmar.com', 12, 38, 30, bold, WHITE)
  page.drawLine({ start: { x: 148, y: 50 }, end: { x: 148, y: 10 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.7) })
  text(page, 'Contactanos', 7, 162, 40, bold, WHITE)
  text(page, 'ventas@windmarhome.com', 7, 162, 28, reg, rgb(0.8, 0.8, 0.9))
  text(page, '(787) 395-7766', 7, 162, 16, reg, rgb(0.8, 0.8, 0.9))
  page.drawLine({ start: { x: 290, y: 50 }, end: { x: 290, y: 10 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.7) })
  text(page, 'Direccion', 7, 304, 40, bold, WHITE)
  text(page, '1255 Avenida F.D. Roosevelt,', 7, 304, 28, reg, rgb(0.8, 0.8, 0.9))
  text(page, 'San Juan, 00920, Puerto Rico.', 7, 304, 16, reg, rgb(0.8, 0.8, 0.9))
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
