import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, ExternalLink } from 'lucide-react';

interface ExportHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportHtmlModal: React.FC<ExportHtmlModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    fetch('/standalone.html')
      .then((res) => res.text())
      .then((htmlContent) => {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'simulasi-momentum-microteaching.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('Download error:', err);
      });
  };

  const handleCopy = () => {
    fetch('/standalone.html')
      .then((res) => res.text())
      .then((htmlContent) => {
        navigator.clipboard.writeText(htmlContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Ekspor 1 File HTML Tunggal (Standalone)
              </h3>
              <p className="text-xs text-slate-500">
                Sesuai pedoman: Gabungan HTML, CSS, JavaScript & Tailwind CDN siap pakai offline
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

        {/* Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm text-slate-700">
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
            <div className="font-bold text-indigo-950 flex items-center gap-2">
              <span>Fitur File HTML Tunggal:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-indigo-900 list-disc list-inside">
              <li>Berisi 3 tab lengkap: Kalkulator dinamis, Simulasi visual Canvas 2D, dan Kuis.</li>
              <li>Menggunakan Tailwind CSS CDN resmi (<code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">https://cdn.tailwindcss.com</code>).</li>
              <li>Dapat dibuka di browser apa pun tanpa memerlukan Node.js, Vite, atau instalasi lokal.</li>
              <li>Cocok untuk disimpan di USB drive dan ditayangkan saat microteaching offline.</li>
            </ul>
          </div>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs space-y-2 overflow-x-auto">
            <div className="text-slate-400 text-[11px]">// Nama file output:</div>
            <div className="text-emerald-400 font-bold">simulasi-momentum-microteaching.html</div>
            <div className="text-slate-400 text-[11px] pt-1">// Lokasi URL preview langsung:</div>
            <a
              href="/standalone.html"
              target="_blank"
              rel="noreferrer"
              className="text-sky-300 hover:text-sky-200 underline flex items-center gap-1 inline-block"
            >
              <span>Buka /standalone.html di Tab Baru</span>
              <ExternalLink className="w-3.5 h-3.5 inline" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kode HTML Disalin!' : 'Salin Kode HTML ke Clipboard'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File HTML (.html)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-medium text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
