import React, { useState, useEffect, useTransition } from "react";
import {
  Upload,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Filter,
  Trash2,
} from "lucide-react";

interface PassiveWord {
  id: number;
  word: string;
  language: string;
  addedAt: string | number | Date;
}

interface PassiveWordsManagerProps {
  initialTotal?: number;
}

export const PassiveWordsManager: React.FC<PassiveWordsManagerProps> = ({
  initialTotal = 0,
}) => {
  const [words, setWords] = useState<PassiveWord[]>([]);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "alpha">(
    "date_desc",
  );

  // Import Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"text" | "csv">("text");
  const [textInput, setTextInput] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    inserted?: number;
    skipped?: number;
  } | null>(null);

  const fetchWords = async (q: string = searchQuery, sort: string = sortBy) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.append("q", q.trim());
      params.append("sort", sort);
      params.append("limit", "100");

      const res = await fetch(`/api/passive/words?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWords(data.items);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Error al cargar palabras pasivas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWord = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/passive/words/${id}`, {
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
    setLoading(true);
    try {
      const res = await fetch("/api/passive/words", {
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
    fetchWords(searchQuery, sortBy);
  }, [sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWords(searchQuery, sortBy);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTextImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/passive/import-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput, language: "es" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: `Importación completada: ${data.insertedCount} agregadas, ${data.skippedCount} omitidas (duplicadas).`,
          inserted: data.insertedCount,
          skipped: data.skippedCount,
        });
        setTextInput("");
        fetchWords();
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Error al procesar el texto.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Error de conexión.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("language", "es");

      const res = await fetch("/api/passive/import-csv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: `CSV importado: ${data.insertedCount} agregadas, ${data.skippedCount} omitidas.`,
          inserted: data.insertedCount,
          skipped: data.skippedCount,
        });
        setCsvFile(null);
        fetchWords();
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Error al importar el archivo CSV.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Error al subir el archivo.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar palabra pasiva..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
          />
        </div>

        {/* Sort & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setSortBy("date_desc")}
              className={`px-2.5 py-1 rounded transition-colors ${
                sortBy === "date_desc"
                  ? "bg-zinc-800 text-amber-300 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Más recientes
            </button>
            <button
              onClick={() => setSortBy("alpha")}
              className={`px-2.5 py-1 rounded transition-colors ${
                sortBy === "alpha"
                  ? "bg-zinc-800 text-amber-300 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              A - Z
            </button>
          </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setFeedback(null);
            }}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shadow-amber-500/10"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Palabras</span>
          </button>
          <button
            onClick={() => handleClearAll()}
            className="text-zinc-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Words Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center text-xs text-zinc-400 bg-zinc-900/50">
          <span>{total} palabras encontradas</span>
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
                No se encontraron palabras pasivas
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                {searchQuery
                  ? "Prueba con otro término de búsqueda."
                  : 'Haz clic en "Importar Palabras" para comenzar.'}
              </p>
            </div>
          ) : (
            words.map((item) => (
              <div
                key={item.id}
                className="p-3.5 px-5 flex items-center justify-between hover:bg-zinc-800/20 transition-colors"
              >
                <span className="font-medium text-sm text-zinc-200">
                  {item.word}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {new Date(item.addedAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <button onClick={() => handleDeleteWord(item.id)}>
                  <Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Import Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-zinc-100 text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                Importar Vocabulario Pasivo
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800 text-sm">
              <button
                onClick={() => {
                  setActiveTab("text");
                  setFeedback(null);
                }}
                className={`flex-1 pb-2.5 font-medium border-b-2 text-center transition-colors ${
                  activeTab === "text"
                    ? "border-amber-400 text-amber-300"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Texto Multilínea
              </button>
              <button
                onClick={() => {
                  setActiveTab("csv");
                  setFeedback(null);
                }}
                className={`flex-1 pb-2.5 font-medium border-b-2 text-center transition-colors ${
                  activeTab === "csv"
                    ? "border-amber-400 text-amber-300"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Archivo CSV
              </button>
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start space-x-2 border ${
                  feedback.type === "success"
                    ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                    : "bg-red-950/40 border-red-800/60 text-red-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Tab 1: Multiline Text */}
            {activeTab === "text" && (
              <form onSubmit={handleTextImport} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                    Pega tu lista de palabras (una por línea):
                  </label>
                  <textarea
                    rows={6}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="efímero&#10;resiliencia&#10;serendipia&#10;ataraxia"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 font-mono"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    No incluyas traducción. La fecha registrada será hoy. Los
                    duplicados se ignoran.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !textInput.trim()}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-medium px-4 py-2 rounded-lg text-xs transition-colors"
                  >
                    {submitting && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>
                      {submitting ? "Procesando..." : "Importar Lista"}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: CSV Upload */}
            {activeTab === "csv" && (
              <form onSubmit={handleCsvImport} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                    Selecciona o arrastra un archivo .csv:
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer bg-zinc-950 border border-zinc-800 p-2 rounded-lg"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Formato compatible: encabezado "word,date" o simplemente una
                    columna con palabras. Si incluye columna de fecha, se
                    preservará.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !csvFile}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-medium px-4 py-2 rounded-lg text-xs transition-colors"
                  >
                    {submitting && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>
                      {submitting ? "Subiendo..." : "Subir e Importar"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
