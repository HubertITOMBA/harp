"use server";

import { db } from "@/lib/db";

// Get single release by its harprelease
export async function getHarpVersById(harprelease: string) {
  return await db.psadm_release.findUnique({
    where: { harprelease },
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

