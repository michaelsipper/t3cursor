import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(
      "mx-auto w-full max-w-[480px] px-4 pb-[72px]", // Increased width and adjusted bottom padding to match footer height
      className
    )}>
      {children}
    </div>
  );
} 