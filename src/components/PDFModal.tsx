import { useState } from 'react'
import { X, Download, FileText } from 'lucide-react'

// ── tipos compartidos ──────────────────────────────────────────
export interface ClienteData {
  nombre: string
  direccion: string
  ciudad: string
  zipCode: string
  telefono: string
  email: string
}

export interface ConsultorData {
  nombre: string
  email: string
  telefono: string
}

// ── props del modal ────────────────────────────────────────────
interface PDFModalProps {
  isOpen: boolean
  onClose: () => void
  tipo: 'lease' | 'loan' | 'roofing'
  resumen: Record<string, string | number>   // datos auto de la app
  onGenerate: (cliente: ClienteData, consultor: ConsultorData) => Promise<void>
  // Para LOAN: selector de plazo
  plazos?: string[]
  plazoSeleccionado?: string
  onPlazoChange?: (p: string) => void
  // Para ROOFING: selector múltiple de planes
  planes?: string[]
  planesSeleccionados?: string[]
  onPlanesChange?: (planes: string[]) => void
}

const TITULOS = {
  lease:   'Cotización LEASE PPA',
  loan:    'Cotización LOAN',
  roofing: 'Cotización ROOFING',
}

// ── helper de campo (fuera del componente para evitar re-mount en cada tecla) ──
function Field({
  label, value, onChange, type = 'text', colSpan = 1,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; colSpan?: number
}) {
  return (
    <div style={{ gridColumn: colSpan === 2 ? 'span 2' : 'span 1' }}>
      <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', border: '1px solid #d0d9ef', borderRadius: 8,
          padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ── componente ────────────────────────────────────────────────
export function PDFModal({
  isOpen, onClose, tipo, resumen, onGenerate,
  plazos, plazoSeleccionado, onPlazoChange,
  planes, planesSeleccionados, onPlanesChange,
}: PDFModalProps) {

  const [cliente, setCliente] = useState<ClienteData>({
    nombre: '', direccion: '', ciudad: '', zipCode: '', telefono: '', email: '',
  })
  const [consultor, setConsultor] = useState<ConsultorData>({
    nombre: '', email: '', telefono: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleGenerate = async () => {
    if (!cliente.nombre.trim() || !consultor.nombre.trim()) {
      setError('Nombre del cliente y consultor son requeridos.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onGenerate(cliente, consultor)
      onClose()
    } catch (e) {
      setError('Error generando el PDF. Intenta de nuevo.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #e8eef7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} color="#1a56c4" />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1a56c4' }}>
              {TITULOS[tipo]}
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={22} color="#888" />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── DATOS DEL CLIENTE ── */}
          <section>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#1a56c4',
              borderBottom: '2px solid #F89B24', paddingBottom: 4, marginBottom: 12,
            }}>
              Datos del Cliente
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Nombre completo *"  value={cliente.nombre}    onChange={v => setCliente({...cliente, nombre: v})}    colSpan={2} />
              <Field label="Dirección"          value={cliente.direccion} onChange={v => setCliente({...cliente, direccion: v})} colSpan={2} />
              <Field label="Ciudad"             value={cliente.ciudad}    onChange={v => setCliente({...cliente, ciudad: v})} />
              <Field label="ZIP Code"           value={cliente.zipCode}   onChange={v => setCliente({...cliente, zipCode: v})} />
              <Field label="Teléfono"           value={cliente.telefono}  onChange={v => setCliente({...cliente, telefono: v})} />
              <Field label="Email"              value={cliente.email}     onChange={v => setCliente({...cliente, email: v})} type="email" />
            </div>
          </section>

          {/* ── DATOS DEL CONSULTOR ── */}
          <section>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#1a56c4',
              borderBottom: '2px solid #F89B24', paddingBottom: 4, marginBottom: 12,
            }}>
              Datos del Consultor
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Nombre del Consultor *" value={consultor.nombre}   onChange={v => setConsultor({...consultor, nombre: v})}   colSpan={2} />
              <Field label="Email del Consultor"    value={consultor.email}    onChange={v => setConsultor({...consultor, email: v})}    type="email" />
              <Field label="Teléfono del Consultor" value={consultor.telefono} onChange={v => setConsultor({...consultor, telefono: v})} />
            </div>
          </section>

          {/* ── SELECTOR PLAZO — solo LOAN ── */}
          {tipo === 'loan' && plazos && (
            <section>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#1a56c4',
                borderBottom: '2px solid #F89B24', paddingBottom: 4, marginBottom: 12,
              }}>
                Tipo de Financiamiento
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {plazos.map(p => (
                  <button
                    key={p}
                    onClick={() => onPlazoChange?.(p)}
                    style={{
                      padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                      border: `2px solid ${plazoSeleccionado === p ? '#1a56c4' : '#d0d9ef'}`,
                      background: plazoSeleccionado === p ? '#1a56c4' : 'white',
                      color: plazoSeleccionado === p ? 'white' : '#333',
                      fontWeight: plazoSeleccionado === p ? 700 : 400,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── SELECTOR PLANES — solo ROOFING ── */}
          {tipo === 'roofing' && planes && (
            <section>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#1a56c4',
                borderBottom: '2px solid #F89B24', paddingBottom: 4, marginBottom: 12,
              }}>
                Planes de Sellado (selección múltiple)
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {planes.map(plan => {
                  const selected = planesSeleccionados?.includes(plan)
                  const colores: Record<string, string> = {
                    Silver: '#6b7280', Gold: '#F89B24', Platinum: '#0d2050',
                  }
                  return (
                    <button
                      key={plan}
                      onClick={() => {
                        const curr = planesSeleccionados ?? []
                        onPlanesChange?.(
                          selected ? curr.filter(p => p !== plan) : [...curr, plan]
                        )
                      }}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13,
                        cursor: 'pointer', fontWeight: 700,
                        border: `2px solid ${selected ? colores[plan] : '#d0d9ef'}`,
                        background: selected ? colores[plan] : 'white',
                        color: selected ? 'white' : '#333',
                      }}
                    >
                      {plan}
                    </button>
                  )
                })}
              </div>
              {(planesSeleccionados?.length ?? 0) === 0 && (
                <p style={{ fontSize: 11, color: '#e74c3c', marginTop: 6 }}>
                  Selecciona al menos un plan de sellado.
                </p>
              )}
            </section>
          )}

          {/* ── RESUMEN AUTOMÁTICO ── */}
          <section>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#1a56c4',
              borderBottom: '2px solid #F89B24', paddingBottom: 4, marginBottom: 12,
            }}>
              Resumen de Cotización (generado automáticamente)
            </div>
            <div style={{ background: '#ebf3ff', borderRadius: 10, padding: '12px 16px' }}>
              {Object.entries(resumen).map(([k, v], i) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '5px 0',
                  borderTop: i > 0 ? '1px solid #c5d4ef' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: '#555' }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0d2050' }}>{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Error */}
          {error && (
            <p style={{ fontSize: 12, color: '#e74c3c', background: '#fde8e8', padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '16px 24px', borderTop: '1px solid #e8eef7',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px', borderRadius: 8, border: '1px solid #d0d9ef',
              background: 'white', color: '#555', fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: loading ? '#93b3e8' : '#1a56c4',
              color: 'white', fontSize: 13, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Download size={16} />
            {loading ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
