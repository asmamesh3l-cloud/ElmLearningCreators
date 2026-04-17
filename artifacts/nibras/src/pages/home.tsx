import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const [, setLocation] = useLocation();
  const { teacherName, setTeacherName } = useAppStore();
  const [nameInput, setNameInput] = useState(teacherName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    
    setIsSubmitting(true);
    // Simulate slight delay for polish
    setTimeout(() => {
      setTeacherName(nameInput.trim());
      setLocation("/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background relative overflow-hidden" dir="rtl">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      
      <div className="flex-1 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center px-6 py-12 relative z-10">
        
        {/* Left Column - Form */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col justify-center space-y-8 max-w-md"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>مدعوم بتقنية نهى الذكية</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-foreground leading-[1.2]">
              <img src="/logo.png" alt="نبراس" className="h-16 sm:h-20 lg:h-24 w-auto mb-2" /><br/>
              <span className="text-primary">المساعد الذكي</span><br/>
              للمعلم الجديد
            </h1>
            
            <p className="text-lg text-muted-foreground font-arabic leading-relaxed mt-4">
              نبراس: مساعد ذكي يدعم المعلم في تخطيط الدروس، ولا يُعد بديلاً عن دوره التربوي والمهني
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl border shadow-xl shadow-primary/5 relative">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground shadow-lg rotate-12">
              <BookOpen className="w-6 h-6" />
            </div>
            
            <div className="space-y-3">
              <label htmlFor="teacherName" className="block text-sm font-bold text-foreground">
                الاسم الكريم
              </label>
              <Input
                id="teacherName"
                type="text"
                placeholder="مثال: أحمد العبدالله"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-12 text-lg bg-background border-border/60 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                autoFocus
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={!nameInput.trim() || isSubmitting}
              className="w-full h-12 text-base font-bold rounded-xl shadow-md hover:shadow-lg transition-all group"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الدخول...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>البدء في إعداد الدروس</span>
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Right Column - Visual/Hero */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="hidden lg:flex flex-col justify-center items-center relative"
        >
          <div className="relative w-full aspect-square max-w-[500px]">
            {/* Abstract representation of Nibras App */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2.5rem] rotate-3 backdrop-blur-3xl border border-white/50 shadow-2xl" />
            <div className="absolute inset-4 bg-card rounded-[2rem] shadow-xl overflow-hidden border border-border/50 flex flex-col p-6 gap-4 transform -rotate-2 hover:rotate-0 transition-transform duration-700">
              
              <div className="w-full h-8 bg-muted/50 rounded-lg flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="w-2/3 h-8 bg-primary/10 rounded-md" />
                <div className="w-full h-4 bg-muted rounded-md" />
                <div className="w-5/6 h-4 bg-muted rounded-md" />
                <div className="w-4/6 h-4 bg-muted rounded-md" />
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="h-24 bg-blue-50 border border-blue-100 rounded-xl" />
                  <div className="h-24 bg-green-50 border border-green-100 rounded-xl" />
                </div>
                
                <div className="w-full h-32 bg-amber-50/50 border border-amber-100 rounded-xl mt-4" />
              </div>
            </div>
            
            {/* Floating Badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-6 top-24 bg-white px-4 py-3 rounded-xl shadow-lg border border-border/50 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold">بوابة عين</div>
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute -left-8 bottom-32 bg-white px-4 py-3 rounded-xl shadow-lg border border-border/50 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold">خطة درس جاهزة</div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <footer className="w-full text-center py-3 text-xs text-muted-foreground border-t border-border/40 mt-auto">
        تم انشاء النموذج الأولي بواسطة فريق صُنَّاع التعلم الذكي - ذكاءثون 2026م
      </footer>
    </div>
  );
}
