"use server";

import { db } from "@/lib/db";

// Get single tool by tool
export async function getToolsById(tool: string) {
  return await db.harptools.findFirst({
    where: { tool },
  });
}

