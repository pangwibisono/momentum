import React, { useState, useId } from 'react';
import { TargetVariable, ObjectVisualType } from '../types/physics';
import { MathView, LatexText } from './MathView';
import { 
  Calculator, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  Layers, 
  ShieldAlert, 
  Send, 
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

interface MomentumCalculatorProps {
  isPresentationMode: boolean;
  onSendToSimulation: (mass: number, velocity: number, objectType?: ObjectVisualType) => void;
}

export const MomentumCalculator: React.FC<MomentumCalculatorProps> = ({
  isPresentationMode,
  onSendToSimulation,
}) => {
  const pInputId = useId();
  const mInputId = useId();
  const vInputId = useId();
  const [activeSubTab, setActiveSubTab] = useState<'momentum' | 'impulse'>('momentum');

  // Momentum State
  const [targetVar, setTargetVar] = useState<TargetVariable>('p');
  const [mass, setMass] = useState<number>(5); // kg
  const [velocity, setVelocity] = useState<number>(10); // m/s
  const [momentum, setMomentum] = useState<number>(50); // kg m/s
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = kanan (+), -1 = kiri (-)
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectVisualType>('cart');

  // Impulse State
  const [impulseMass, setImpulseMass] = useState<number>(1000); // 1000 kg car
  const [initialVel, setInitialVel] = useState<number>(20); // 20 m/s
  const [finalVel, setFinalVel] = useState<number>(0); // 0 m/s (stopped)
  const [contactTime, setContactTime] = useState<number>(0.1); // 0.1s airbag vs 0.01s solid wall

  // Real-world Presets for quick microteaching demos
  const presets: { label: string; m: number; v: number; objectType: ObjectVisualType }[] = [
    { label: '⚽ Bola Sepak', m: 0.45, v: 20, objectType: 'ball' },
    { label: '🏃 Pelari Cepat', m: 70, v: 9, objectType: 'runner' },
    { label: '🚗 Mobil Sedan', m: 1200, v: 15, objectType: 'car' },
    { label: '🚛 Truk Gandeng', m: 15000, v: 10, objectType: 'truck' },
    { label: '🔫 Peluru Cepat', m: 0.01, v: 500, objectType: 'bullet' },
  ];

  // Calculate values based on target variable
  let calculatedP = 0;
  let calculatedM = 0;
  let calculatedV = 0;
  let mathError = '';

  const effectiveV = velocity * direction;

  if (targetVar === 'p') {
    calculatedP = mass * effectiveV;
  } else if (targetVar === 'm') {
    if (velocity === 0) {
      mathError = 'Kecepatan tidak boleh 0 m/s untuk mencari massa (pembagian dengan nol).';
    } else {
      calculatedM = Math.abs(momentum / (velocity * direction));
    }
  } else if (targetVar === 'v') {
    if (mass <= 0) {
      mathError = 'Massa harus lebih besar dari 0 kg.';
    } else {
      calculatedV = momentum / mass;
    }
  }

  // Handle Preset selection
  const applyPreset = (mVal: number, vVal: number, objType: ObjectVisualType) => {
    setMass(mVal);
    setVelocity(vVal);
    setMomentum(mVal * vVal);
    setDirection(1);
    setSelectedObjectType(objType);
  };

  const handleSelectObjectType = (objType: ObjectVisualType) => {
    setSelectedObjectType(objType);
    if (objType === 'ball') {
      setMass(0.45);
      setVelocity(20);
      setMomentum(0.45 * 20);
    } else if (objType === 'runner') {
      setMass(70);
      setVelocity(9);
      setMomentum(70 * 9);
    } else if (objType === 'car') {
      setMass(1200);
      setVelocity(15);
      setMomentum(1200 * 15);
    } else if (objType === 'truck') {
      setMass(15000);
      setVelocity(10);
      setMomentum(15000 * 10);
    } else if (objType === 'bullet') {
      setMass(0.01);
      setVelocity(500);
      setMomentum(0.01 * 500);
    } else if (objType === 'cart') {
      setMass(2);
      setVelocity(5);
      setMomentum(2 * 5);
    }
  };

  // Impulse math
  const deltaV = finalVel - initialVel;
  const deltaP = impulseMass * deltaV; // kg m/s
  const safeTime = contactTime > 0 ? contactTime : 0.001;
  const averageForce = deltaP / safeTime; // N

  // Data Variation Table Generator (5 rows)
  const [variationParam, setVariationParam] = useState<'v' | 'm'>('v');
  const baseMass = targetVar === 'm' ? calculatedM : mass;
  const baseVel = targetVar === 'v' ? Math.abs(calculatedV) : velocity;

  const tableRows = [1, 2, 3, 4, 5].map((multiplier) => {
    if (variationParam === 'v') {
      const vStep = baseVel * (multiplier * 0.5);
      const pResult = baseMass * vStep;
      return {
        step: multiplier,
        m: baseMass,
        v: vStep,
        p: pResult,
        ek: 0.5 * baseMass * vStep * vStep,
      };
    } else {
      const mStep = baseMass * (multiplier * 0.5);
      const pResult = mStep * baseVel;
      return {
        step: multiplier,
        m: mStep,
        v: baseVel,
        p: pResult,
        ek: 0.5 * mStep * baseVel * baseVel,
      };
    }
  });

  const maxP = Math.max(...tableRows.map((r) => r.p), 1);

  return (
    <div className={`space-y-6 ${isPresentationMode ? 'text-base' : 'text-sm'}`}>
      {/* Top Segmented Sub-tab: Momentum vs Impulse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('momentum')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'momentum'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>1. Kalkulator Momentum</span>
            <span className="font-mono text-xs opacity-90">(<MathView math="p = m \cdot v" />)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('impulse')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'impulse'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>2. Teorema Impuls</span>
            <span className="font-mono text-xs opacity-90">(<MathView math="I = F \cdot \Delta t = \Delta p" />)</span>
          </button>
        </div>

        {/* Quick Presets Badge Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap pl-1">
            Contoh Riil:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.m, preset.v, preset.objectType)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap border ${
                selectedObjectType === preset.objectType
                  ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                  : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'momentum' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Input Configuration (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Target Variable Selector */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                  Pilih Besaran yang Ingin Dicari
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTargetVar('p')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      targetVar === 'p'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-sm font-bold flex items-center justify-center gap-1">
                      <span>Momentum</span>
                      <MathView math="p" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">kg·m/s</div>
                  </button>

                  <button
                    onClick={() => setTargetVar('m')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      targetVar === 'm'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-sm font-bold flex items-center justify-center gap-1">
                      <span>Massa</span>
                      <MathView math="m" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">kilogram (kg)</div>
                  </button>

                  <button
                    onClick={() => setTargetVar('v')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      targetVar === 'v'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="text-sm font-bold flex items-center justify-center gap-1">
                      <span>Kecepatan</span>
                      <MathView math="v" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">meter/detik (m/s)</div>
                  </button>
                </div>
              </div>

              {/* Dynamic Input Fields */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                {/* Field: Massa (m) */}
                {targetVar !== 'm' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor={mInputId} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>Massa Benda</span>
                        <span className="text-indigo-600 font-bold">(<MathView math="m" />)</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {mass} kg
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={mass}
                        onChange={(e) => setMass(parseFloat(e.target.value) || 0.1)}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <input
                        id={mInputId}
                        type="number"
                        min="0.01"
                        step="0.5"
                        value={mass}
                        onChange={(e) => setMass(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg text-right font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Field: Kecepatan (v) */}
                {targetVar !== 'v' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor={vInputId} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>Kelajuan Benda</span>
                        <span className="text-indigo-600 font-bold">(<MathView math="v" />)</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {velocity} m/s
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={velocity}
                        onChange={(e) => setVelocity(parseFloat(e.target.value) || 0)}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <input
                        id={vInputId}
                        type="number"
                        min="0"
                        step="1"
                        value={velocity}
                        onChange={(e) => setVelocity(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg text-right font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Vektor Arah Gerak */}
                    <div className="mt-2.5 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-600 font-medium">Arah Vektor Gerak:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDirection(1)}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                            direction === 1
                              ? 'bg-emerald-600 text-white shadow-xs font-bold'
                              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          → Ke Kanan (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirection(-1)}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                            direction === -1
                              ? 'bg-rose-600 text-white shadow-xs font-bold'
                              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          ← Ke Kiri (-)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Field: Momentum (p) - Only when searching m or v */}
                {targetVar !== 'p' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor={pInputId} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>Besar Momentum</span>
                        <span className="text-indigo-600 font-bold">(<MathView math="p" />)</span>
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {momentum} kg·m/s
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="500"
                        step="1"
                        value={momentum}
                        onChange={(e) => setMomentum(parseFloat(e.target.value) || 1)}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <input
                        id={pInputId}
                        type="number"
                        min="0"
                        step="5"
                        value={momentum}
                        onChange={(e) => setMomentum(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg text-right font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
                {/* Visual Object Representation Selector */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">
                      Bentuk Objek di Simulasi:
                    </label>
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {selectedObjectType === 'ball' && '⚽ Bola Sepak'}
                      {selectedObjectType === 'runner' && '🏃 Pelari Cepat'}
                      {selectedObjectType === 'car' && '🚗 Mobil Sedan'}
                      {selectedObjectType === 'truck' && '🚛 Truk Gandeng'}
                      {selectedObjectType === 'bullet' && '🔫 Peluru Cepat'}
                      {selectedObjectType === 'cart' && '🛒 Troli Lab'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'ball', label: '⚽ Bola' },
                      { id: 'runner', label: '🏃 Pelari' },
                      { id: 'car', label: '🚗 Mobil' },
                      { id: 'truck', label: '🚛 Truk' },
                      { id: 'bullet', label: '🔫 Peluru' },
                      { id: 'cart', label: '🛒 Troli' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectObjectType(item.id as ObjectVisualType)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                          selectedObjectType === item.id
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-500 shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error safety alert */}
              {mathError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{mathError}</span>
                </div>
              )}

              {/* Action Button: Send to Canvas Simulation */}
              <button
                onClick={() => {
                  const mVal = targetVar === 'm' ? calculatedM : mass;
                  const vVal = (targetVar === 'v' ? calculatedV : velocity) * direction;
                  onSendToSimulation(mVal, vVal, selectedObjectType);
                }}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Uji Nilai Ini di Simulasi Visual 2D →</span>
              </button>
            </div>

            {/* Quick Microteaching Formula Card */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>RUMUS DASAR FISIKA (LATEX)</span>
                <span className="text-emerald-400">SI: kg·m/s</span>
              </div>
              <div className="text-center py-2 bg-slate-800/80 rounded-xl font-bold tracking-wider text-amber-300">
                <MathView block math="\vec{p} = m \cdot \vec{v}" className="text-amber-300 text-xl sm:text-2xl font-bold" />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <span className="text-amber-400 font-semibold">Catatan Pengajar:</span> Momentum berbanding lurus dengan massa (<MathView math="m" />) dan kecepatan (<MathView math="\vec{v}" />). Karena <MathView math="\vec{v}" /> adalah vektor, arah momentum (<MathView math="\vec{p}" />) selalu searah dengan arah vektor kecepatan.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Step-by-Step Whiteboard Resolution (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Step-by-step Whiteboard Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Langkah Penyelesaian Ringkas (Format Demonstrasi Mengajar)
                  </h3>
                </div>
                <span className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Target: {targetVar.toUpperCase()}
                </span>
              </div>

              {/* Step 1: Diketahui */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  1. Diketahui (Given):
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 font-mono text-xs sm:text-sm text-slate-800 space-y-1">
                  <div className="text-indigo-800 font-sans font-semibold">
                    • Objek Terpilih: {selectedObjectType === 'ball' ? '⚽ Bola Sepak' : selectedObjectType === 'runner' ? '🏃 Pelari Cepat' : selectedObjectType === 'car' ? '🚗 Mobil Sedan' : selectedObjectType === 'truck' ? '🚛 Truk Gandeng' : selectedObjectType === 'bullet' ? '🔫 Peluru Cepat' : '🛒 Troli Lab'}
                  </div>
                  {targetVar === 'p' && (
                    <>
                      <div>• Massa (<MathView math="m" />) = {mass} kg</div>
                      <div>
                        • Kecepatan (<MathView math="\vec{v}" />) = {effectiveV} m/s ({direction === 1 ? 'ke kanan / sumbu +X' : 'ke kiri / sumbu -X'})
                      </div>
                    </>
                  )}
                  {targetVar === 'm' && (
                    <>
                      <div>• Momentum (<MathView math="p" />) = {momentum} kg·m/s</div>
                      <div>• Kecepatan (<MathView math="v" />) = {velocity * direction} m/s</div>
                    </>
                  )}
                  {targetVar === 'v' && (
                    <>
                      <div>• Momentum (<MathView math="p" />) = {momentum} kg·m/s</div>
                      <div>• Massa (<MathView math="m" />) = {mass} kg</div>
                    </>
                  )}
                </div>
              </div>

              {/* Step 2: Ditanya */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  2. Ditanyakan:
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-800">
                  {targetVar === 'p' && (
                    <span>Besar dan arah momentum benda (<MathView math="\vec{p}" />) = ... ?</span>
                  )}
                  {targetVar === 'm' && (
                    <span>Massa benda (<MathView math="m" />) = ... ?</span>
                  )}
                  {targetVar === 'v' && (
                    <span>Kecepatan gerak benda (<MathView math="\vec{v}" />) = ... ?</span>
                  )}
                </div>
              </div>

              {/* Step 3: Rumus yang Digunakan */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  3. Rumus Fisika & Aljabar (LaTeX):
                </div>
                <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 text-xs sm:text-sm text-indigo-950 space-y-1">
                  {targetVar === 'p' && (
                    <>
                      <MathView block math="p = m \cdot v" />
                      <div className="text-xs text-indigo-700 text-center">Momentum = Massa × Kecepatan</div>
                    </>
                  )}
                  {targetVar === 'm' && (
                    <>
                      <MathView block math="p = m \cdot v \implies m = \frac{p}{v}" />
                      <div className="text-xs text-indigo-700 text-center">Massa = Momentum ÷ Kecepatan</div>
                    </>
                  )}
                  {targetVar === 'v' && (
                    <>
                      <MathView block math="p = m \cdot v \implies v = \frac{p}{m}" />
                      <div className="text-xs text-indigo-700 text-center">Kecepatan = Momentum ÷ Massa</div>
                    </>
                  )}
                </div>
              </div>

              {/* Step 4: Substitusi & Perhitungan */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  4. Substitusi Nilai (Formula Solusi LaTeX):
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-800 space-y-1">
                  {targetVar === 'p' && (
                    <MathView
                      block
                      math={`p = (${mass}\\text{ kg}) \\cdot (${effectiveV}\\text{ m/s}) = ${calculatedP.toFixed(2)}\\text{ kg}\\cdot\\text{m/s}`}
                    />
                  )}
                  {targetVar === 'm' && (
                    <MathView
                      block
                      math={`m = \\frac{${momentum}\\text{ kg}\\cdot\\text{m/s}}{${Math.abs(velocity * direction)}\\text{ m/s}} = ${calculatedM.toFixed(2)}\\text{ kg}`}
                    />
                  )}
                  {targetVar === 'v' && (
                    <MathView
                      block
                      math={`v = \\frac{${momentum}\\text{ kg}\\cdot\\text{m/s}}{${mass}\\text{ kg}} = ${calculatedV.toFixed(2)}\\text{ m/s}`}
                    />
                  )}
                </div>
              </div>

              {/* Step 5: Kesimpulan Hasil Akhir */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    5. Hasil Akhir & Makna Fisis:
                  </div>
                  <div className="text-base sm:text-lg font-bold font-mono text-emerald-950">
                    {targetVar === 'p' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <MathView math={`p = ${calculatedP.toFixed(2)}\\text{ kg}\\cdot\\text{m/s}`} />
                        <span className="text-xs font-normal text-emerald-800">
                          ({calculatedP >= 0 ? 'Bergerak ke Kanan / Positif' : 'Bergerak ke Kiri / Negatif'})
                        </span>
                      </div>
                    )}
                    {targetVar === 'm' && (
                      <MathView math={`m = ${calculatedM.toFixed(2)}\\text{ kg}`} />
                    )}
                    {targetVar === 'v' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <MathView math={`v = ${calculatedV.toFixed(2)}\\text{ m/s}`} />
                        <span className="text-xs font-normal text-emerald-800">
                          ({calculatedV >= 0 ? 'Ke Kanan / Positif' : 'Ke Kiri / Negatif'})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-emerald-800 leading-relaxed pt-1">
                    Energi Kinetik objek:{' '}
                    <MathView
                      math={`E_k = \\frac{1}{2} m v^2 = ${
                        targetVar === 'p'
                          ? (0.5 * mass * effectiveV * effectiveV).toFixed(1)
                          : targetVar === 'm'
                          ? (0.5 * calculatedM * velocity * velocity).toFixed(1)
                          : (0.5 * mass * calculatedV * calculatedV).toFixed(1)
                      }\\text{ Joule (J)}`}
                    />
                    . Perhatikan bahwa momentum dapat bernilai negatif (vektor), sedangkan energi kinetik selalu positif (skalar).
                  </div>
                </div>
              </div>
            </div>

            {/* Generator Variasi Data & Grafik Proposionalitas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                    <span>Tabel Generator Data: Membuktikan Hubungan Linear</span>
                    <span className="text-indigo-700 font-mono">(<MathView math="p \propto v" /> atau <MathView math="p \propto m" />)</span>
                  </h4>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-500 font-medium">Variasikan:</span>
                  <button
                    onClick={() => setVariationParam('v')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                      variationParam === 'v'
                        ? 'bg-indigo-100 text-indigo-800 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Kecepatan</span>
                    <MathView math="v" />
                  </button>
                  <button
                    onClick={() => setVariationParam('m')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                      variationParam === 'm'
                        ? 'bg-indigo-100 text-indigo-800 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Massa</span>
                    <MathView math="m" />
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="py-2 px-3">No</th>
                      <th className="py-2 px-3">Massa (<MathView math="m" />)</th>
                      <th className="py-2 px-3">Kecepatan (<MathView math="v" />)</th>
                      <th className="py-2 px-3">Momentum (<MathView math="p = m \cdot v" />)</th>
                      <th className="py-2 px-3">Energi (<MathView math="E_k = \frac{1}{2}mv^2" />)</th>
                      <th className="py-2 px-3">Visual Proporsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableRows.map((row) => {
                      const barPercent = Math.min(100, Math.round((row.p / maxP) * 100));
                      return (
                        <tr key={row.step} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 font-semibold text-slate-400">{row.step}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{row.m.toFixed(1)} kg</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{row.v.toFixed(1)} m/s</td>
                          <td className="py-2 px-3 font-bold text-indigo-700">{row.p.toFixed(1)} kg·m/s</td>
                          <td className="py-2 px-3 font-medium text-emerald-700">{row.ek.toFixed(1)} J</td>
                          <td className="py-2 px-3 w-36">
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${barPercent}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                *Tabel ini sangat ideal untuk memandu siswa membuat grafik hubungan linear p terhadap v atau m saat sesi microteaching.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* SUB-TAB 2: IMPULSE & CONTACT TIME DEMO */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Simulasi Teorema Impuls-Momentum
                </h3>
                <div className="text-xs text-indigo-700 font-mono mt-0.5">
                  <MathView math="I = \Delta p = F \cdot \Delta t" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <span>Massa Benda</span>
                    <span className="text-indigo-600 font-bold">(<MathView math="m" />)</span>:
                  </span>
                  <span className="font-mono text-indigo-600 font-bold">{impulseMass} kg</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="50"
                  value={impulseMass}
                  onChange={(e) => setImpulseMass(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <span>Kecepatan Awal</span>
                      <span className="text-indigo-600 font-bold">(<MathView math="v_0" />)</span>:
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">{initialVel} m/s</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={initialVel}
                    onChange={(e) => setInitialVel(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <span>Kecepatan Akhir</span>
                      <span className="text-indigo-600 font-bold">(<MathView math="v_t" />)</span>:
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">{finalVel} m/s</span>
                  </label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={finalVel}
                    onChange={(e) => setFinalVel(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Contact Time Slider (Crucial Pedagogical Insight) */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <span>Waktu Sentuh Kontak</span>
                    <span className="text-amber-800 font-bold">(<MathView math="\Delta t" />)</span>:
                  </label>
                  <span className="font-mono text-xs font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded">
                    {contactTime} detik
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1.0"
                  step="0.01"
                  value={contactTime}
                  onChange={(e) => setContactTime(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-amber-800">
                  <span>0.01s (Tembok Beton Keras)</span>
                  <span>0.15s (Airbag Mobil)</span>
                  <span>0.8s (Matras Busa Tebal)</span>
                </div>
              </div>

              {/* Real life scenario buttons */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 font-medium">Bandingkan Skenario Nyata:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setContactTime(0.01);
                      setInitialVel(20);
                      setFinalVel(0);
                    }}
                    className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-800 text-left transition-colors"
                  >
                    <div className="font-bold">❌ Tabrak Tembok Keras</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MathView math="\Delta t = 0{,}01\text{ s}" /> (Gaya Dahsyat)
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setContactTime(0.25);
                      setInitialVel(20);
                      setFinalVel(0);
                    }}
                    className="p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-left transition-colors"
                  >
                    <div className="font-bold">✅ Bumper & Airbag</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MathView math="\Delta t = 0{,}25\text{ s}" /> (Gaya Terdistribusi)
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
              Analisis Perhitungan Impuls & Gaya Benturan Rata-rata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <span>Perubahan Momentum</span>
                  <span className="text-indigo-600 font-bold">(<MathView math="\Delta p" />)</span>:
                </span>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {deltaP.toLocaleString()} kg·m/s
                </div>
                <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                  <MathView
                    block
                    math={`\\Delta p = m(v_t - v_0) = ${impulseMass} \\cdot (${finalVel} - ${initialVel}) = ${deltaP.toLocaleString()}\\text{ kg}\\cdot\\text{m/s}`}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 ${
                Math.abs(averageForce) > 200000 
                  ? 'bg-rose-50 border-rose-200 text-rose-950' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <span className="text-xs font-semibold uppercase opacity-80 flex items-center gap-1">
                  <span>Gaya Benturan Rata-rata</span>
                  <span className="font-bold">(<MathView math="F" />)</span>:
                </span>
                <div className="text-xl font-bold font-mono">
                  {Math.abs(averageForce).toLocaleString(undefined, { maximumFractionDigits: 0 })} Newton (N)
                </div>
                <div className="text-xs bg-white/80 p-2 rounded-lg border border-current/20">
                  <MathView
                    block
                    math={`F = \\frac{\\Delta p}{\\Delta t} = \\frac{${deltaP.toLocaleString()}\\text{ kg}\\cdot\\text{m/s}}{${contactTime}\\text{ s}} = ${Math.round(averageForce).toLocaleString()}\\text{ N}`}
                  />
                </div>
              </div>
            </div>

            {/* Teaching Insight Box */}
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Pesan Kunci untuk Guru (Konsep Microteaching):</span>
              </div>
              <p className="text-xs leading-relaxed text-indigo-800">
                Perubahan momentum (<MathView math="\Delta p" />) pengemudi mobil dari kecepatan 20 m/s hingga berhenti bernilai konstan, tak peduli ia menabrak tembok keras atau airbag. Namun, dengan memperpanjang durasi perlambatan (<MathView math="\Delta t" />) menggunakan airbag atau zona remuk mobil (<i>crumple zone</i>), gaya impulsif impak (<MathView math="F = \frac{\Delta p}{\Delta t}" />) yang dialami penumpang dapat diturunkan secara drastis!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
