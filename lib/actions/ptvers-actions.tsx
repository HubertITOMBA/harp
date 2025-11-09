"use server";

import { db } from "@/lib/db";

// Get single version by its ptversion
export async function getPtVersById(ptversion: string) {
  return await db.psadm_ptools.findUnique({
    where: { ptversion },
    include: {
      psadm_env: {
        select: {
          env: true,
          descr: true,
          site: true,
        }
      }
    }
  });
}

