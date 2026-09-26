import React from 'react';
import { X, BookOpen, Sparkles, MessageCircle, AlertTriangle } from 'lucide-react';
import { MathView, LatexText } from './MathView';

interface TeachingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeachingGuideModal: React.FC<TeachingGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Panduan Microteaching Guru: Momentum & Impuls
              </h3>
              <p className="text-xs text-slate-500">
                Petunjuk pedagogis, alur demonstrasi, dan mitigasi miskonsepsi siswa dengan notasi matematis LaTeX
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs sm:text-sm text-slate-700">
          {/* 1. Alur Sintaks Pembelajaran */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              1. Rekomendasi Sintaks Microteaching (15 – 20 Menit)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-indigo-700 block">Fase 1: Apersepsi (3 Menit)</span>
                <p className="text-slate-600">
                  Tanyakan: "Mengapa tertabrak sepeda laju 15 km/jam lebih aman daripada tertabrak truk bermuatan dengan laju sama?"
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-indigo-700 block">Fase 2: Eksplorasi Canvas (6 Menit)</span>
                <p className="text-slate-600">
                  Buka tab <strong>Simulasi Visual 2D</strong>. Gunakan preset "Truk Lambat vs Mobil Cepat". Perhatikan panjang panah vektor hijau (<MathView math="\vec{p}" />).
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-indigo-700 block">Fase 3: Verifikasi Data (5 Menit)</span>
                <p className="text-slate-600">
                  Buka tab <strong>Kalkulator</strong>. Gunakan tabel variasi data untuk menunjukkan hubungan linear sebanding <MathView math="p \propto v" /> atau <MathView math="p \propto m" />.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-indigo-700 block">Fase 4: Evaluasi & Refleksi (4 Menit)</span>
                <p className="text-slate-600">
                  Ajak kelas menjawab bersama kuis interaktif, diskusikan fungsi airbag dan matras busa pada impuls (<MathView math="I = F \cdot \Delta t" />).
                </p>
              </div>
            </div>
          </div>

          {/* 2. Pertanyaan Pemantik untuk Siswa */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              2. Pertanyaan Pemantik (Inquiry-Based Learning)
            </h4>
            <ul className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <div>
                  <strong>"Apakah mungkin benda yang sangat ringan memiliki momentum yang jauh lebih besar daripada truk tronton?"</strong>
                  <div className="text-slate-600 text-xs mt-1">
                    <LatexText text="Ya! Contoh: peluru senapan bermassa $m = 10\text{ g}$ dengan kelajuan $v = 800\text{ m/s}$ ($p = 8\text{ kg}\cdot\text{m/s}$) vs truk tronton diam ($v = 0\text{ m/s}, p = 0$)." />
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <div>
                  <strong>"Jika kita menjatuhkan telur mentah dari ketinggian yang sama ke atas ubin keramik vs bantal busa, mengapa telur di bantal tidak pecah?"</strong>
                  <div className="text-slate-600 text-xs mt-1">
                    <LatexText text="Perubahan momentum $\Delta p$ telur bernilai sama persis saat dihentikan. Namun bantal busa memperpanjang selang waktu kontak $\Delta t$, sehingga gaya benturan rata-rata $F = \frac{\Delta p}{\Delta t}$ berkurang drastis di bawah batas kekuatan cangkang telur!" />
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* 3. Miskonsepsi Umum Siswa */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              3. Matriks Miskonsepsi Siswa & Solusi Edukatif
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1">
                <div className="font-bold text-rose-900">
                  ❌ Miskonsepsi 1: "Momentum sama dengan Energi Kinetik."
                </div>
                <div className="text-slate-700 text-xs space-y-1">
                  <div>
                    <strong>Penjelasan Guru:</strong> Momentum adalah besaran <em>vektor</em> (<MathView math="\vec{p} = m \cdot \vec{v}" />) dan memiliki arah, sedangkan Energi Kinetik adalah besaran <em>skalar</em> (<MathView math="E_k = \frac{1}{2} m v^2" />).
                  </div>
                  <div className="text-slate-600 font-mono text-[11px] pt-1">
                    <MathView block math="p = \sqrt{2mE_k} \iff E_k = \frac{p^2}{2m}" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <div className="font-bold text-amber-900">
                  ❌ Miskonsepsi 2: "Jika bola memantul dengan kecepatan sama, perubahan momentumnya adalah nol."
                </div>
                <div className="text-slate-700 text-xs space-y-1">
                  <div>
                    <strong>Penjelasan Guru:</strong> Karena kecepatan adalah vektor, <MathView math="v_{\text{awal}} = +v" /> dan <MathView math="v_{\text{akhir}} = -v" />. Perubahan momentum adalah:
                  </div>
                  <div className="text-slate-600 font-mono text-[11px] pt-1">
                    <MathView block math="\Delta p = p_{\text{akhir}} - p_{\text{awal}} = -m v - (+m v) = -2m v \neq 0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
