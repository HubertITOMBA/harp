import type { Metadata } from "next";
// import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import HeaderLayout from "@/components/home/HeaderLayout";
import FooterLayout from "@/components/home/FooterLayout";
import HarpBandeau from "@/components/home/HarpBandeau";
import { Toaster } from "@/components/ui/toaster";
import { ToastContainerWrapper } from "@/components/ui/toast-container-wrapper";
import { APP_DESCRIPTION, APP_NAME, SERVER_URL, } from "@/lib/constants";


const montserrat = localFont({
  src: [
    { path: "../fonts/Montserrat-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Montserrat-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Montserrat-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Montserrat-Bold.ttf", weight: "700", style: "normal" },
  ],
});



export const metadata: Metadata = {
  title: {
    template: `%s | Portail TMA Harp`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  // metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
          <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
      </head> 
      <body
            className={`${montserrat.className} antialiased min-h-screen grid grid-rows-[auto_1fr_auto]`}
      >
            <div className=" h-screen">
                {modal}
                {children}
              
                {/* <SonnerToaster /> */}
                {/* <Toaster />  */}
                <ToastContainerWrapper />
            </div>
      </body>
    </html>
  );
}
