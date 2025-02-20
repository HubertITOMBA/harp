import { db } from "@/lib/db";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({ where: { email } });

    return user;
  } catch {
    return null;
  }
};

export const getUserByNetId = async (netid: string) => {
  try {
    const user = await db.user.findUnique({ where: { netid } });
    return user;
  } catch {
    return null;
  }
};


export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } });

    return user;
  } catch {
    return null;
  }
};


export const getServeName = async (srv: string) => {
  try {
    const server = await db.psadm_srv.findUnique({ where: { srv } });

    return server;
  } catch {
    return null;
  }
};

