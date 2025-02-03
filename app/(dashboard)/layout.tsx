import Link from "next/link";
import Image from 'next/image'
import FooterLayout from '@/components/home/FooterLayout'
import HarpBandeau from '@/components/home/HarpBandeau'
import HeaderLayout from '@/components/home/HeaderLayout'
import React from 'react'
import Navbar from "@/components/home/Navbar";
import MenuDash from "@/components/harp/MenuDash";



export default async function HarpLayout ( {
   children,
}: Readonly<{
  children: React.ReactNode;
}>) {

 // const session = await auth();

  return (
    <div className="h-screen flex">
       <div className="w-[14%] md:w[8%] lg:w-[16%] xl:w-[14%]p-4">
        <Link href="/" className="flex items-center justify-center gap-2">
            <Image className="h-100 w-100 ml-2 mt-5  object-cover" src="/images/OPSE_logo.gif" width={250} height={50} alt="logo" />    
         </Link>
        <MenuDash />
        </div>
        <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
        {/* <div className="w-[86%] md:w[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll"> */}
          <Navbar />
         {/* <HarpBandeau /> */}
      {/*   <HeaderLayout /> */}
        { children }
        {/* <FooterLayout /> */}
        </div>
    </div>
  );
  
};
 