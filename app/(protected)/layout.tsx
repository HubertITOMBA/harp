
import type { Metadata } from "next";

import Link from "next/link";
import Image from 'next/image'
import React from 'react'
import Menu from "@/components/home/Menu";
import Navbar from "@/components/home/Navbar";

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";



export default async function HarpLayout ( {
   children,
}: Readonly<{
  children: React.ReactNode;
}>) {

   const session = await auth();
   console.log(`MA SESSION ON LAYAOUT PROTECTED : ${session}`);
   console.log(`MA SESSION ON LAYAOUT SESSION PROTECTED : ${session?.user?.customField}`);
   const roles = session?.user?.customField || [];

      // Fonction pour compter les sessions actives
      // const getActiveSessionCount = async () => {
      //   try {
      //     const response = await fetch('/api/sessions/count');
      //     const data = await response.json();
      //     return data.count;
      //   } catch (error) {
      //     console.error('Erreur lors du comptage des sessions:', error);
      //     return 0;
      //   }
      // };
    
    
      // const activeSessionCount = await getActiveSessionCount();
      const activeSessionCount = 1;

  return (
    <div className="h-screen flex">
       <SessionProvider session={session}>
          <div className="w-[14%] md:w[8%] lg:w-[16%] xl:w-[14%]p-4">
              <Link href="/" className="flex items-center justify-center gap-2">
                  <Image className="h-100 w-100 ml-2 mt-5  object-cover" src="/images/OPSE_logo.gif" width={250} height={50} alt="logo" />    
              </Link>
              
              <Menu  DroitsUser = {roles} sessionCount={activeSessionCount} />
              
          </div>
          <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
              <Navbar   DroitsUser = {roles}/>
               { children }
               
          </div>
        </SessionProvider> 
    </div>
  )
  
};
 