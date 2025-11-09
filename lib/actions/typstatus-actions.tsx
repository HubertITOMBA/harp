"use server";

import { db } from "@/lib/db";

// Get single status by its id
export async function getTypeStatusById(id: string | number) {
  const statusId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  if (isNaN(statusId)) {
    return null;
  }
  
  return await db.statutenv.findUnique({
    where: { id: statusId },
    include: {
      envsharp: {
        select: {
          id: true,
          env: true,
          descr: true,
        }
      },
      harpserve: {
        select: {
          id: true,
          srv: true,
        }
      },
      harpenvserv: {
        select: {
          id: true,
        }
      },
      harpenvdispo: {
        select: {
          id: true,
        }
      }
    }
  });
}

