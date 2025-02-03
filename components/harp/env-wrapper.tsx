"use client"

import { Card, CardContent, CardHeader, CardFooter  } from "@/components/ui/card"
import prisma from "@/lib/prisma";

interface EnvWrapperProps {
    envName: string;
    // typenvName: string;
    // children: React.ReactNode;
    // oracleSid: string;
    // backButtonLabel: string;
    // backButtonHref: string;
};

// AND d.fromdate = (SELECT MAX(fromdate) FROM psadm_dispo x WHERE x.env=d.env and x.fromdate <= now())  ORDER BY e.env;


export const EnvWrapper = async ({ 
    envName,
    // typenvName,
    // children,
    // oracleSid,
    // backButtonLabel,
    // backButtonHref,
}: EnvWrapperProps) => {

    const psadmsrv = await prisma.psadm_srv.findMany(
        { where : {
          env: envName,
          },
        }
      );


    return(
        <div className="w-[900px] shadow-lg"
        >
            {psadmsrv.map(i => 
            <div className="flex gap-2 text-xl" key={i.env}>
                {i.psuser} 
                {i.ip} 
                {i.env}
                {i.os} 
                {i.pshome} 
            </div>
             )}
             {/* { children} */}
        </div>
    )

}