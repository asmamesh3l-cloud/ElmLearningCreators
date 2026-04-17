import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, User } from "lucide-react";
import { useAppStore } from "../lib/store";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { teacherName, setTeacherName, setCurrentLesson, clearChatHistory } = useAppStore();

  // If no teacher name is set, redirect to home
  useEffect(() => {
    if (!teacherName && window.location.pathname !== '/') {
      setLocation('/');
    }
  }, [teacherName, setLocation]);

  const handleLogout = () => {
    setTeacherName('');
    setCurrentLesson(null);
    clearChatHistory();
    setLocation('/');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground" dir="rtl">
      {/* Header */}
      {teacherName && (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <div className="container flex h-16 max-w-7xl items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold leading-tight text-primary">نبراس</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
                  Intelligent Assistant
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
                <User className="h-4 w-4 text-secondary-foreground" />
                <span className="text-sm font-medium text-secondary-foreground">أهلاً بك، أ. {teacherName}</span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4 ml-2" />
                <span className="hidden sm:inline-block">تسجيل خروج</span>
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
