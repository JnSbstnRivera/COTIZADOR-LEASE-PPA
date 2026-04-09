export interface SolarConfig {
  size: string;
  epc: string;
  fixedPrice: number;
  escalatorPrice: number;
}

export const SOLAR_DATA: Record<string, SolarConfig> = {
  "10": { size: "4,100", epc: "$4.55", fixedPrice: 175, escalatorPrice: 139 },
  "11": { size: "4,510", epc: "$4.50", fixedPrice: 191, escalatorPrice: 151 },
  "12": { size: "4,920", epc: "$4.45", fixedPrice: 206, escalatorPrice: 163 },
  "13": { size: "5,330", epc: "$4.40", fixedPrice: 221, escalatorPrice: 174 },
  "14": { size: "5,740", epc: "$4.35", fixedPrice: 235, escalatorPrice: 186 },
  "15": { size: "6,150", epc: "$4.30", fixedPrice: 249, escalatorPrice: 197 },
  "16": { size: "6,560", epc: "$4.25", fixedPrice: 262, escalatorPrice: 207 },
  "17": { size: "6,970", epc: "$4.20", fixedPrice: 275, escalatorPrice: 218 },
  "18": { size: "7,380", epc: "$4.15", fixedPrice: 288, escalatorPrice: 228 },
  "19": { size: "7,790", epc: "$4.10", fixedPrice: 300, escalatorPrice: 237 },
  "20": { size: "8,200", epc: "$4.05", fixedPrice: 312, escalatorPrice: 247 },
  "21": { size: "8,610", epc: "$4.00", fixedPrice: 324, escalatorPrice: 256 },
  "22": { size: "9,020", epc: "$3.95", fixedPrice: 335, escalatorPrice: 265 },
  "23": { size: "9,430", epc: "$3.90", fixedPrice: 346, escalatorPrice: 273 },
  "24": { size: "9,840", epc: "$3.85", fixedPrice: 356, escalatorPrice: 282 },
  "22-2t": { size: "9,020", epc: "$4.30", fixedPrice: 365, escalatorPrice: 288 },
  "23-2t": { size: "9,430", epc: "$4.25", fixedPrice: 377, escalatorPrice: 298 },
  "24-2t": { size: "9,840", epc: "$4.20", fixedPrice: 389, escalatorPrice: 307 },
  "25-2t": { size: "10,250", epc: "$4.15", fixedPrice: 400, escalatorPrice: 316 },
  "26-2t": { size: "10,660", epc: "$4.10", fixedPrice: 411, escalatorPrice: 325 },
  "27-2t": { size: "11,070", epc: "$4.05", fixedPrice: 422, escalatorPrice: 333 },
  "28-2t": { size: "11,480", epc: "$4.00", fixedPrice: 432, escalatorPrice: 341 },
  "29-2t": { size: "11,890", epc: "$3.95", fixedPrice: 442, escalatorPrice: 349 },
  "30-2t": { size: "12,300", epc: "$3.90", fixedPrice: 451, escalatorPrice: 357 },
  "31-2t": { size: "12,710", epc: "$3.85", fixedPrice: 460, escalatorPrice: 364 },
  "32-2t": { size: "13,120", epc: "$3.80", fixedPrice: 469, escalatorPrice: 371 },
  "33-2t": { size: "13,530", epc: "$3.75", fixedPrice: 477, escalatorPrice: 377 },
  "34-2t": { size: "13,940", epc: "$3.70", fixedPrice: 485, escalatorPrice: 383 },
  "35-2t": { size: "14,350", epc: "$3.70", fixedPrice: 499, escalatorPrice: 395 },
  "36-2t": { size: "14,760", epc: "$3.70", fixedPrice: 514, escalatorPrice: 406 },
  "37-2t": { size: "15,170", epc: "$3.70", fixedPrice: 528, escalatorPrice: 417 },
  "38-2t": { size: "15,580", epc: "$3.70", fixedPrice: 542, escalatorPrice: 429 }
};
