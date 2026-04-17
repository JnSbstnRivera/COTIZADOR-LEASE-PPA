import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, 
  Battery, 
  TrendingUp, 
  ShieldCheck, 
  CloudSun, 
  MapPin, 
  Zap,
  ChevronRight,
  Info,
  Sparkles,
  ArrowRight,
  FileText,
  FileDown
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { PDFModal } from './components/PDFModal';
import { generateLeasePDF } from './utils/generateLeasePDF';
import type { ClienteData, ConsultorData } from './components/PDFModal';
import { SOLAR_DATA, SolarConfig } from './constants';
import { getAdvisorAdvice } from './services/geminiService';

const REGIONS = [
  { name: 'Norte (San Juan)', value: 'San Juan' },
  { name: 'Sur (Ponce)', value: 'Ponce' },
  { name: 'Oeste (Mayagüez)', value: 'Mayaguez' },
  { name: 'Este (Fajardo)', value: 'Fajardo' },
  { name: 'Centro (Utuado)', value: 'Utuado' },
];

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-[#f0f7ff] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Solar Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="grid grid-cols-8 gap-1 h-full w-full">
          {Array.from({ length: 64 }).map((_, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
              className="bg-windmar-blue/20 aspect-square border border-windmar-blue/10"
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Sun/Energy Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 15,
            duration: 1 
          }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-windmar-yellow blur-3xl opacity-20 animate-pulse" />
          <div className="p-6 bg-white/50 rounded-full border border-windmar-blue/10 backdrop-blur-sm relative text-windmar-orange">
            <Sun className="w-16 h-16 animate-spin-slow" />
          </div>
        </motion.div>

        {/* Logo Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-6"
        >
          <img 
            src="https://i.postimg.cc/44pJ0vXw/logo.png" 
            alt="Windmar Logo" 
            className="h-24 w-auto drop-shadow-md"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Title & Slogan */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, letterSpacing: "0.5em" }}
            animate={{ opacity: 1, letterSpacing: "0.1em" }}
            transition={{ delay: 1, duration: 1 }}
            className="text-3xl md:text-5xl font-black text-windmar-dark uppercase tracking-widest mb-2"
          >
            Lease Pro
          </motion.h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.5, duration: 1 }}
            className="h-1 bg-windmar-yellow mx-auto mb-4"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="text-windmar-blue font-bold text-sm tracking-[0.3em] uppercase"
          >
            Energía Inteligente • Puerto Rico
          </motion.p>
        </div>

        {/* Contract Symbolism */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5, duration: 0.5 }}
          className="mt-12 flex items-center gap-3 px-6 py-3 bg-white/50 rounded-2xl border border-windmar-blue/10 shadow-sm"
        >
          <FileText className="w-5 h-5 text-windmar-orange" />
          <span className="text-windmar-dark/60 text-xs font-bold tracking-widest uppercase">Contrato de Arriendo Seguro</span>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 3, ease: "linear" }}
        onAnimationComplete={() => setTimeout(onComplete, 500)}
        className="absolute bottom-0 left-0 right-0 h-1 bg-windmar-yellow origin-left"
      />
    </motion.div>
  );
};

