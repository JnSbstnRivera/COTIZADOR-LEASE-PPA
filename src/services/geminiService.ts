import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export async function getAdvisorAdvice(
  panels: string,
  battery: string,
  fixed: number,
  escalator: number,
  size: string,
  epc: string
) {
  // Pre-calculate financials for the prompt
  const escalatorYear25 = (escalator * Math.pow(1.0299, 24)).toFixed(0);
  const totalFixed25     = (fixed * 12 * 25).toLocaleString('en-US');
  const totalEscalator25 = Math.round(
    escalator * 12 * ((Math.pow(1.0299, 25) - 1) / 0.0299)
  ).toLocaleString('en-US');
  const systemKw = (parseInt(size.replace(/,/g, '')) / 1000).toFixed(1);
  // Estimated monthly kWh production (Puerto Rico avg ~5.2 peak sun hours)
  const monthlyKwh = Math.round((parseInt(size.replace(/,/g, '')) / 1000) * 5.2 * 30);
  // Estimated LUMA savings at $0.28/kWh
  const lumaMonthly = Math.round(monthlyKwh * 0.28);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Eres un asesor senior de energía solar de Windmar Home Puerto Rico.
Genera un análisis de compra DETALLADO y profesional en español para esta configuración de Lease Solar:

**CONFIGURACIÓN DEL SISTEMA:**
- Placas solares: ${panels} paneles (${systemKw} kW)
- Batería Tesla Powerwall: ${battery}x
- Capacidad instalada: ${size} W
- EPC mínimo del proyecto: ${epc}
- Producción estimada: ~${monthlyKwh} kWh/mes

**ESTRUCTURA DE PAGOS (LEASE 25 AÑOS):**
- Pago Fijo: $${fixed}/mes (constante por 25 años)
- Pago Escalador: inicia en $${escalator}/mes (+2.99% anual) → llega a $${escalatorYear25}/mes al año 25
- Total acumulado Fijo (25 años): $${totalFixed25}
- Total acumulado Escalador (25 años): $${totalEscalator25}
- Factura LUMA estimada que reemplaza: ~$${lumaMonthly}/mes (a $0.28/kWh)

Genera el análisis usando exactamente estas secciones en markdown:

## 🏡 Resumen del Sistema
Describe el sistema en términos claros: cuánto produce, qué porcentaje del hogar cubre, capacidad de las baterías.

## 💰 Análisis Financiero
Compara Pago Fijo vs Escalador con los números exactos. ¿Cuál conviene más y en qué escenario?
Compara contra seguir pagando LUMA con la tarifa actual y su proyección de aumento (~3-5% anual histórico).
Calcula el ahorro mensual y el ahorro total aproximado en 25 años vs LUMA.

## 🔋 Independencia Energética
Beneficios del Powerwall ante los frecuentes apagones de Puerto Rico.
Cuántas horas de respaldo ofrece esta configuración de ${battery} batería(s).

## 🌱 Impacto Ambiental
CO₂ evitado por año y equivalencia en árboles. Usa datos reales de emisiones de la red PR.

## ✅ Recomendación del Asesor
Veredicto final claro. Por qué Windmar Home es la elección correcta. Llamada a la acción.

Sé profesional, usa los números exactos provistos, persuasivo pero honesto. Máximo 420 palabras total.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error Gemini API:", error);
    return `## ✅ Análisis de tu Configuración Lease

**Sistema:** ${panels} placas · ${systemKw} kW · ${battery}x Tesla Powerwall

**💰 Pago Fijo $${fixed}/mes** — precio garantizado por 25 años, sin sorpresas.
**📈 Pago Escalador $${escalator}/mes** — menor al inicio, llega a ~$${escalatorYear25} al año 25.

Comparado con LUMA (~$${lumaMonthly}/mes estimado), el Lease Fijo representa un ahorro inmediato y protección total ante aumentos tarifarios.

Con **${battery} Tesla Powerwall**, tu hogar mantiene energía durante los apagones que afectan Puerto Rico.

*Windmar Home — Líder en energía solar en Puerto Rico. Garantía de 25 años incluida.*`;
  }
}
