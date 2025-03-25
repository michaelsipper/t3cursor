// app/layout.tsx

import { FooterNav } from '@/components/layout/footer-nav';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { AppProvider } from "@/components/shared/AppContext";
import { AuthProvider } from "@/components/shared/AuthContext";
import { PlanProvider } from "@/components/shared/PlanContext";
import { PlanActionsProvider } from "@/components/shared/PlanActionsContext";

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
 title: "Tap'dIn",
 description: 'Social Planning App',
};

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
   <html lang="en" suppressHydrationWarning>
     <head>
       <meta name="apple-mobile-web-app-capable" content="yes" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     </head>
     <body className={inter.className}>
       <AuthProvider>
         <AppProvider>
           <PlanProvider>
             <PlanActionsProvider>
               <ThemeProvider
                 attribute="class"
                 defaultTheme="dark"
                 enableSystem={true}
                 disableTransitionOnChange
               >
                 <div className="min-h-screen flex flex-col">
                   <main className="flex-1 pb-16">{children}</main>
                   <FooterNav />
                 </div>
               </ThemeProvider>
             </PlanActionsProvider>
           </PlanProvider>
         </AppProvider>
       </AuthProvider>
     </body>
   </html>
 );
}