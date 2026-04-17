import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  delay?: number;
  colorVariant?: "primary" | "secondary" | "accent" | "muted" | "blue" | "purple" | "amber" | "green";
}

export function DashboardCard({ 
  title, 
  icon, 
  children, 
  className, 
  headerClassName,
  delay = 0,
  colorVariant = "primary"
}: DashboardCardProps) {
  
  const variants = {
    primary: "border-primary/20 bg-primary/5 text-primary",
    secondary: "border-secondary/20 bg-secondary/5 text-secondary-foreground",
    accent: "border-accent-foreground/20 bg-accent text-accent-foreground",
    muted: "border-muted-foreground/20 bg-muted/50 text-muted-foreground",
    blue: "border-blue-500/20 bg-blue-50/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400",
    purple: "border-purple-500/20 bg-purple-50/50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400",
    amber: "border-amber-500/20 bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400",
    green: "border-green-500/20 bg-green-50/50 text-green-700 dark:bg-green-950/20 dark:text-green-400",
  };

  const headerColor = variants[colorVariant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col hover-elevate transition-all duration-300",
        className
      )}
    >
      <div className={cn("px-6 py-4 border-b flex items-center gap-3", headerColor, headerClassName)}>
        {icon && <div className="p-1.5 rounded-md bg-white/50 dark:bg-black/20 backdrop-blur-sm shadow-sm">{icon}</div>}
        <h3 className="font-serif text-lg font-bold">{title}</h3>
      </div>
      <div className="p-6 font-arabic leading-relaxed text-base flex-1">
        {children}
      </div>
    </motion.div>
  );
}
