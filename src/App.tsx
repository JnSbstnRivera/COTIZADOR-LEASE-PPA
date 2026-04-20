import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Moon,
  Battery,
  TrendingUp,
  ShieldCheck,
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

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-windmar-dark flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Energy Rings */}
      {[1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-windmar-yellow/20"
          style={{ width: `${i * 160}px`, height: `${i * 160}px` }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}

      {/* Floating orange dots */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-windmar-yellow/40"
          style={{
            left: `${10 + (i * 12)}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{ y: [-8, 8, -8], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Sun Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-windmar-yellow blur-3xl opacity-30 animate-pulse" />
          <div className="p-6 bg-white/10 rounded-full border border-windmar-yellow/30 backdrop-blur-sm relative text-windmar-yellow">
            <Sun className="w-16 h-16 animate-spin-slow" />
          </div>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-6"
        >
          <img
            src="https://i.postimg.cc/44pJ0vXw/logo.png"
            alt="Windmar Logo"
            className="h-52 md:h-56 w-auto max-w-xs drop-shadow-md"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Title */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, letterSpacing: "0.5em" }}
            animate={{ opacity: 1, letterSpacing: "0.15em" }}
            transition={{ delay: 1, duration: 1 }}
            className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest mb-2"
          >
            COTIZADOR WINDMAR LEASE PPA
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
            className="text-windmar-yellow/80 font-bold text-sm tracking-[0.3em] uppercase"
          >
            Energía Solar para tu Hogar · Puerto Rico
          </motion.p>
        </div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5, duration: 0.5 }}
          className="mt-12 flex items-center gap-3 px-6 py-3 bg-white/10 rounded-2xl border border-windmar-yellow/20 shadow-sm"
        >
          <FileText className="w-5 h-5 text-windmar-yellow" />
          <span className="text-white/70 text-xs font-bold tracking-widest uppercase">Contrato de Arrendamiento Seguro</span>
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
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [pdfModalAbierto, setPdfModalAbierto] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('wh-theme');
      return saved === 'dark';
    } catch (e) { return false; }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      try { localStorage.setItem('wh-theme', 'dark'); } catch (e) {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('wh-theme', 'light'); } catch (e) {}
    }
  }, [isDarkMode]);

  const selectedData = useMemo(() => SOLAR_DATA[selectedKey] || null, [selectedKey]);

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
    sistemaKW: selectedData ? Number((parseFloat(selectedData.size.replace(/,/g, '')) / 1000).toFixed(2)) : 0,
    pagoFijo: selectedData?.fixedPrice ?? 0,
    pagoEscalador: selectedData?.escalatorPrice ?? 0,
  };

  const resumenParaModal: Record<string, string> = {
    'Paneles': leaseResumen.paneles,
    'Baterías': leaseResumen.baterias,
    'Tamaño del Sistema': `${leaseResumen.sistemaKW} KW`,
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
          <header className="bg-white dark:bg-[#161b22] border-b border-slate-200 dark:border-white/[0.08] sticky top-0 z-50 shadow-lg dark:shadow-black/30">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-6">
                <img
                  src="https://i.postimg.cc/44pJ0vXw/logo.png"
                  alt="Windmar Logo"
                  className="h-12 md:h-14 w-auto object-contain transition-transform hover:scale-105 duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="h-10 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-windmar-dark dark:text-[#e8eaed] tracking-tight leading-none">COTIZADOR WINDMAR LEASE PPA ⚡</h1>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-[#6b7280] uppercase tracking-[0.2em] mt-0.5">Windmar Home · Asesoría Energética 🏠</p>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1a1d25] backdrop-blur-md p-1 pr-3 rounded-full border border-slate-200 dark:border-white/[0.08] shadow-sm">
                <motion.button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  animate={{ rotate: isDarkMode ? 360 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className={`p-1.5 rounded-full transition-colors duration-500 ${
                    isDarkMode
                      ? 'bg-windmar-yellow text-windmar-dark shadow-[0_0_10px_rgba(241,196,15,0.3)]'
                      : 'bg-windmar-blue text-white shadow-[0_0_10px_rgba(0,74,153,0.2)]'
                  }`}
                >
                  {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                </motion.button>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[8px] font-black text-slate-400 dark:text-[#6b7280] uppercase tracking-tighter">Tema</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-windmar-yellow' : 'text-windmar-blue'}`}>
                    {isDarkMode ? 'Oscuro' : 'Claro'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Controls & Info */}
              <div className="lg:col-span-4 space-y-6">
                <section className="bg-white dark:bg-[#161b22] rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-white/[0.08] hover:shadow-premium transition-all duration-500">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-windmar-yellow/20 rounded-xl">
                      <Battery className="w-5 h-5 text-windmar-orange" />
                    </div>
                    <h2 className="font-black text-base text-windmar-dark dark:text-[#e8eaed]">Configuración ⚙️</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-[#6b7280] uppercase tracking-widest">Placas y Baterías 🔋</label>
                      <select
                        value={selectedKey}
                        onChange={(e) => setSelectedKey(e.target.value)}
                        className="w-full p-3.5 bg-white dark:bg-[#0f1215] border-2 border-blue-100 dark:border-white/[0.08] rounded-xl font-bold text-sm text-windmar-dark dark:text-[#e8eaed] focus:border-windmar-blue focus:ring-0 transition-all outline-none hover:border-windmar-blue/30 shadow-inner appearance-none cursor-pointer"
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
                      <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm">
                        <ShieldCheck className="w-5 h-5 text-windmar-blue shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-900 dark:text-blue-300 font-medium leading-relaxed">
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
                      className="h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#161b22] rounded-[32px] border-2 border-dashed border-slate-300 dark:border-white/[0.08] shadow-inner"
                    >
                      <div className="w-16 h-16 bg-slate-100 dark:bg-[#0f1215] rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <Sun className="w-8 h-8 text-slate-300 dark:text-[#6b7280]" />
                      </div>
                      <h3 className="text-xl font-black text-slate-400 dark:text-[#6b7280]">Selecciona una configuración ☀️</h3>
                      <p className="text-slate-400 dark:text-[#6b7280] mt-2 max-w-xs text-sm font-medium">Elige el número de placas para ver tu análisis personalizado.</p>
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
                          { label: 'Sistema', value: `${selectedData.size} W`, color: 'text-windmar-dark dark:text-[#e8eaed]', emoji: '📏' },
                          { label: 'EPC Mín', value: selectedData.epc, color: 'text-windmar-orange', emoji: '💰' },
                          { label: 'Pago Fijo', value: `$${selectedData.fixedPrice}`, color: 'text-windmar-blue dark:text-blue-400', emoji: '🔒' },
                          { label: 'Escalador', value: `$${selectedData.escalatorPrice}`, color: 'text-emerald-600 dark:text-emerald-400', emoji: '📈' }
                        ].map((stat, i) => (
                          <div key={i} className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xl hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center min-h-[100px]">
                            <p className="text-[10px] font-black text-slate-400 dark:text-[#6b7280] uppercase tracking-widest mb-1">{stat.emoji} {stat.label}</p>
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
                      <section className="bg-white dark:bg-[#161b22] p-6 rounded-[32px] border border-slate-200 dark:border-white/[0.08] shadow-2xl hover:shadow-premium transition-all duration-500">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                          <div>
                            <h3 className="text-lg font-black text-windmar-dark dark:text-[#e8eaed]">Proyección 25 Años 📊</h3>
                            <p className="text-xs text-slate-500 dark:text-[#a0a4ad] font-medium mt-0.5">Fijo vs Escalador (2.99%)</p>
                          </div>
                          <div className="flex items-center gap-4 bg-white/40 dark:bg-[#0f1215]/60 p-2.5 rounded-xl border border-blue-100 dark:border-white/[0.08]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-windmar-blue shadow-sm"></div>
                              <span className="text-[10px] font-black text-slate-600 dark:text-[#a0a4ad]">Fijo</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-windmar-orange shadow-sm"></div>
                              <span className="text-[10px] font-black text-slate-600 dark:text-[#a0a4ad]">Escalador</span>
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
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e2530' : '#f1f5f9'} />
                              <XAxis
                                dataKey="year"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: isDarkMode ? '#6b7280' : '#94a3b8' }}
                                interval={4}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: isDarkMode ? '#6b7280' : '#94a3b8' }}
                                tickFormatter={(value) => `$${value}`}
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: '16px',
                                  border: 'none',
                                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                  padding: '12px',
                                  backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
                                  color: isDarkMode ? '#e8eaed' : '#1e293b'
                                }}
                                itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                                labelStyle={{ fontWeight: 800, color: isDarkMode ? '#e8eaed' : '#1e293b', marginBottom: '4px', fontSize: '12px' }}
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
                  <div className="bg-white dark:bg-[#161b22] p-8 rounded-[32px] border border-slate-200 dark:border-white/[0.08] shadow-xl hover:shadow-premium transition-all duration-500 h-full flex flex-col">
                    <h4 className="text-sm font-black text-windmar-dark dark:text-[#e8eaed] mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4 text-windmar-blue" />
                      Modelo LEASE 📘
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-[#a0a4ad] font-medium leading-relaxed flex-grow">
                      Energía limpia sin inversión inicial. El modelo Lease te permite disfrutar de todos los beneficios de la energía solar pagando únicamente por la energía que consumes, a un costo mucho menor que la red eléctrica tradicional. Colaboramos con <strong>ENFIN</strong> y <strong>Palmetto Lightreach</strong> para ofrecerte las mejores condiciones de financiamiento y arrendamiento en Puerto Rico, adaptadas a tu consumo real y presupuesto. 🇵🇷
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#161b22] p-8 rounded-[32px] border border-slate-200 dark:border-white/[0.08] shadow-xl hover:shadow-premium transition-all duration-500 h-full flex flex-col">
                    <h4 className="text-sm font-black text-windmar-dark dark:text-[#e8eaed] mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Garantías 🛡️
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-[#a0a4ad] font-medium leading-relaxed flex-grow">
                      Respaldo directo de fabricantes líderes a nivel mundial. Nuestro compromiso incluye una garantía integral de hasta 25 años que cubre paneles solares, inversores y componentes críticos del sistema. Además, incluimos monitoreo inteligente 24/7 para asegurar que tu sistema rinda al máximo potencial todos los días del año. Ahorro constante, seguro y sin preocupaciones para tu hogar. 🛡️
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="max-w-7xl mx-auto px-4 mt-20">
            <div className="bg-white dark:bg-[#161b22] rounded-[40px] p-12 border border-slate-200 dark:border-white/[0.08] text-center relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-windmar-blue via-windmar-yellow to-windmar-orange"></div>

              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-[#0f1215] rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <ShieldCheck className="w-8 h-8 text-windmar-blue" />
                </div>
                <h2 className="text-lg font-black text-windmar-dark dark:text-[#e8eaed]">Grupo de Análisis y Desarrollo</h2>
                <p className="text-slate-500 dark:text-[#a0a4ad] font-medium">Call Center · Windmar Home</p>

                <p className="text-lg font-medium text-slate-600 dark:text-[#a0a4ad] mt-8 italic">
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
