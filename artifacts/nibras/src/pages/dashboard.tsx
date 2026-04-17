import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetCurriculumOptions, useGenerateLesson, useGetRagContext, getGetCurriculumOptionsQueryKey, StudentLevel } from "@workspace/api-client-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/inputs";
import { Label } from "@/components/ui/inputs";
import { Input } from "@/components/ui/inputs";
import { Textarea } from "@/components/ui/inputs";
import { Loader2, Sparkles, BookOpen, Layers, Target, FileCheck, FileDown, Zap, CheckCircle2, Circle, RefreshCw, Share2, Check } from "lucide-react";
import { LessonView } from "@/components/lesson-view";
import { Chat } from "@/components/chat";
import { downloadLessonWord } from "@/lib/word-generator";

export default function Dashboard() {
  const { teacherName, currentLesson, setCurrentLesson, ragSources, setRagSources, clearChatHistory } = useAppStore();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    if (!currentLesson) return;
    const text = [
      `خطة درس: ${currentLesson.title}`,
      `${currentLesson.stage} - ${currentLesson.grade} - ${currentLesson.subject}`,
      `المدة: ${currentLesson.duration} دقيقة`,
      "",
      "الأهداف:",
      ...currentLesson.objectives.map((o, i) => `${i + 1}. ${o}`),
    ].join("\n");
    if (navigator.share) {
      try { await navigator.share({ title: `خطة درس: ${currentLesson.title}`, text }); return; } catch (_e) {}
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (_e) {}
  };
  
  // Form state
  const [stage, setStage] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [duration, setDuration] = useState("45");
  const [studentLevel, setStudentLevel] = useState<StudentLevel | "">("");
  const [classNature, setClassNature] = useState("");
  const [learningNeeds, setLearningNeeds] = useState("");

  // Learning outcomes suggestion state
  const [suggestedOutcomes, setSuggestedOutcomes] = useState<string[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<Set<string>>(new Set());
  const [isLoadingOutcomes, setIsLoadingOutcomes] = useState(false);
  
  // Queries & Mutations
  const { data: curriculumOptions, isLoading: isLoadingOptions } = useGetCurriculumOptions({
    query: { queryKey: getGetCurriculumOptionsQueryKey() }
  });
  
  const generateMutation = useGenerateLesson();
  const ragMutation = useGetRagContext();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived options based on cascade
  const availableGrades = curriculumOptions?.stages.find(s => s.name === stage)?.grades || [];
  const availableSubjects = availableGrades.find(g => g.name === grade)?.subjects || [];
  const availableLessons = availableSubjects.find(s => s.name === subject)?.lessons || [];

  const skipCascadeRef = useRef(false);

  // Fetch suggested learning outcomes from the server
  const fetchOutcomes = useCallback(async (subjectVal: string, gradeVal: string, lessonTitleVal: string, stageVal: string) => {
    if (!subjectVal || !lessonTitleVal) { setSuggestedOutcomes([]); setSelectedOutcomes(new Set()); return; }
    setIsLoadingOutcomes(true);
    setSuggestedOutcomes([]);
    setSelectedOutcomes(new Set());
    try {
      const res = await fetch("/api/nibras/suggest-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subjectVal, grade: gradeVal, lessonTitle: lessonTitleVal, stage: stageVal }),
      });
      const data = await res.json() as { outcomes: string[] };
      const outcomes = Array.isArray(data.outcomes) ? data.outcomes : [];
      setSuggestedOutcomes(outcomes);
      setSelectedOutcomes(new Set());
    } catch {
      setSuggestedOutcomes([]);
    } finally {
      setIsLoadingOutcomes(false);
    }
  }, []);

  // Reset dependent fields when parent changes and clear any existing plan
  useEffect(() => {
    if (skipCascadeRef.current) return;
    setGrade(""); setSubject(""); setLessonTitle("");
    setSuggestedOutcomes([]); setSelectedOutcomes(new Set());
    setCurrentLesson(null); clearChatHistory(); setRagSources([]);
  }, [stage]);
  useEffect(() => {
    if (skipCascadeRef.current) return;
    setSubject(""); setLessonTitle("");
    setSuggestedOutcomes([]); setSelectedOutcomes(new Set());
    setCurrentLesson(null); clearChatHistory(); setRagSources([]);
  }, [grade]);
  useEffect(() => {
    if (skipCascadeRef.current) return;
    setLessonTitle("");
    setSuggestedOutcomes([]); setSelectedOutcomes(new Set());
    setCurrentLesson(null); clearChatHistory(); setRagSources([]);
  }, [subject]);

  // When lesson title is selected, fetch outcomes
  useEffect(() => {
    if (skipCascadeRef.current) return;
    if (lessonTitle && subject && grade) {
      fetchOutcomes(subject, grade, lessonTitle, stage);
    } else {
      setSuggestedOutcomes([]); setSelectedOutcomes(new Set());
    }
  }, [lessonTitle]);

  const toggleOutcome = (outcome: string) => {
    setSelectedOutcomes(prev => {
      const next = new Set(prev);
      if (next.has(outcome)) next.delete(outcome); else next.add(outcome);
      return next;
    });
  };

  const handleDemoMode = () => {
    skipCascadeRef.current = true;
    setStage("متوسط");
    setGrade("الصف الأول المتوسط");
    setSubject("العلوم");
    setLessonTitle("مكونات الخلية");
    setDuration("45");
    setStudentLevel("متوسط" as StudentLevel);
    setClassNature("نشط");
    setLearningNeeds("");
    setCurrentLesson(null);
    clearChatHistory();
    setRagSources([]);
    setTimeout(() => {
      skipCascadeRef.current = false;
      fetchOutcomes("العلوم", "الصف الأول المتوسط", "مكونات الخلية", "متوسط");
    }, 50);
  };

  const generationIdRef = useRef(0);

  const startProgressTimer = (from: number, target: number) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setProgress(from);
    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        const remaining = target - prev;
        if (remaining <= 0.5) return prev;
        return prev + remaining * 0.03;
      });
    }, 300);
  };

  const stopProgressTimer = () => {
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }
  };

  const triggerGenerate = (
    stageVal: string, gradeVal: string, subjectVal: string, lessonTitleVal: string,
    durationVal: string, selectedOutcomesVal: Set<string>, studentLevelVal: StudentLevel | "",
    classNatureVal: string, learningNeedsVal: string
  ) => {
    const requestId = ++generationIdRef.current;
    setIsGenerating(true);
    setGenerationStep(1);
    setCurrentLesson(null);
    clearChatHistory();
    setRagSources([]);
    startProgressTimer(0, 18);

    const learningOutcomesStr = selectedOutcomesVal.size > 0
      ? [...selectedOutcomesVal].join("\n")
      : undefined;

    ragMutation.mutate({
      data: { subject: subjectVal, lessonTitle: lessonTitleVal, stage: stageVal, grade: gradeVal }
    }, {
      onSuccess: (ragData) => {
        if (generationIdRef.current !== requestId) return;
        setRagSources(ragData.sources);
        setGenerationStep(2);
        startProgressTimer(20, 88);
        generateMutation.mutate({
          data: {
            teacherName,
            stage: stageVal,
            grade: gradeVal,
            subject: subjectVal,
            lessonTitle: lessonTitleVal,
            duration: parseInt(durationVal) || 45,
            ...(learningOutcomesStr ? { learningOutcomes: learningOutcomesStr } : {}),
            ...(studentLevelVal ? { studentLevel: studentLevelVal } : {}),
            ...(classNatureVal ? { classNature: classNatureVal } : {}),
            ...(learningNeedsVal ? { learningNeeds: learningNeedsVal } : {}),
          }
        }, {
          onSuccess: (lessonData) => {
            stopProgressTimer();
            setProgress(100);
            setGenerationStep(3);
            setTimeout(() => {
              if (generationIdRef.current !== requestId) return;
              setCurrentLesson(lessonData.lessonPlan);
              setIsGenerating(false);
              setProgress(0);
            }, 800);
          },
          onError: () => {
            stopProgressTimer();
            if (generationIdRef.current === requestId) { setIsGenerating(false); setProgress(0); }
          }
        });
      },
      onError: () => {
        stopProgressTimer();
        if (generationIdRef.current === requestId) { setIsGenerating(false); setProgress(0); }
      }
    });
  };

  const handleGenerate = () => {
    if (!stage || !grade || !subject || !lessonTitle) return;
    triggerGenerate(stage, grade, subject, lessonTitle, duration, selectedOutcomes, studentLevel, classNature, learningNeeds);
  };

  const isFormComplete = stage && grade && subject && lessonTitle;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-background">
      
      {/* Sidebar - Controls */}
      <aside className="w-full md:w-[320px] lg:w-[380px] bg-sidebar border-l border-sidebar-border overflow-y-auto flex flex-col shrink-0 z-10 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.1)]">
        <div className="p-6 flex-1 flex flex-col gap-6">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-serif font-bold text-sidebar-foreground">إعداد خطة الدرس</h2>
              <button
                onClick={handleDemoMode}
                disabled={isGenerating}
                title="ملء البيانات تلقائياً للعرض"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300 transition-all disabled:opacity-40 shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                وضع الديمو
              </button>
            </div>
            <p className="text-sm text-muted-foreground font-arabic leading-relaxed">
              حدد مسار الدرس ليقوم المساعد الذكي بتوليد خطة متكاملة وموافقة لمعايير وزارة التعليم.
            </p>
          </div>

          <div className="space-y-5 flex-1">
            
            <div className="space-y-2">
              <Label className="text-sidebar-foreground font-bold">المرحلة الدراسية</Label>
              <Select value={stage} onValueChange={setStage} disabled={isLoadingOptions}>
                <SelectTrigger className="w-full bg-background border-input hover:border-primary/50 transition-colors h-11">
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  {curriculumOptions?.stages.map(s => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sidebar-foreground font-bold">الصف الدراسي</Label>
              <Select value={grade} onValueChange={setGrade} disabled={!stage}>
                <SelectTrigger className="w-full bg-background border-input hover:border-primary/50 transition-colors h-11">
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {availableGrades.map(g => (
                    <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sidebar-foreground font-bold">المادة الدراسية</Label>
              <Select value={subject} onValueChange={setSubject} disabled={!grade}>
                <SelectTrigger className="w-full bg-background border-input hover:border-primary/50 transition-colors h-11">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map(s => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sidebar-foreground font-bold">عنوان الدرس</Label>
              <Select value={lessonTitle} onValueChange={setLessonTitle} disabled={!subject}>
                <SelectTrigger className="w-full bg-background border-input hover:border-primary/50 transition-colors h-11 text-right">
                  <SelectValue placeholder="اختر الدرس" />
                </SelectTrigger>
                <SelectContent>
                  {availableLessons.map(l => (
                    <SelectItem key={l} value={l} className="text-right">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sidebar-foreground font-bold">مدة الحصة (بالدقائق)</Label>
              <Input 
                type="number" 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                className="bg-background h-11"
                min="30"
                max="90"
              />
            </div>

            {/* Learning Outcomes Chip Selector */}
            {(isLoadingOutcomes || suggestedOutcomes.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sidebar-foreground font-bold">نواتج التعلم</Label>
                    {isLoadingOutcomes && (
                      <span className="flex items-center gap-1 text-xs text-primary font-medium animate-pulse">
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                        نهى تقترح الآن..
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedOutcomes.size > 0 && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {selectedOutcomes.size} مختار
                      </span>
                    )}
                    {!isLoadingOutcomes && (
                      <button
                        onClick={() => fetchOutcomes(subject, grade, lessonTitle, stage)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="إعادة الاقتراح"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">اختر ناتج أو أكثر مما يناسبك</p>

                {isLoadingOutcomes ? (
                  <div className="space-y-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {suggestedOutcomes.map((outcome, idx) => {
                      const isSelected = selectedOutcomes.has(outcome);
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleOutcome(outcome)}
                          className={`w-full flex items-start gap-2 text-right p-2.5 rounded-lg border text-xs leading-relaxed transition-all ${
                            isSelected
                              ? "bg-primary/10 border-primary/40 text-primary font-medium"
                              : "bg-background border-input text-foreground/70 hover:border-primary/30 hover:bg-muted/50"
                          }`}
                        >
                          {isSelected
                            ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                            : <Circle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                          }
                          <span>{outcome}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sidebar-foreground font-bold">مستوى الطلاب</Label>
              <Select value={studentLevel} onValueChange={(v) => setStudentLevel(v as StudentLevel)}>
                <SelectTrigger className="w-full bg-background border-input hover:border-primary/50 transition-colors h-11">
                  <SelectValue placeholder="اختر مستوى الطلاب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="مبتدئ">مبتدئ</SelectItem>
                  <SelectItem value="متوسط">متوسط</SelectItem>
                  <SelectItem value="متقدم">متقدم</SelectItem>
                  <SelectItem value="مختلط">مختلط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sidebar-foreground font-bold">طبيعة الصف</Label>
              <Select value={classNature} onValueChange={setClassNature}>
                <SelectTrigger className="bg-background h-11">
                  <SelectValue placeholder="اختر طبيعة الصف..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نشط">نشط</SelectItem>
                  <SelectItem value="متباين">متباين</SelectItem>
                  <SelectItem value="يحتاج ضبط">يحتاج ضبط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sidebar-foreground font-bold">احتياجات التعلم <span className="text-muted-foreground font-normal text-xs">(اختياري)</span></Label>
              <Textarea
                value={learningNeeds}
                onChange={(e) => setLearningNeeds(e.target.value)}
                placeholder="أي احتياجات أو ملاحظات خاصة..."
                className="bg-background resize-none text-sm"
                rows={2}
              />
            </div>
            
          </div>

          <div className="pt-4 sticky bottom-0 bg-sidebar pb-4">
            <Button 
              onClick={handleGenerate} 
              disabled={!isFormComplete || isGenerating}
              className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all group"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري التوليد...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform text-secondary" />
                  <span>توليد خطة الدرس</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-muted/20 relative">
        <div className="max-w-6xl mx-auto p-6 md:p-8 lg:p-10 min-h-full">
          
          <AnimatePresence mode="wait">
            
            {/* Empty State */}
            {!isGenerating && !currentLesson && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-20"
              >
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center text-primary/40 mb-6">
                  <BookOpen className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-3">مرحباً بك في لوحة تحكم نبراس</h3>
                <p className="text-muted-foreground font-arabic leading-relaxed">
                  ابدأ باختيار المرحلة والصف والمادة من القائمة الجانبية لتوليد خطة درس متكاملة تتوافق مع معايير وزارة التعليم السعودية، مدعمة بأفضل استراتيجيات التدريس الفعالة.
                </p>
                <div className="mt-8 flex gap-4 opacity-60">
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center"><Layers className="w-4 h-4" /></div>
                    <span>تخطيط ذكي</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center"><Target className="w-4 h-4" /></div>
                    <span>أهداف دقيقة</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center"><FileCheck className="w-4 h-4" /></div>
                    <span>تعليم متمايز</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center py-20 px-8"
              >
                {/* Animated icon */}
                <div className="relative w-28 h-28 mb-8">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-4 bg-primary/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                  <div className="absolute inset-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl">
                    <Sparkles className="w-7 h-7 animate-pulse" />
                  </div>
                </div>

                <div className="w-full max-w-sm space-y-6 text-center">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">تقنية نهى تعمل الآن...</h3>
                    <p className="text-sm text-muted-foreground">
                      {generationStep === 1 && "يسترجع المحتوى من قواعد المناهج السعودية"}
                      {generationStep === 2 && "تصوغ الأهداف والأنشطة والتعليم المتمايز"}
                      {generationStep === 3 && "اكتملت الخطة! جاري العرض..."}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>التقدم</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-3 text-sm text-right">
                    {[
                      { step: 1, label: "استرجاع السياق من بوابة عين ومنصة مدرستي" },
                      { step: 2, label: "توليد خطة الدرس بتقنية نهى الذكية" },
                      { step: 3, label: "مراجعة التوزيع الزمني وصياغة المخرجات" },
                    ].map(({ step, label }) => (
                      <div
                        key={step}
                        className={`flex items-center gap-3 transition-all duration-500 ${
                          generationStep >= step ? "opacity-100 text-primary" : "opacity-30 text-muted-foreground"
                        }`}
                      >
                        {generationStep > step ? (
                          <FileCheck className="w-4 h-4 shrink-0" />
                        ) : generationStep === step ? (
                          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-current shrink-0" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Generated Plan State */}
            {!isGenerating && currentLesson && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
                className="space-y-8 pb-10"
              >
                
                {/* RAG Sources Badge Row */}
                {ragSources.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-3 bg-card border rounded-xl p-3 shadow-sm"
                  >
                    <span className="text-sm font-bold text-muted-foreground ml-2">المصادر المعتمدة:</span>
                    {ragSources.map((source, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-xs font-medium text-primary">
                        <FileCheck className="w-3.5 h-3.5" />
                        {source}
                      </span>
                    ))}
                  </motion.div>
                )}

                {/* Lesson Plan Content */}
                <LessonView lesson={currentLesson} selectedOutcomes={Array.from(selectedOutcomes)} />

                {/* Chatbot Integration */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-12 h-[500px]"
                >
                  <Chat />
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="flex justify-center gap-3 pt-2 pb-4 flex-wrap"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 font-bold text-base border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
                    disabled={isPdfLoading}
                    onClick={async () => {
                      if (!currentLesson) return;
                      setIsPdfLoading(true);
                      try {
                        await downloadLessonWord(currentLesson, Array.from(selectedOutcomes));
                      } finally {
                        setIsPdfLoading(false);
                      }
                    }}
                  >
                    {isPdfLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري إعداد ملف Word...
                      </>
                    ) : (
                      <>
                        <FileDown className="w-5 h-5 text-primary" />
                        تحميل خطة الدرس Word
                      </>
                    )}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 font-bold text-base border-2 border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/30 transition-all shadow-sm"
                    onClick={handleShare}
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-5 h-5 text-green-600" />
                        تم النسخ!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5" />
                        مشاركة الخطة
                      </>
                    )}
                  </Button>
                </motion.div>

              </motion.div>
            )}

          </AnimatePresence>
          
        </div>
      </main>

    </div>
  );
}
