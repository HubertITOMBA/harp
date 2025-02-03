import type { Metadata } from "next";
// import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import HeaderLayout from "@/components/home/HeaderLayout";
import FooterLayout from "@/components/home/FooterLayout";
import HarpBandeau from "@/components/home/HarpBandeau";
import { Toaster } from "@/components/ui/toaster";
import { ToastContainer } from 'react-toastify'
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@/components/theme-provider";





const montserrat = localFont({
  src: [
    { path: "../fonts/Montserrat-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Montserrat-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Montserrat-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Montserrat-Bold.ttf", weight: "700", style: "normal" },
  ],
});



export const metadata: Metadata = {
  title: "Portail Harp",
  description: "Gestion des environnements Harp",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning={true}>
      <head>
          <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
      </head> 
      <body
            className={`${montserrat.className}  antialiased`}
      >
            <ThemeProvider 
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
            >
                  <div className=" h-screen bg-green-50">
                      {modal}
                      {children}
                    
                      {/* <SonnerToaster /> */}
                      {/* <Toaster />  */}
                      {/* <ToastContainer position='top-center'/> */}
                      <ToastContainer theme='colored' />
                  </div>
            </ThemeProvider>
      </body>
    </html>
  );
}
