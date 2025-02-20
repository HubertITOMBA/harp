"use server";

import * as z from "zod";
import { toast } from "react-toastify";
import prisma  from "@/lib/prisma";


// Get single product by it's slug
export async function getHarpRoleById(id: string) {
    return await prisma.harproles.findFirst({
      where: { id: parseInt(id) },
    });
  }


  