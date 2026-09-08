import React, { useState, useEffect } from "react";
import {
  Send,
  Search,
  Sparkles,
  RefreshCw,
  BarChart2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
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

export const ActiveWordsManager: React.FC = () => {
  const [words, setWords] = useState<ActiveWord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "occurrences_desc" | "date_desc" | "alpha"
  >("occurrences_desc");

  // Input & Analysis State
  const [textInput, setTextInput] = useState<string>("");
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

  useEffect(() => {
    fetchWords(searchQuery, sortBy);
  }, [sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWords(searchQuery, sortBy);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAnalyzeText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/active/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput, language: "es" }),
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
        fetchWords();
      } else {
        setErrorMsg(data.error || "Error al analizar el texto.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error de conexión con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Text Ingestion Box */}
      <div className="border border-zinc-800 bg-zinc-900/40 rounded-xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Ingestar y Analizar Texto Autoral
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            El texto original se analiza en memoria y se descarta
          </span>
        </div>

        <form onSubmit={handleAnalyzeText} className="space-y-3">
          <textarea
            rows={4}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Pega aquí cualquier fragmento que hayas redactado (diario, ensayo, mensaje, artículo)... El analizador tokenizará cada palabra, calculará frecuencias y acumulará el conteo total en tu base de datos."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {textInput.length > 0
                ? `${textInput.trim().split(/\s+/).length} palabras aproximadas`
                : ""}
            </span>

            <button
              type="submit"
              disabled={submitting || !textInput.trim()}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-medium px-5 py-2 rounded-lg text-sm transition-colors shadow-sm shadow-emerald-500/10"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>
                {submitting ? "Tokenizando..." : "Analizar y Acumular"}
              </span>
            </button>
          </div>
        </form>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-lg text-xs bg-red-950/40 border border-red-800/60 text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Analysis Result Banner */}
        {analysisResult && (
          <div className="mt-4 border border-emerald-800/50 bg-emerald-950/20 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Texto Analizado con Éxito
              </span>
              <button
                onClick={() => setAnalysisResult(null)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Ocultar
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80">
                <div className="text-xs text-zinc-400">Tokens Totales</div>
                <div className="text-lg font-bold text-zinc-100">
                  {analysisResult.tokensAnalyzed}
                </div>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80">
                <div className="text-xs text-zinc-400">Palabras Únicas</div>
                <div className="text-lg font-bold text-zinc-100">
                  {analysisResult.uniqueWords}
                </div>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80">
                <div className="text-xs text-emerald-400">Nuevas Palabras</div>
                <div className="text-lg font-bold text-emerald-300">
                  +{analysisResult.newWordsCount}
                </div>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80">
                <div className="text-xs text-indigo-400">Actualizadas</div>
                <div className="text-lg font-bold text-indigo-300">
                  {analysisResult.updatedWordsCount}
                </div>
              </div>
            </div>

            {analysisResult.topWords.length > 0 && (
              <div className="pt-1">
                <span className="text-xs text-zinc-400 font-medium mr-2">
                  Top palabras en este texto:
                </span>
                <div className="inline-flex flex-wrap gap-1.5 mt-1">
                  {analysisResult.topWords.map((t) => (
                    <span
                      key={t.word}
                      className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700/60 text-xs font-mono"
                    >
                      {t.word}{" "}
                      <strong className="text-emerald-400">({t.count})</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vocabulary Explorer */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar palabra activa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setSortBy("occurrences_desc")}
              className={`px-3 py-1 rounded transition-colors ${
                sortBy === "occurrences_desc"
                  ? "bg-zinc-800 text-emerald-300 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Frecuencia
            </button>
            <button
              onClick={() => setSortBy("date_desc")}
              className={`px-3 py-1 rounded transition-colors ${
                sortBy === "date_desc"
                  ? "bg-zinc-800 text-emerald-300 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Último uso
            </button>
            <button
              onClick={() => setSortBy("alpha")}
              className={`px-3 py-1 rounded transition-colors ${
                sortBy === "alpha"
                  ? "bg-zinc-800 text-emerald-300 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              A - Z
            </button>
          </div>
        </div>

        {/* Active Words Table */}
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center text-xs text-zinc-400 bg-zinc-900/50">
            <span>{total} palabras activas registradas</span>
            {loading && (
              <span className="flex items-center text-zinc-500 gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" /> Actualizando...
              </span>
            )}
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-137.5 overflow-y-auto">
            {words.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-zinc-400 text-sm font-medium">
                  No se encontraron palabras activas
                </p>
                <p className="text-zinc-600 text-xs mt-1">
                  {searchQuery
                    ? "Prueba con otro término de búsqueda."
                    : "Ingesta tu primer texto arriba para comenzar."}
                </p>
              </div>
            ) : (
              words.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 px-5 flex items-center justify-between hover:bg-zinc-800/20 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-sm text-zinc-200">
                      {item.word}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                      ×{item.occurrences}
                    </span>
                    <button onClick={() => handleDeleteWord(item.id)}>
                      <Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-400" />
                    </button>
                  </div>

                  <div className="text-xs font-mono text-zinc-500 flex items-center space-x-4">
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
    </div>
  );
};
