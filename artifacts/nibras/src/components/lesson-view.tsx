import { LessonPlan } from "@workspace/api-client-react";
import { DashboardCard } from "./dashboard-card";
import { Target, Clock, BrainCircuit, Play, FileText, CheckCircle2, Star, ListChecks, Shapes, PenTool, LayoutTemplate, Layers, Monitor, Gamepad2 } from "lucide-react";
import { Progress } from "@/components/ui/display";

function getActivityLabel(type: string): string {
  switch (type) {
    case "individual": return "فردي";
    case "group": return "جماعي";
    case "discussion": return "مناقشة";
    case "practical": return "عملي";
    case "digital": return "رقمي تفاعلي";
    default: return type;
  }
}

function getDigitalPlatform(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("kahoot")) return "Kahoot";
  if (lowerName.includes("quizizz")) return "Quizizz";
  if (lowerName.includes("gimkit")) return "Gimkit";
  if (lowerName.includes("mentimeter")) return "Mentimeter";
  if (lowerName.includes("padlet")) return "Padlet";
  if (lowerName.includes("nearpod")) return "Nearpod";
  return "منصة تفاعلية";
}

export function LessonView({ lesson, selectedOutcomes }: { lesson: LessonPlan; selectedOutcomes?: string[] }) {
  const totalMins = Object.values(lesson.timeDistribution).reduce((a, b) => a + b, 0);
  const getPercent = (mins: number) => (mins / totalMins) * 100;

  const regularActivities = lesson.activities.filter((a) => a.type !== "digital");
  const digitalActivities = lesson.activities.filter((a) => a.type === "digital");
  const hasOutcomes = selectedOutcomes && selectedOutcomes.length > 0;

  return (
    <div className="space-y-6">
      
      {/* Header Summary */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-2 h-full bg-primary" />
        
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">{lesson.title}</h2>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground font-medium">
            <span className="bg-muted px-2.5 py-1 rounded-md">{lesson.stage}</span>
            <span className="bg-muted px-2.5 py-1 rounded-md">{lesson.grade}</span>
            <span className="bg-muted px-2.5 py-1 rounded-md">{lesson.subject}</span>
            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {lesson.duration} دقيقة
            </span>
          </div>
        </div>

      </div>

      {/* Selected Learning Outcomes */}
      {hasOutcomes && (
        <DashboardCard
          title="نواتج التعلم"
          icon={<ListChecks className="w-5 h-5 text-emerald-600" />}
          colorVariant="green"
          delay={0}
        >
          <ul className="space-y-2">
            {selectedOutcomes!.map((outcome, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full p-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-foreground">{outcome}</span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          <DashboardCard 
            title="أهداف الدرس" 
            icon={<Target className="w-5 h-5 text-blue-600" />}
            colorVariant="blue"
            delay={0.1}
          >
            <ul className="space-y-3">
              {lesson.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full p-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-foreground">{obj}</span>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard 
            title="التمهيد والمقدمة" 
            icon={<Play className="w-5 h-5 text-purple-600" />}
            colorVariant="purple"
            delay={0.2}
          >
            <p className="whitespace-pre-wrap">{lesson.introduction}</p>
          </DashboardCard>

          <DashboardCard 
            title="المحتوى الرئيسي" 
            icon={<FileText className="w-5 h-5 text-primary" />}
            colorVariant="primary"
            delay={0.3}
          >
            <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed font-arabic">
              <p className="whitespace-pre-wrap">{lesson.mainContent}</p>
            </div>
          </DashboardCard>

          <DashboardCard 
            title="الأنشطة التعليمية" 
            icon={<Shapes className="w-5 h-5 text-green-600" />}
            colorVariant="green"
            delay={0.4}
            className="overflow-visible"
          >
            <div className="space-y-4">
              {regularActivities.map((activity, i) => (
                <div key={i} className="bg-background border rounded-xl p-4 hover:border-green-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{activity.name}</h4>
                    <div className="flex gap-2">
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 px-2 py-1 rounded-full font-medium">
                        {getActivityLabel(activity.type)}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.duration} د
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{activity.description}</p>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Digital Activity Card */}
          {digitalActivities.length > 0 && (
            <DashboardCard 
              title="النشاط الرقمي التفاعلي" 
              icon={<Gamepad2 className="w-5 h-5 text-violet-600" />}
              colorVariant="accent"
              delay={0.45}
              className="overflow-visible"
            >
              <div className="space-y-4">
                {digitalActivities.map((activity, i) => {
                  const platform = getDigitalPlatform(activity.name);
                  return (
                    <div key={i} className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600">
                            <Gamepad2 className="w-4 h-4" />
                          </div>
                          <h4 className="font-bold text-lg text-violet-900 dark:text-violet-100">{activity.name}</h4>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full font-bold border border-violet-200 dark:border-violet-700">
                            {platform}
                          </span>
                          <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.duration} د
                          </span>
                        </div>
                      </div>
                      <p className="text-violet-800 dark:text-violet-200 text-sm leading-relaxed">{activity.description}</p>
                      <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-700">
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                          💡 يمكن إعداد هذا النشاط مسبقاً على {platform} ومشاركة رمز الانضمام مع الطلاب
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          )}

          <DashboardCard 
            title="التقويم والتقييم" 
            icon={<ListChecks className="w-5 h-5 text-amber-600" />}
            colorVariant="amber"
            delay={0.5}
          >
            <p className="whitespace-pre-wrap">{lesson.assessment}</p>
          </DashboardCard>
          
          <DashboardCard 
            title="الخاتمة" 
            icon={<Star className="w-5 h-5 text-primary" />}
            delay={0.6}
          >
            <p className="whitespace-pre-wrap">{lesson.closure}</p>
          </DashboardCard>

        </div>

        {/* Right Column (Sidebar metrics & strategies) */}
        <div className="space-y-6">
          
          <DashboardCard 
            title="توزيع الوقت" 
            icon={<Clock className="w-5 h-5 text-indigo-600" />}
            delay={0.2}
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>التمهيد</span>
                  <span className="text-indigo-600">{lesson.timeDistribution.introduction} د</span>
                </div>
                <Progress value={getPercent(lesson.timeDistribution.introduction)} className="h-2 bg-indigo-100 [&>div]:bg-indigo-500" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>الشرح والعرض</span>
                  <span className="text-blue-600">{lesson.timeDistribution.explanation} د</span>
                </div>
                <Progress value={getPercent(lesson.timeDistribution.explanation)} className="h-2 bg-blue-100 [&>div]:bg-blue-500" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>الأنشطة والتطبيق</span>
                  <span className="text-green-600">{lesson.timeDistribution.activity} د</span>
                </div>
                <Progress value={getPercent(lesson.timeDistribution.activity)} className="h-2 bg-green-100 [&>div]:bg-green-500" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>التقويم والخاتمة</span>
                  <span className="text-amber-600">{lesson.timeDistribution.assessment} د</span>
                </div>
                <Progress value={getPercent(lesson.timeDistribution.assessment)} className="h-2 bg-amber-100 [&>div]:bg-amber-500" />
              </div>
            </div>
          </DashboardCard>

          <DashboardCard 
            title="استراتيجيات التعلم" 
            icon={<BrainCircuit className="w-5 h-5 text-teal-600" />}
            delay={0.3}
          >
            <div className="flex flex-wrap gap-2">
              {lesson.strategies.map((strategy, i) => (
                <span key={i} className="px-3 py-1.5 bg-secondary/10 text-secondary-foreground border border-secondary/20 rounded-lg text-sm font-medium">
                  {strategy}
                </span>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard 
            title="الوسائل التعليمية" 
            icon={<LayoutTemplate className="w-5 h-5 text-rose-600" />}
            delay={0.4}
          >
            <ul className="list-disc list-inside space-y-1 text-sm mr-2 marker:text-rose-500">
              {lesson.materials.map((material, i) => (
                <li key={i} className="text-foreground">{material}</li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard 
            title="التعليم المتمايز" 
            icon={<Layers className="w-5 h-5 text-fuchsia-600" />}
            colorVariant="accent"
            delay={0.5}
          >
            <div className="space-y-4 text-sm">
              <div className="bg-background rounded-lg p-3 border-l-4 border-l-fuchsia-500">
                <h5 className="font-bold text-fuchsia-700 mb-1">الموهوبين</h5>
                <p className="text-muted-foreground">{lesson.differentiatedInstructions.advanced}</p>
              </div>
              <div className="bg-background rounded-lg p-3 border-l-4 border-l-blue-500">
                <h5 className="font-bold text-blue-700 mb-1">المتوسطين</h5>
                <p className="text-muted-foreground">{lesson.differentiatedInstructions.average}</p>
              </div>
              <div className="bg-background rounded-lg p-3 border-l-4 border-l-orange-500">
                <h5 className="font-bold text-orange-700 mb-1">دعائم التعلم</h5>
                <p className="text-muted-foreground">{lesson.differentiatedInstructions.needsSupport}</p>
              </div>
            </div>
          </DashboardCard>
          
          {lesson.homework && (
            <DashboardCard 
              title="الواجب المنزلي" 
              icon={<PenTool className="w-5 h-5 text-indigo-600" />}
              delay={0.6}
            >
              <p className="text-sm">{lesson.homework}</p>
            </DashboardCard>
          )}
          {lesson.madrasatiHomework && (
            <DashboardCard 
              title="واجب منصة مدرستي" 
              icon={<Monitor className="w-5 h-5 text-emerald-600" />}
              delay={0.65}
            >
              <p className="text-sm">{lesson.madrasatiHomework}</p>
            </DashboardCard>
          )}
          
        </div>
      </div>
    </div>
  );
}
