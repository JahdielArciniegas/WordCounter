import React, { useState, useEffect } from "react";
import {
  Send,
  Search,
  Sparkles,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";

interface ActiveWord {
  id: number;
  word: string;
  language: string;
  occurrences: number;
  firstUsedAt: string | number | Date;
  lastUsedAt: string | number | Date;
}

interface AnalysisSummary {
  tokensAnalyzed: number;
  uniqueWords: number;
  newWordsCount: number;
  updatedWordsCount: number;
  topWords: { word: string; count: number }[];
}

interface ActiveWordsManagerProps {
  mode?: "full" | "analyzer-only";
  onAnalyzed?: () => void;
}

export const ActiveWordsManager: React.FC<ActiveWordsManagerProps> = ({
  mode = "full",
  onAnalyzed,
}) => {
  const [words, setWords] = useState<ActiveWord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "occurrences_desc" | "date_desc" | "first_used_desc" | "alpha"
  >("occurrences_desc");

  // Input & Analysis State
  const [textInput, setTextInput] = useState<string>("");
  const [dateInput, setDateInput] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisSummary | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchWords = async (q: string = searchQuery, sort: string = sortBy) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.append("q", q.trim());
      params.append("sort", sort);
      params.append("limit", "100");

      const res = await fetch(`/api/active/words?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWords(data.items);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Error al cargar palabras activas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWord = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/active/words/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchWords();
      }
    } catch (err) {
      console.error("Error al eliminar palabra:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar todas las palabras activas? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/active/words", {
        method: "DELETE",
      });
      if (res.ok) {
        fetchWords();
      }
    } catch (err) {
      console.error("Error al limpiar palabras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "full") {
      fetchWords(searchQuery, sortBy);
    }
  }, [sortBy, mode]);

  useEffect(() => {
    if (mode === "full") {
      const timer = setTimeout(() => {
        fetchWords(searchQuery, sortBy);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, mode]);

  const handleAnalyzeText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/active/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textInput,
          language: "es",
          date: dateInput || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAnalysisResult({
          tokensAnalyzed: data.tokensAnalyzed,
          uniqueWords: data.uniqueWords,
          newWordsCount: data.newWordsCount,
          updatedWordsCount: data.updatedWordsCount,
          topWords: data.topWords || [],
        });
        setTextInput(""); // Discard raw text immediately
        if (mode === "full") {
          fetchWords();
        }
        if (onAnalyzed) {
          onAnalyzed();
        }
      } else {
        setErrorMsg(data.error || "Error al analizar el texto.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error de conexión con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleAnalyzeText();
    }
  };

  const wordCountEstimate = textInput.trim()
    ? textInput.trim().split(/\s+/).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Text Ingestion Box */}
      <div className="border border-zinc-800/80 bg-zinc-900/30 rounded-xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-800/50 pb-3">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Ingestar y Analizar Texto Autoral</span>
          </h2>
          <span className="text-[11px] text-zinc-500 font-mono">
            Procesado en memoria • Texto plano descartado inmediatamente
          </span>
        </div>

        <form onSubmit={handleAnalyzeText} className="space-y-3">
          <textarea
            rows={4}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pega aquí cualquier texto redactado (ensayo, diario, mensaje)... Se tokenizará cada palabra y se acumulará en tu recuento activo."
            className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all font-sans leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-500 font-mono text-[11px]">Fecha:</span>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="bg-transparent text-zinc-200 text-xs focus:outline-none focus:text-emerald-300 cursor-pointer scheme:dark font-mono"
                />
              </div>

              {wordCountEstimate > 0 && (
                <span className="text-[11px] font-mono text-zinc-500">
                  ~{wordCountEstimate} palabras
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[11px] text-zinc-500 font-mono">
                ⌘↵ para enviar
              </span>
              <button
                type="submit"
                disabled={submitting || !textInput.trim()}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-emerald-950 font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {submitting ? "Tokenizando..." : "Analizar y Acumular"}
                </span>
              </button>
            </div>
          </div>
        </form>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-lg text-xs bg-red-950/30 border border-red-800/50 text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Analysis Result Banner */}
        {analysisResult && (
          <div className="border border-emerald-500/20 bg-emerald-950/15 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Texto Analizado con Éxito
              </span>
              <button
                onClick={() => setAnalysisResult(null)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Ocultar
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                <div className="text-[11px] text-zinc-500">Tokens Totales</div>
                <div className="text-base font-bold text-zinc-100">
                  {analysisResult.tokensAnalyzed}
                </div>
              </div>
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                <div className="text-[11px] text-zinc-500">Palabras Únicas</div>
                <div className="text-base font-bold text-zinc-100">
                  {analysisResult.uniqueWords}
                </div>
              </div>
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                <div className="text-[11px] text-emerald-400">Nuevas</div>
                <div className="text-base font-bold text-emerald-300">
                  +{analysisResult.newWordsCount}
                </div>
              </div>
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                <div className="text-[11px] text-indigo-400">Actualizadas</div>
                <div className="text-base font-bold text-indigo-300">
                  {analysisResult.updatedWordsCount}
                </div>
              </div>
            </div>

            {analysisResult.topWords.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-mono text-zinc-500 mr-1">
                  Top palabras:
                </span>
                {analysisResult.topWords.map((t) => (
                  <span
                    key={t.word}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs font-mono"
                  >
                    <span>{t.word}</span>
                    <strong className="text-emerald-400">({t.count})</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vocabulary Explorer */}
      {mode === "full" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar palabra activa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-8.5 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Controls */}
              <div className="flex items-center bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setSortBy("occurrences_desc")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    sortBy === "occurrences_desc"
                      ? "bg-zinc-800 text-emerald-300 border border-zinc-700/60 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Frecuencia
                </button>
                <button
                  onClick={() => setSortBy("date_desc")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    sortBy === "date_desc"
                      ? "bg-zinc-800 text-emerald-300 border border-zinc-700/60 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Último uso
                </button>
                <button
                  onClick={() => setSortBy("first_used_desc")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    sortBy === "first_used_desc"
                      ? "bg-zinc-800 text-emerald-300 border border-zinc-700/60 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  1° uso
                </button>
                <button
                  onClick={() => setSortBy("alpha")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    sortBy === "alpha"
                      ? "bg-zinc-800 text-emerald-300 border border-zinc-700/60 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  A - Z
                </button>
              </div>

              <button
                onClick={handleClearAll}
                title="Limpiar todas las palabras activas"
                className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-red-400 hover:border-red-900/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Words Table */}
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/20">
            <div className="p-3 px-4 border-b border-zinc-800/60 flex justify-between items-center text-[11px] font-mono text-zinc-400 bg-zinc-900/40">
              <span>{total} palabras activas registradas</span>
              {loading && (
                <span className="flex items-center text-zinc-500 gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Actualizando...
                </span>
              )}
            </div>

            <div className="divide-y divide-zinc-800/50 max-h-120 overflow-y-auto">
              {words.length === 0 ? (
                <div className="p-12 text-center space-y-1">
                  <p className="text-zinc-400 text-xs font-medium">
                    No se encontraron palabras activas
                  </p>
                  <p className="text-zinc-600 text-[11px]">
                    {searchQuery
                      ? "Prueba con otro término de búsqueda."
                      : "Ingesta tu primer texto en el analizador superior."}
                  </p>
                </div>
              ) : (
                words.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 px-4 flex items-center justify-between hover:bg-zinc-800/25 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-xs sm:text-sm text-zinc-200">
                        {item.word}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 font-semibold">
                        ×{item.occurrences}
                      </span>
                      <button
                        onClick={() => handleDeleteWord(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400"
                        title="Eliminar palabra"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-500 flex items-center space-x-4">
                      <span className="hidden sm:inline">
                        1° uso:{" "}
                        {new Date(item.firstUsedAt).toLocaleDateString("es-ES")}
                      </span>
                      <span>
                        Último:{" "}
                        {new Date(item.lastUsedAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
