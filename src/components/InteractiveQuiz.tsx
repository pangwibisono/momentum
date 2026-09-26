import React, { useState } from 'react';
import { QUIZ_QUESTIONS } from '../data/physicsData';
import { LatexText } from './MathView';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  Award, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface InteractiveQuizProps {
  isPresentationMode: boolean;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({ isPresentationMode }) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const currentQ = QUIZ_QUESTIONS[currentIdx];
  const selectedAnswer = selectedAnswers[currentQ.id];
  const hasAnsweredCurrent = Boolean(selectedAnswer);
  const isCurrentCorrect = selectedAnswer === currentQ.correctAnswerId;

  // Calculate score
  const totalQuestions = QUIZ_QUESTIONS.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = QUIZ_QUESTIONS.filter(
    (q) => selectedAnswers[q.id] === q.correctAnswerId
  ).length;

  const handleSelectOption = (optionId: string) => {
    if (selectedAnswers[currentQ.id]) return; // prevent changing answer after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsCompleted(false);
  };

  const handleNextQuestion = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${isPresentationMode ? 'text-base' : 'text-sm'}`}>
      {/* Top Header & Progress */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Kuis Evaluasi & Studi Kasus Konseptual
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Soal dirancang khusus untuk menguji pemahaman konsep dan meluruskan miskonsepsi umum fisika.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Skor: {correctCount} / {totalQuestions}
            </span>
            <button
              onClick={handleResetQuiz}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
              title="Ulangi Kuis dari Awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Question Step Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Soal {currentIdx + 1} dari {totalQuestions}
            </span>
            <span>{Math.round((answeredCount / totalQuestions) * 100)}% Selesai</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {QUIZ_QUESTIONS.map((q, idx) => {
              const ans = selectedAnswers[q.id];
              let statusStyle = 'bg-slate-100 border-slate-200 text-slate-600';
              if (ans) {
                statusStyle =
                  ans === q.correctAnswerId
                    ? 'bg-emerald-500 border-emerald-600 text-white font-bold'
                    : 'bg-rose-500 border-rose-600 text-white font-bold';
              } else if (idx === currentIdx) {
                statusStyle = 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold ring-2 ring-indigo-400/30';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIdx(idx);
                    setIsCompleted(false);
                  }}
                  className={`py-1.5 rounded-lg border text-xs font-mono transition-all ${statusStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!isCompleted ? (
        /* QUESTION CARD */
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Question Header & Scenario */}
          <div className="space-y-3">
            {currentQ.scenario && (
              <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md inline-block">
                Studi Kasus: <LatexText text={currentQ.scenario} />
              </div>
            )}
            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.id}. <LatexText text={currentQ.question} />
            </h4>
          </div>

          {/* Options List */}
          <div className="space-y-3">
            {currentQ.options.map((option) => {
              const isSelected = selectedAnswer === option.id;
              const isCorrectChoice = option.id === currentQ.correctAnswerId;

              let optionStyle =
                'border-slate-200 hover:border-indigo-400 hover:bg-slate-50 text-slate-800 bg-white';

              if (hasAnsweredCurrent) {
                if (isCorrectChoice) {
                  optionStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20';
                } else if (isSelected && !isCorrectChoice) {
                  optionStyle = 'border-rose-500 bg-rose-50/80 text-rose-950 ring-2 ring-rose-500/20';
                } else {
                  optionStyle = 'border-slate-200 text-slate-400 opacity-60 bg-white';
                }
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={hasAnsweredCurrent}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${optionStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 transition-colors ${
                      hasAnsweredCurrent && isCorrectChoice
                        ? 'bg-emerald-600 text-white'
                        : hasAnsweredCurrent && isSelected && !isCorrectChoice
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {option.id}
                  </span>
                  <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                    <LatexText text={option.text} />
                  </div>
                  {hasAnsweredCurrent && isCorrectChoice && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {hasAnsweredCurrent && isSelected && !isCorrectChoice && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* INSTANT EXPLANATION ACCORDION (Revealed after answering) */}
          {hasAnsweredCurrent && (
            <div
              className={`p-5 rounded-2xl border space-y-4 animate-in fade-in duration-300 ${
                isCurrentCorrect
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm text-emerald-950">
                      Jawaban Anda Tepat Sekali!
                    </span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-5 h-5 text-amber-700" />
                    <span className="font-bold text-sm text-amber-950">
                      Kurang Tepat, Mari Pelajari Pembahasannya:
                    </span>
                  </>
                )}
              </div>

              {/* Step 1: Penjelasan Konsep Inti */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  💡 Konsep Fisika:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                  <LatexText text={currentQ.explanation.concept} />
                </p>
              </div>

              {/* Step 2: Perhitungan Matematis (jika ada) */}
              {currentQ.explanation.calculation && (
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    🔢 Analisis Matematis (LaTeX):
                  </span>
                  <div className="bg-white/95 p-3.5 rounded-xl border border-slate-200/90 text-slate-900 text-xs sm:text-sm space-y-2">
                    <LatexText text={currentQ.explanation.calculation} />
                  </div>
                </div>
              )}

              {/* Step 3: Analisis Miskonsepsi Siswa */}
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 text-xs space-y-1 text-slate-800">
                <span className="font-bold text-amber-900 block">
                  ⚠️ Poin Guru (Miskonsepsi Populer Siswa):
                </span>
                <p className="text-slate-700 italic leading-relaxed">
                  "<LatexText text={currentQ.explanation.misconception} />"
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {hasAnsweredCurrent && (
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>{currentIdx < totalQuestions - 1 ? 'Soal Berikutnya' : 'Lihat Hasil Akhir'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* QUIZ SCORE RESULT SUMMARY */
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
              Evaluasi Kuis Selesai!
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              {correctCount === totalQuestions
                ? 'Luar biasa! Penguasaan konsep momentum, impuls, dan hukum kekekalan sudah sangat matang dan siap diajarkan.'
                : correctCount >= 3
                ? 'Bagus sekali! Pemahaman konsep dasar sudah kuat. Silakan telaah kembali pembahasan untuk meluruskan beberapa miskonsepsi.'
                : 'Terus berlatih! Gunakan simulasi visual dan kalkulator langkah demi langkah untuk memperkuat pemahaman fisis.'}
            </p>
          </div>

          {/* Score Counter */}
          <div className="inline-flex items-baseline gap-2 bg-indigo-50 border border-indigo-100 px-6 py-3 rounded-2xl">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-indigo-600">
              {correctCount}
            </span>
            <span className="text-base font-semibold text-slate-500 font-mono">
              / {totalQuestions} Soal Benar ({Math.round((correctCount / totalQuestions) * 100)}%)
            </span>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={handleResetQuiz}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Kuis</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