export default function App() {
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [region, setRegion] = useState('San Juan');
  const [weather, setWeather] = useState({ temp: '--', clouds: '--', efficiency: '--' });
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [pdfModalAbierto, setPdfModalAbierto] = useState(false);

  const selectedData = useMemo(() => SOLAR_DATA[selectedKey] || null, [selectedKey]);

  useEffect(() => {
    fetchWeather();
  }, [region]);

  const fetchWeather = async () => {
    const apiKey = 'bd5e378503939ddaee76f12ad7a97608'; 
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${region},PR&appid=${apiKey}&units=metric&lang=es`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      const clouds = data.clouds.all;
      const efficiency = (100 - (clouds * 0.4)).toFixed(0);
      setWeather({
        temp: Math.round(data.main.temp).toString(),
        clouds: clouds.toString(),
        efficiency
      });
    } catch (e) {
      setWeather({ temp: '28', clouds: '15', efficiency: '94' });
    }
  };

  const handleAiAdvice = async () => {
    if (!selectedData) return;
    setIsAiLoading(true);
    const panels = selectedKey.split('-')[0];
    const battery = selectedKey.includes('2t') ? '2' : '1';
    const advice = await getAdvisorAdvice(
      panels,
      battery,
      selectedData.fixedPrice,
      selectedData.escalatorPrice,
      selectedData.size,
      selectedData.epc
    );
    setAiAdvice(advice || null);
    setIsAiLoading(false);
  };

  useEffect(() => {
    if (selectedData) {
      setAiAdvice(null);
    }
  }, [selectedKey]);

  const chartData = useMemo(() => {
    if (!selectedData) return [];
    const data = [];
    for (let year = 1; year <= 25; year++) {
      const escalator = parseFloat((selectedData.escalatorPrice * Math.pow(1.0299, year - 1)).toFixed(2));
      data.push({
        year: `Año ${year}`,
        'Pago Fijo': selectedData.fixedPrice,
        'Pago Escalador': escalator,
      });
    }
    return data;
  }, [selectedData]);

  const numPaneles = selectedKey ? parseInt(selectedKey.split('-')[0]) : 0;
  const incluyeDosT = selectedKey?.includes('2t') ?? false;

  const leaseResumen = {
    paneles: `${numPaneles} x QCells Q PEAK DUO BLK ML-G10+ 410`,
    baterias: incluyeDosT ? '2 x Tesla Powerwall 3' : '1 x Tesla Powerwall 3',
    sistemaKW: selectedData ? Number((selectedData.size / 1000).toFixed(2)) : 0,
    pagoFijo: selectedData?.fixedPrice ?? 0,
    pagoEscalador: selectedData?.escalatorPrice ?? 0,
  };

  const resumenParaModal: Record<string, string> = {
    'Paneles': leaseResumen.paneles,
    'Baterias': leaseResumen.baterias,
    'Tamano del Sistema': `${leaseResumen.sistemaKW} KW`,
    'Pago Mensual Fijo': `$${leaseResumen.pagoFijo}`,
    'Pago Mensual Escalador': `$${leaseResumen.pagoEscalador}`,
  };

  const handleGenerateLeasePDF = async (cliente: ClienteData, consultor: ConsultorData) => {
    await generateLeasePDF(cliente, consultor, leaseResumen);
  };

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
      ) : (
        <motion.div 
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen pb-16"
        >
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-32 flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-8">
            <img 
              src="https://i.postimg.cc/44pJ0vXw/logo.png" 
              alt="Windmar Logo" 
              className="h-20 md:h-28 w-auto object-contain transition-transform hover:scale-105 duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="h-20 w-px bg-slate-200 hidden md:block"></div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-windmar-dark tracking-tight leading-none">Windmar LEASE Pro ⚡</h1>
              <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Windmar Home • Asesoría Energética 🏠</p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-full border border-blue-100 shadow-sm hover:scale-105 transition-all">
              <MapPin className="w-4 h-4 text-windmar-blue" />
              <select 
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer"
              >
                {REGIONS.map(r => <option key={r.value} value={r.value}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{weather.temp}°C</span>
              </div>
              <div className="flex items-center gap-1.5 text-windmar-blue">
                <Zap className="w-4 h-4" />
                <span>{weather.efficiency}% Eficiencia</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Controls & Info */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 hover:shadow-premium transition-all duration-500">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-windmar-yellow/20 rounded-xl">
                  <Battery className="w-5 h-5 text-windmar-orange" />
                </div>
                <h2 className="font-black text-base text-windmar-dark">Configuración ⚙️</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Placas y Baterías 🔋</label>
                  <select 
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="w-full p-3.5 bg-white/40 border-2 border-blue-100 rounded-xl font-bold text-sm focus:border-windmar-blue focus:ring-0 transition-all outline-none hover:border-windmar-blue/30 shadow-inner"
                  >
                    <option value="">-- Elige una opción --</option>
                    <optgroup label="🔋 1x Tesla">
                      {Array.from({ length: 15 }, (_, i) => 10 + i).map(n => (
                        <option key={n} value={n.toString()}>{n} Placas (1x Tesla)</option>
                      ))}
                    </optgroup>
                    <optgroup label="🔋🔋 2x Tesla">
                      {Array.from({ length: 17 }, (_, i) => 22 + i).map(n => (
                        <option key={`${n}-2t`} value={`${n}-2t`}>{n} Placas (2x Tesla)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                
                <div className="pt-2">
                  <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-windmar-blue shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-900 font-medium leading-relaxed">
                      Garantía de 25 años y monitoreo inteligente 24/7 incluido. ✅
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {selectedData && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-windmar-dark rounded-3xl p-6 text-white shadow-2xl shadow-windmar-dark/30 overflow-hidden relative hover:shadow-premium transition-all duration-500"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-24 h-24" />
                </div>
                
                <h2 className="font-black text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-windmar-yellow" />
                  Análisis Windmar Home ✨
                </h2>
                
                <div className="flex items-center gap-3 mb-6">
                  <a 
                    href="https://www.enfin.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-windmar-blue text-white text-[10px] font-black rounded-xl hover:bg-windmar-dark transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    ENFIN 🔗
                  </a>
                  <a 
                    href="https://auth.palmetto.com/login?state=hKFo2SBuTUxPS1dpUE9DUmp5OFg3emtUanFQdEZIYU5sLTEwMKFupWxvZ2luo3RpZNkgYXBvT0Q1T3JkNGo1WEtGaVZQUjdZbFRPeFNkNzBJRlOjY2lk2SBjblhnUlhGRnl5VG5zYTF6UEtMeHRwS2NhUW5pNXYzeg&client=cnXgRXFFyyTnsa1zPKLxtpKcaQni5v3z&protocol=oauth2&scope=openid%20offline_access%20profile%20email&response_type=code&redirect_uri=https%3A%2F%2Fpalmetto.finance%2Fapi%2Fauth%2Ftoken-exchange&code_challenge=14Q3qGT8Nt4Ud4oifZSQWNmsumtywMV0sBrZ8lFtL8o&code_challenge_method=S256&audience=https%3A%2F%2Fsabal.palmetto.com%2Fapi&org=undefined" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-red-900 text-white text-[10px] font-black rounded-xl hover:bg-red-950 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    PALMETTO 🔗
                  </a>
                </div>
                
                <div className="space-y-4 relative z-10">
                  {!aiAdvice ? (
                    <button 
                      onClick={handleAiAdvice}
                      disabled={isAiLoading}
                      className="w-full py-3.5 bg-windmar-yellow hover:bg-windmar-orange text-windmar-dark font-black text-sm rounded-xl transition-all shadow-lg hover:shadow-windmar-orange/40 flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      {isAiLoading ? (
                        <div className="w-4 h-4 border-2 border-windmar-dark border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Generar Análisis 🤖
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs leading-relaxed text-slate-100 space-y-4"
                    >
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{aiAdvice}</Markdown>
                      </div>
                      <button 
                        onClick={() => setAiAdvice(null)}
                        className="text-[10px] font-black text-windmar-yellow hover:underline flex items-center gap-1"
                      >
                        <ArrowRight className="w-3 h-3 rotate-180" /> Volver a generar
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.section>
            )}
          </div>

          {/* Right Column: Dashboard & Charts */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {!selectedData ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-[32px] border-2 border-dashed border-slate-300 shadow-inner"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Sun className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-400">Selecciona una configuración ☀️</h3>
                  <p className="text-slate-400 mt-2 max-w-xs text-sm font-medium">Elige el número de placas para ver tu análisis personalizado.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Sistema', value: `${selectedData.size} W`, color: 'text-windmar-dark', emoji: '📏' },
                      { label: 'EPC Mín', value: selectedData.epc, color: 'text-windmar-orange', emoji: '💰' },
                      { label: 'Pago Fijo', value: `$${selectedData.fixedPrice}`, color: 'text-windmar-blue', emoji: '🔒' },
                      { label: 'Escalador', value: `$${selectedData.escalatorPrice}`, color: 'text-emerald-600', emoji: '📈' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center min-h-[100px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.emoji} {stat.label}</p>
                        <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* PDF Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setPdfModalAbierto(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56c4] hover:bg-[#1445a8] text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
                    >
                      <FileDown size={18} />
                      Descargar Cotización PDF
                    </button>
                  </div>

                  {/* Chart Section */}
                  <section className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-2xl hover:shadow-premium transition-all duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                      <div>
                        <h3 className="text-lg font-black text-windmar-dark">Proyección 25 Años 📊</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Fijo vs Escalador (2.99%)</p>
                      </div>
                      <div className="flex items-center gap-4 bg-white/40 p-2.5 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-windmar-blue shadow-sm"></div>
                          <span className="text-[10px] font-black text-slate-600">Fijo</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-windmar-orange shadow-sm"></div>
                          <span className="text-[10px] font-black text-slate-600">Escalador</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorFijo" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#004a99" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#004a99" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorEscalador" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f39c12" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f39c12" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="year" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                            interval={4}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                            labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px', fontSize: '12px' }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            align="right" 
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                          />
                          <Area type="monotone" name="Pago Fijo" dataKey="Pago Fijo" stroke="#004a99" strokeWidth={3} fillOpacity={1} fill="url(#colorFijo)" />
                          <Area type="monotone" name="Pago Escalador" dataKey="Pago Escalador" stroke="#f39c12" strokeWidth={3} fillOpacity={1} fill="url(#colorEscalador)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Informative Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl hover:shadow-premium transition-all duration-500 h-full flex flex-col">
                <h4 className="text-sm font-black text-windmar-dark mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-windmar-blue" />
                  Modelo LEASE 📘
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed flex-grow">
                  Energía limpia sin inversión inicial. El modelo Lease te permite disfrutar de todos los beneficios de la energía solar pagando únicamente por la energía que consumes, a un costo mucho menor que la red eléctrica tradicional. Colaboramos con <strong>ENFIN</strong> y <strong>Palmetto Lightreach</strong> para ofrecerte las mejores condiciones de financiamiento y arrendamiento en Puerto Rico, adaptadas a tu consumo real y presupuesto. 🇵🇷
                </p>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl hover:shadow-premium transition-all duration-500 h-full flex flex-col">
                <h4 className="text-sm font-black text-windmar-dark mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Garantías 🛡️
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed flex-grow">
                  Respaldo directo de fabricantes líderes a nivel mundial. Nuestro compromiso incluye una garantía integral de hasta 25 años que cubre paneles solares, inversores y componentes críticos del sistema. Además, incluimos monitoreo inteligente 24/7 para asegurar que tu sistema rinda al máximo potencial todos los días del año. Ahorro constante, seguro y sin preocupaciones para tu hogar. 🛡️
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 mt-20">
        <div className="bg-white rounded-[40px] p-12 border border-slate-200 text-center relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-windmar-blue via-windmar-yellow to-windmar-orange"></div>
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-2 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-windmar-blue" />
            </div>
            <h2 className="text-lg font-black text-windmar-dark">Juan S Rivera</h2>
            <p className="text-slate-500 font-medium">Asesor de Soluciones Energéticas • Windmar Home</p>
            
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              <a href="tel:7873957766" className="flex items-center gap-2 text-windmar-blue font-bold hover:underline">
                787-395-7766 Ext. 454
              </a>
              <a href="mailto:juan.s@windmarhome.com" className="flex items-center gap-2 text-windmar-blue font-bold hover:underline">
                juan.s@windmarhome.com
              </a>
            </div>
            
            <p className="text-lg font-medium text-slate-600 mt-8 italic">
              "¡Hagamos que tu techo pague tu factura!" 🏠🔋
            </p>
          </div>
        </div>
      </footer>

        <PDFModal
          isOpen={pdfModalAbierto}
          onClose={() => setPdfModalAbierto(false)}
          tipo="lease"
          resumen={resumenParaModal}
          onGenerate={handleGenerateLeasePDF}
        />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
