/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { MomentumCalculator } from './components/MomentumCalculator';
import { PhysicsSimulationCanvas } from './components/PhysicsSimulationCanvas';
import { InteractiveQuiz } from './components/InteractiveQuiz';
import { TeachingGuideModal } from './components/TeachingGuideModal';
import { ExportHtmlModal } from './components/ExportHtmlModal';
import { BookOpen, Sparkles, Layers, Download } from 'lucide-react';
import { ObjectVisualType } from './types/physics';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'simulation' | 'quiz'>('calculator');
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isTeachingGuideOpen, setIsTeachingGuideOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Cross-component communication: send mass, velocity, and object type from Calculator into Simulation
  const [forwardedMass, setForwardedMass] = useState<number | undefined>(undefined);
  const [forwardedVelocity, setForwardedVelocity] = useState<number | undefined>(undefined);
  const [forwardedObjectType, setForwardedObjectType] = useState<ObjectVisualType | undefined>(undefined);

  const handleSendToSimulation = (mass: number, velocity: number, objectType?: ObjectVisualType) => {
    setForwardedMass(mass);
    setForwardedVelocity(velocity);
    setForwardedObjectType(objectType);
    setActiveTab('simulation');
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 text-slate-800 transition-all ${
        isPresentationMode ? 'text-slate-950 font-medium' : ''
      }`}
    >
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPresentationMode={isPresentationMode}
        setIsPresentationMode={setIsPresentationMode}
        onOpenTeachingGuide={() => setIsTeachingGuideOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Presentation mode top indicator banner if enabled */}
        {isPresentationMode && (
          <div className="mb-4 px-4 py-2 bg-amber-500 text-white rounded-xl flex items-center justify-between text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>
                Mode Proyektor Aktif: Ukuran teks dan kontras visual dioptimalkan untuk presentasi layar lebar kelas.
              </span>
            </div>
            <button
              onClick={() => setIsPresentationMode(false)}
              className="text-white underline hover:no-underline text-xs"
            >
              Matikan
            </button>
          </div>
        )}

        {/* Tab 1: Kalkulator & Generator Data */}
        {activeTab === 'calculator' && (
          <section className="animate-in fade-in duration-200">
            <MomentumCalculator
              isPresentationMode={isPresentationMode}
              onSendToSimulation={handleSendToSimulation}
            />
          </section>
        )}

        {/* Tab 2: Simulasi Visual 2D Canvas */}
        {activeTab === 'simulation' && (
          <section className="animate-in fade-in duration-200">
            <PhysicsSimulationCanvas
              isPresentationMode={isPresentationMode}
              externalMass={forwardedMass}
              externalVelocity={forwardedVelocity}
              externalObjectType={forwardedObjectType}
            />
          </section>
        )}

        {/* Tab 3: Kuis Interaktif & Studi Kasus */}
        {activeTab === 'quiz' && (
          <section className="animate-in fade-in duration-200">
            <InteractiveQuiz isPresentationMode={isPresentationMode} />
          </section>
        )}
      </main>

      {/* Educational Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">FisikaLab Microteaching</span>
            <span>·</span>
            <span>Modul Momentum, Impuls & Tumbukan</span>
            <span>·</span>
            <span className="text-slate-400">Kurikulum Merdeka / SMA Fisika Kelas XI</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsTeachingGuideOpen(true)}
              className="hover:text-indigo-600 font-medium transition-colors"
            >
              Sintaks & Panduan Guru
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hover:text-indigo-600 font-medium transition-colors"
            >
              Unduh Versi 1 File HTML
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TeachingGuideModal
        isOpen={isTeachingGuideOpen}
        onClose={() => setIsTeachingGuideOpen(false)}
      />

      <ExportHtmlModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
