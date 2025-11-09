"use server";

import { db } from "@/lib/db";

// Get single harparam by param
export async function getHarParamById(param: string) {
  return await db.psadm_param.findUnique({
    where: { param },
  });
}

