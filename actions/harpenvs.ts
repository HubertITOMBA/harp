"use server";

import * as z from "zod";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import prisma from "@/lib/prisma";


export const getharpEnv = async (id: any) => {
      
     const DescEnvs = await prisma.psadm_env.findMany(
      {
        //relationLoadStrategy: 'join', // or 'query'
        where: {
            typenvid: parseInt(id),
          },
          include: {
          psadm_rolesrv: {
             select : { 
                env : true,
                typsrv : true,
                status : true,
              }
          },
           psadm_oracle : true,
           psadm_dispo: { 
              orderBy: {
                fromdate: 'asc',
            },
            take: 1
          }, 
          psadm_typenv: true,
          psadm_release: true,  
          psadm_ptools: true,   
          psadm_appli: true,
         
        },
        orderBy: {
          harprelease: "desc",
        }
    });




   
   return DescEnvs;

   
};
