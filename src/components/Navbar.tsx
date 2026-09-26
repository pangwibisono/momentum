import React from 'react';
import { 
  Calculator, 
  Activity, 
  CheckCircle2, 
  BookOpen, 
  Download, 
  Monitor, 
  Sparkles 
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'calculator' | 'simulation' | 'quiz';
  setActiveTab: (tab: 'calculator' | 'simulation' | 'quiz') => void;
  isPresentationMode: boolean;
  setIsPresentationMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenTeachingGuide: () => void;
  onOpenExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isPresentationMode,
  setIsPresentationMode,
  onOpenTeachingGuide,
  onOpenExportModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Subject Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 font-bold text-lg">
              <span className="font-mono tracking-tighter">p=mv</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  FisikaLab
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Microteaching
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Momentum, Impuls & Hukum Kekekalan Tumbukan
              </p>
            </div>
          </div>

          {/* Navigation Segmented Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'calculator'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Kalkulator & Rumus</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'simulation'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Simulasi Visual 2D</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'quiz'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kuis & Studi Kasus</span>
            </button>
          </nav>

          {/* Teacher Tool Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPresentationMode((prev) => !prev)}
              title="Toggle Mode Proyektor (Font & Kontras Tinggi untuk Layar Kelas)"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isPresentationMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{isPresentationMode ? 'Mode Proyektor: ON' : 'Mode Proyektor'}</span>
            </button>

            <button
              onClick={onOpenTeachingGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200 transition-colors"
              title="Panduan Guru & Miskonsepsi Siswa"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panduan Guru</span>
            </button>

            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              title="Unduh 1 File HTML Utuh untuk Offline"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh File HTML</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
