// app/(auth)/layout.tsx
import { AuthProvider } from "@/contexts/AuthContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-full max-w-md p-6">{children}</div>
      </div>
    </AuthProvider>
  );
}