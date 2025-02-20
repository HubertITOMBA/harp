import Link from "next/link";
import Image from 'next/image'
import FooterLayout from '@/components/home/FooterLayout'
import HarpBandeau from '@/components/home/HarpBandeau'
import HeaderLayout from '@/components/home/HeaderLayout'
import React from 'react'

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";


import Navbar from "@/components/home/Navbar";
import MenuDash from "@/components/harp/MenuDash";



export default async function HarpLayout ( {
   children,
}: Readonly<{
  children: React.ReactNode;
}>) {

    const session = await auth();
    const roles = session?.user?.customField || [];

    // Fonction pour compter les sessions actives
  //   const getActiveSessionCount = async () => {
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
    <div className="flex h-screen">
       <SessionProvider session={session}>
       <div className="w-[14%] md:w[8%] lg:w-[16%] xl:w-[14%]p-4">
        <Link href="/" className="flex items-center justify-center gap-2">
            <Image className="h-100 w-100 ml-2 mt-5  object-cover" src="/images/OPSE_logo.gif" width={250} height={50} alt="logo" />    
         </Link>
        <MenuDash   DroitsUser = {roles} sessionCount={activeSessionCount} />
        </div>
        <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
        {/* <div className="w-[86%] md:w[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll"> */}
          <Navbar   DroitsUser = {roles}/>
       
        { children }
       
        </div>
 
        </SessionProvider>
    </div>
  );
  
};
 