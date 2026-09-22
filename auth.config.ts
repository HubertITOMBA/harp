import type { NextAuthConfig, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUserByNetId } from "@/data/user";
import { authorizeCredentials } from "@/lib/password";

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const user = await authorizeCredentials(credentials, getUserByNetId);
        return user as User | null;
      },
    }),
  ],
} satisfies NextAuthConfig;
