import React, { useState, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, FileCode, CheckCircle2, X, Sparkles, AlertCircle, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadBox({ onFileUpload, file, setFile }) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFile(droppedFile);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setErrorMessage("");
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".md", ".py", ".js", ".cpp", ".java"];
    const fileExt = "." + selectedFile.name.split(".").pop().toLowerCase();
    const isAllowed = selectedFile.type.startsWith("image/") ||
      selectedFile.type === "application/pdf" ||
      selectedFile.type.startsWith("text/") ||
      allowedExtensions.includes(fileExt);

    if (isAllowed) {
      setFile(selectedFile);
      onFileUpload(selectedFile);
    } else {
      setErrorMessage("Please upload a supported document (PDF, PNG/JPG, TXT, or Code files).");
    }
  };

  const clearFile = () => {
    setFile(null);
    setErrorMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const getFileIcon = (fileItem) => {
    if (!fileItem) return <FileText size={24} />;
    if (fileItem.type.startsWith("image/")) return <ImageIcon size={24} className="text-emerald-500 dark:text-emerald-400" />;
    if (fileItem.name.endsWith(".pdf")) return <FileText size={24} className="text-rose-500 dark:text-rose-400" />;
    return <FileCode size={24} className="text-indigo-500 dark:text-indigo-400" />;
  };

  return (
    <div className="w-full space-y-3">
      <div
        className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
          dragActive
            ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.18)] scale-[1.01]"
            : file
            ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20"
            : "border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/[0.03]"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.py,.js,.cpp,.java"
          onChange={handleChange}
        />

        <div
          className="p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer select-none"
          onClick={() => !file && inputRef.current?.click()}
        >
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file-loaded"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md flex flex-col items-center gap-3"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
                    {getFileIcon(file)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-transform hover:scale-110 active:scale-95"
                    title="Remove File"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-1 text-center w-full">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[220px]">
                      {file.name}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-muted font-mono">
                    {(file.size / 1024).toFixed(1)} KB • {file.type || "Document"}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Change File <ArrowUpRight size={13} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="prompt-state"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    dragActive
                      ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105"
                  }`}
                >
                  <Upload size={24} />
                </div>

                <div>
                  <h4 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                    {dragActive ? "Drop your document here!" : "Upload Assignment Document"}
                  </h4>
                  <p className="text-xs text-muted mt-1 max-w-xs">
                    Drag and drop your homework file or <span className="text-emerald-600 dark:text-emerald-400 font-semibold underline">click to browse</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {["PDF Document", "Photos & Scans", "Code / TXT"].map((pill) => (
                    <span
                      key={pill}
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-muted"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-2"
        >
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}
    </div>
  );
}
