import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  BrainCircuit,
  MessageSquare,
  Copy,
  Check,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  HelpCircle,
  Trophy,
  Send,
  BookOpen,
  Eye,
} from "lucide-react";
import { AI_TABS } from "../../app/constants";
import Button from "../common/Button";

export default function AiTabs({
  loading,
  summary,
  flashcards,
  quiz,
  askResponse,
  chatMessages = [],
  quizAttempts = [],
  onGenerateSummary,
  onGenerateFlashcards,
  onGenerateQuiz,
  onAskAi,
  onChatAi,
  onSubmitQuiz,
}) {
  const [activeTab, setActiveTab] = useState("Summary");
  const [question, setQuestion] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [savedAttempt, setSavedAttempt] = useState(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");

  // Flashcards interactive state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardViewMode, setFlashcardViewMode] = useState("carousel"); // 'carousel' or 'grid'

  // Clipboard feedback
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedAsk, setCopiedAsk] = useState(false);

  useEffect(() => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setSavedAttempt(null);
    setQuizError("");
  }, [quiz]);

  useEffect(() => {
    setFlashcardIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  const handleAsk = async (textToAsk) => {
    const q = textToAsk || question;
    if (!q.trim()) return;
    await onAskAi(q);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    await onChatAi(chatInput);
    setChatInput("");
  };

  const copyToClipboard = (text, type = "summary") => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (type === "summary") {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      } else {
        setCopiedAsk(true);
        setTimeout(() => setCopiedAsk(false), 2000);
      }
    });
  };

  const getCorrectAnswer = (item) => {
    return (
      item?.answer ||
      item?.correctAnswer ||
      item?.correct_option ||
      item?.correct ||
      ""
    );
  };

  const totalQuestions = quiz?.questions?.length || 0;

  const answeredCount = useMemo(() => {
    return Object.values(selectedAnswers).filter(Boolean).length;
  }, [selectedAnswers]);

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  const score = useMemo(() => {
    if (!quiz?.questions?.length) return 0;

    let total = 0;

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      const correct = String(getCorrectAnswer(q)).trim().toLowerCase();
      const selected = String(selectedAnswers[i] || "").trim().toLowerCase();

      if (correct && selected && correct === selected) {
        total += 1;
      }
    }

    return total;
  }, [quiz, selectedAnswers]);

  const scorePercent = totalQuestions
    ? Math.round((score / totalQuestions) * 100)
    : 0;

  const handleSubmitQuiz = async () => {
    if (!quiz?.questions?.length) return;

    setQuizError("");

    if (answeredCount === 0) {
      setQuizError("Please select at least one answer before submitting.");
      return;
    }

    setQuizSubmitted(true);
    setSavingQuiz(true);

    const answers = quiz.questions.map((item, index) => ({
      question: item.question,
      options: item.options || [],
      selectedAnswer: selectedAnswers[index] || "",
      correctAnswer: getCorrectAnswer(item),
      explanation: item.explanation || "",
      isCorrect:
        String(selectedAnswers[index] || "").trim().toLowerCase() ===
        String(getCorrectAnswer(item) || "").trim().toLowerCase(),
    }));

    const attempt = await onSubmitQuiz({ answers });
    setSavedAttempt(attempt || null);
    setSavingQuiz(false);
  };

  const normalizedHistory = useMemo(() => {
    return quizAttempts.slice(0, 5).map((attempt) => {
      const answers = Array.isArray(attempt?.answers) ? attempt.answers : [];
      const total = attempt?.totalQuestions ?? answers.length;
      const correct =
        attempt?.correctAnswers ?? answers.filter((a) => a?.isCorrect).length;
      const percent =
        attempt?.scorePercent ??
        (total ? Math.round((correct / total) * 100) : 0);

      return {
        ...attempt,
        totalQuestions: total,
        correctAnswers: correct,
        scorePercent: percent,
      };
    });
  }, [quizAttempts]);

  const askText =
    typeof askResponse === "string"
      ? askResponse
      : askResponse?.answer || askResponse?.raw || "";

  const askConfidence =
    typeof askResponse === "object" ? askResponse?.confidence : "";

  // Suggested prompts for Ask AI
  const suggestedPrompts = [
    "What are the 3 main takeaways from this video?",
    "Explain the core concept in simple terms",
    "List the key definitions and formulas",
  ];

  const cardsList = flashcards?.cards || [];
  const currentCard = cardsList[flashcardIndex];

  return (
    <div className="space-y-5">
      {/* Top Banner & Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                AI Study Suite
              </h2>
              <span className="rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:text-gray-300 border border-black/10 dark:border-white/10">
                Active Copilot
              </span>
            </div>
            <p className="text-xs text-muted">
              AI summaries, smart flashcards, automated quizzes, and contextual answers
            </p>
          </div>
        </div>

        {/* Feature summary indicators */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          {summary ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Summary Ready
            </span>
          ) : null}
          {cardsList.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-purple-700 dark:text-purple-400 border border-purple-500/20 font-medium">
              <Layers size={12} />
              {cardsList.length} Cards
            </span>
          ) : null}
          {quiz?.questions?.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-medium">
              <CheckCircle2 size={12} />
              {quiz.questions.length} Qs
            </span>
          ) : null}
        </div>
      </div>

      {/* Segmented Tab Ribbon with Professional Solid Colors */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/10 dark:border-white/10">
        {AI_TABS.map((tab) => {
          const isActive = activeTab === tab;
          let Icon = Sparkles;
          let badgeText = null;
          let activeClass = "bg-indigo-600 text-white shadow-xs font-semibold";
          let iconColor = "text-gray-500 dark:text-gray-400";
          let badgeBg = "bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-300";

          if (tab === "Summary") {
            Icon = Sparkles;
            activeClass = "bg-teal-600 text-white shadow-xs font-semibold hover:bg-teal-700";
            iconColor = "text-teal-600 dark:text-teal-400";
            badgeBg = "bg-teal-500/15 text-teal-700 dark:text-teal-300";
            if (summary) badgeText = "•";
          } else if (tab === "Flashcards") {
            Icon = Layers;
            activeClass = "bg-purple-600 text-white shadow-xs font-semibold hover:bg-purple-700";
            iconColor = "text-purple-600 dark:text-purple-400";
            badgeBg = "bg-purple-500/15 text-purple-700 dark:text-purple-300";
            if (cardsList.length) badgeText = cardsList.length;
          } else if (tab === "Quiz") {
            Icon = CheckCircle2;
            activeClass = "bg-indigo-600 text-white shadow-xs font-semibold hover:bg-indigo-700";
            iconColor = "text-indigo-600 dark:text-indigo-400";
            badgeBg = "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300";
            if (quiz?.questions?.length) badgeText = quiz.questions.length;
          } else if (tab === "Ask AI") {
            Icon = BrainCircuit;
            activeClass = "bg-amber-600 text-white shadow-xs font-semibold hover:bg-amber-700";
            iconColor = "text-amber-600 dark:text-amber-400";
            badgeBg = "bg-amber-500/15 text-amber-700 dark:text-amber-300";
          } else if (tab === "Chat") {
            Icon = MessageSquare;
            activeClass = "bg-sky-600 text-white shadow-xs font-semibold hover:bg-sky-700";
            iconColor = "text-sky-600 dark:text-sky-400";
            badgeBg = "bg-sky-500/15 text-sky-700 dark:text-sky-300";
            if (chatMessages.length) badgeText = chatMessages.length;
          }

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
                isActive
                  ? `${activeClass}`
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon size={15} className={isActive ? "text-white" : iconColor} />
              <span>{tab}</span>
              {badgeText ? (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : badgeBg
                  }`}
                >
                  {badgeText}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SUMMARY */}
      {activeTab === "Summary" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onGenerateSummary}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 shadow-xs transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCw size={15} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> {summary ? "Regenerate Summary" : "Generate Summary"}
                </>
              )}
            </button>

            {summary?.summary && (
              <button
                type="button"
                onClick={() => copyToClipboard(summary.summary, "summary")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                {copiedSummary ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5">
            {summary ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    Executive Video Summary
                  </h3>
                  <span className="text-[11px] text-muted">
                    AI extracted key takeaways
                  </span>
                </div>

                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 p-4 leading-relaxed text-sm text-gray-800 dark:text-slate-200">
                  {summary.summary || "No summary text available."}
                </div>

                {summary.keyConcepts?.length ? (
                  <div className="pt-2">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-slate-300">
                      Key Concepts & Themes ({summary.keyConcepts.length})
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {summary.keyConcepts.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 text-xs text-gray-800 dark:text-slate-200"
                        >
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                            {index + 1}
                          </div>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="py-8 text-center">
                <BookOpen size={32} className="mx-auto text-muted opacity-40 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  No summary generated yet
                </p>
                <p className="mt-1 text-xs text-muted">
                  Click &quot;Generate Summary&quot; to distill this video into key points and core concepts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FLASHCARDS */}
      {activeTab === "Flashcards" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onGenerateFlashcards}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 shadow-xs transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCw size={15} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Layers size={15} />{" "}
                  {cardsList.length ? "Regenerate Flashcards" : "Generate Flashcards"}
                </>
              )}
            </button>

            {cardsList.length > 0 && (
              <div className="flex items-center gap-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFlashcardViewMode("carousel")}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    flashcardViewMode === "carousel"
                      ? "bg-purple-600 text-white"
                      : "text-muted hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Interactive Flipper
                </button>
                <button
                  type="button"
                  onClick={() => setFlashcardViewMode("grid")}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    flashcardViewMode === "grid"
                      ? "bg-purple-600 text-white"
                      : "text-muted hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  All Cards Grid
                </button>
              </div>
            )}
          </div>

          {cardsList.length > 0 ? (
            flashcardViewMode === "carousel" ? (
              /* Interactive Single Card Flipper */
              <div className="space-y-4">
                <div
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="group relative min-h-[200px] cursor-pointer select-none rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] hover:border-purple-500/30 p-6 transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 font-semibold text-purple-600 dark:text-purple-300 border border-purple-500/20">
                      Card {flashcardIndex + 1} of {cardsList.length}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted group-hover:text-purple-400 transition">
                      <Eye size={13} />
                      {isFlipped ? "Showing Answer (Click to flip)" : "Click anywhere to reveal answer"}
                    </span>
                  </div>

                  <div className="my-6 text-center">
                    {isFlipped ? (
                      <div>
                        <span className="inline-block mb-2 rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ANSWER
                        </span>
                        <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                          {currentCard?.answer}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-block mb-2 rounded-full bg-blue-500/10 px-3 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          QUESTION
                        </span>
                        <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          {currentCard?.question}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-[11px] text-muted">
                    Tip: Test yourself before flipping!
                  </div>
                </div>

                {/* Carousel Controls */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setFlashcardIndex((prev) =>
                        prev > 0 ? prev - 1 : cardsList.length - 1
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-2 text-xs font-medium text-gray-800 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 transition"
                  >
                    <ArrowLeft size={14} /> Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600/10 border border-purple-500/30 px-4 py-2 text-xs font-semibold text-purple-600 dark:text-purple-300 hover:bg-purple-600/20 transition"
                  >
                    <RotateCw size={13} /> {isFlipped ? "Flip to Question" : "Reveal Answer"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setFlashcardIndex((prev) =>
                        prev < cardsList.length - 1 ? prev + 1 : 0
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-2 text-xs font-medium text-gray-800 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 transition"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Grid Mode */
              <div className="grid gap-3 sm:grid-cols-2">
                {cardsList.map((card, index) => (
                  <div
                    key={index}
                    className="rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 space-y-2 hover:border-purple-500/30 transition"
                  >
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        Card #{index + 1}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      Q: {card.question}
                    </p>
                    <div className="rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.04] p-2.5 text-xs text-muted">
                      <span className="font-medium text-gray-700 dark:text-slate-300">A: </span>
                      {card.answer}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="rounded-[1.5rem] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-8 text-center">
              <Layers size={32} className="mx-auto text-muted opacity-40 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                No flashcards created yet
              </p>
              <p className="mt-1 text-xs text-muted">
                Generate active-recall flashcards to test your memory of key video sections.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUIZ */}
      {activeTab === "Quiz" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={async () => {
                setSelectedAnswers({});
                setQuizSubmitted(false);
                setSavedAttempt(null);
                setQuizError("");
                await onGenerateQuiz();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 shadow-xs transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCw size={15} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />{" "}
                  {quiz?.questions?.length ? "Generate New Quiz" : "Generate Quiz"}
                </>
              )}
            </button>

            {quiz?.questions?.length ? (
              <span className="text-xs text-muted">
                {answeredCount} / {totalQuestions} questions answered
              </span>
            ) : null}
          </div>

          {quiz?.questions?.length ? (
            <div className="rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Progress: {answeredCount} / {totalQuestions}
                </p>
                <p className="text-xs text-muted">
                  {unansweredCount > 0
                    ? `${unansweredCount} remaining`
                    : "Ready to submit!"}
                </p>
              </div>

              <div className="mt-3 h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                  style={{
                    width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {quizError ? (
            <div className="rounded-[1.25rem] border border-rose-500/20 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-600 dark:text-rose-300">
              {quizError}
            </div>
          ) : null}

          <div className="grid gap-4">
            {quiz?.questions?.length ? (
              quiz.questions.map((item, index) => {
                const correctAnswer = getCorrectAnswer(item);
                const selected = selectedAnswers[index];

                return (
                  <div
                    key={index}
                    className="rounded-[1.5rem] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                      <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white leading-snug">
                        {item.question}
                      </p>
                    </div>

                    <div className="grid gap-2 pt-1 pl-9">
                      {(item.options || []).map((option, i) => {
                        const isSelected = selected === option;
                        const isCorrect =
                          quizSubmitted &&
                          String(option).trim().toLowerCase() ===
                            String(correctAnswer).trim().toLowerCase();

                        const isWrongSelected =
                          quizSubmitted &&
                          isSelected &&
                          String(option).trim().toLowerCase() !==
                            String(correctAnswer).trim().toLowerCase();

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (quizSubmitted) return;
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [index]: option,
                              }));
                            }}
                            className={`rounded-xl border px-4 py-3 text-left text-xs sm:text-sm font-medium transition-all ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                                : isWrongSelected
                                ? "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                : isSelected
                                ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold shadow-sm"
                                : "border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:border-blue-400/40 text-gray-800 dark:text-slate-200"
                            }`}
                          >
                            <span className="mr-2 font-mono text-muted">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted ? (
                      <div className="mt-3 ml-9 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/20 p-3 text-xs">
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Correct Answer: {correctAnswer || "Not provided by AI"}
                        </p>
                        {item.explanation ? (
                          <p className="mt-1.5 text-muted leading-relaxed">
                            {item.explanation}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : quiz?.raw ? (
              <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 p-5">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-300">
                  Quiz raw response received
                </p>
                <pre className="mt-3 whitespace-pre-wrap text-xs text-muted">
                  {quiz.raw}
                </pre>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-muted opacity-40 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  No quiz questions yet
                </p>
                <p className="mt-1 text-xs text-muted">
                  Generate multiple-choice questions to test your comprehension.
                </p>
              </div>
            )}
          </div>

          {quizSubmitted && quiz?.questions?.length ? (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      Quiz Score: {score} / {quiz.questions.length} ({scorePercent}%)
                    </p>
                    <p className="text-xs text-muted">
                      {scorePercent >= 80
                        ? "Outstanding mastery! You thoroughly understand this topic."
                        : scorePercent >= 60
                        ? "Good effort! Review the questions you missed above."
                        : "Keep learning! Re-watch the video and retry the quiz."}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                  {savedAttempt
                    ? `Saved (${savedAttempt.scorePercent ?? scorePercent}%)`
                    : "Completed"}
                </span>
              </div>
            </div>
          ) : null}

          {quiz?.questions?.length ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[1.25rem] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {answeredCount} of {totalQuestions} answered
                </p>
                <p className="text-xs text-muted">
                  {quizSubmitted
                    ? "Quiz graded and scores calculated."
                    : "Submit to check answers and review detailed explanations."}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleSubmitQuiz}
                disabled={loading || savingQuiz || quizSubmitted}
                className="w-full sm:w-auto min-w-[140px]"
              >
                {savingQuiz
                  ? "Saving..."
                  : quizSubmitted
                  ? "Quiz Submitted"
                  : "Submit Quiz"}
              </Button>
            </div>
          ) : null}

          {/* Quiz Attempt History */}
          {normalizedHistory.length > 0 && (
            <div className="rounded-[1.5rem] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">
                Recent Quiz Attempts
              </h3>
              <div className="space-y-2">
                {normalizedHistory.map((attempt) => (
                  <div
                    key={attempt._id}
                    className="flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {attempt.title || "Quiz Attempt"}
                      </p>
                      <p className="text-muted text-[11px] mt-0.5">
                        {attempt.correctAnswers} of {attempt.totalQuestions} correct •{" "}
                        {attempt.createdAt
                          ? new Date(attempt.createdAt).toLocaleDateString()
                          : "Recent"}
                      </p>
                    </div>
                    <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {attempt.scorePercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ASK AI */}
      {activeTab === "Ask AI" && (
        <div className="space-y-4">
          {/* Quick Suggested Prompts */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Quick Inquiries
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuestion(prompt);
                    handleAsk(prompt);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <Lightbulb size={12} className="text-amber-500" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="Ask anything specific about this video..."
              className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-muted outline-none focus:border-blue-500 transition"
            />
            <Button
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
              className="px-5 shrink-0"
            >
              {loading ? <RotateCw size={15} className="animate-spin" /> : "Ask"}
            </Button>
          </div>

          <div className="rounded-[1.5rem] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-5">
            {askText ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      <BrainCircuit size={14} />
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      AI Answer
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(askText, "ask")}
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-gray-900 dark:hover:text-white transition"
                  >
                    {copiedAsk ? (
                      <>
                        <Check size={12} className="text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 p-4 text-sm leading-relaxed text-gray-800 dark:text-slate-200">
                  {askText}
                </div>

                {askConfidence ? (
                  <p className="text-[11px] text-muted">
                    Confidence: <span className="font-semibold text-blue-500">{askConfidence}</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="py-6 text-center">
                <HelpCircle size={32} className="mx-auto text-muted opacity-40 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Ask any question regarding the video lecture
                </p>
                <p className="mt-1 text-xs text-muted">
                  Get immediate AI answers referenced directly to the lecture content.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CHAT TUTOR */}
      {activeTab === "Chat" && (
        <div className="space-y-4">
          <div className="max-h-[380px] min-h-[180px] space-y-3 overflow-y-auto rounded-[1.5rem] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4">
            {chatMessages.length ? (
              chatMessages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                        isUser
                          ? "bg-blue-600 text-white"
                          : "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {isUser ? "You" : "AI"}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed max-w-[80%] ${
                        isUser
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                          : "border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 text-gray-800 dark:text-slate-200"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <MessageSquare size={32} className="mx-auto text-muted opacity-40 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Interactive AI Tutor Chat
                </p>
                <p className="mt-1 text-xs text-muted">
                  Discuss complex topics, ask for analogies, or solve practice problems step-by-step.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleChat();
                }
              }}
              placeholder="Message your AI tutor..."
              className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-muted outline-none focus:border-blue-500 transition"
            />
            <Button
              onClick={handleChat}
              disabled={loading || !chatInput.trim()}
              className="px-5 shrink-0 inline-flex items-center gap-1.5"
            >
              <Send size={14} /> Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}