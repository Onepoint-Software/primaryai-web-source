import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/src/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "teacher@school.org" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email;
        const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
        if (!email || !email.includes("@")) {
          return null;
        }

        const user = await prisma.user.upsert({
          where: { email },
          create: { email, name: email.split("@")[0] },
          update: {},
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
      }
      return session;
    },
  },
});
