import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export async function getAdvisorAdvice(panels: string, battery: string, fixed: number, escalator: number) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Eres un experto asesor de energía solar de Windmar Home. 
      El cliente está considerando una configuración de ${panels} placas solares con ${battery} batería(s) Tesla.
      El pago fijo es de $${fixed} y el pago con escalador (2.99%) empieza en $${escalator}.
      
      Explica brevemente (máximo 3 párrafos cortos) por qué esta configuración es beneficiosa para un hogar en Puerto Rico, 
      mencionando la independencia energética y la protección contra aumentos de LUMA. 
      Usa un tono profesional, entusiasta y persuasivo. Habla de Windmar como líder en el mercado.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching advice:", error);
    return "Como experto de Windmar, te aseguro que esta configuración optimizará tu consumo y te brindará la paz mental que mereces frente a los aumentos de la red eléctrica.";
  }
}
