import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Officer Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Invalid credentials");
          }

          const data = await res.json();
          return {
            id: data.officer.id,
            name: data.officer.name,
            email: data.officer.email,
            role: data.officer.role,
            departmentId: data.officer.department_id,
            departmentName: data.officer.department_name,
            wardId: data.officer.ward_id,
            accessToken: data.token,
          };
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
        token.wardId = user.wardId;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.departmentId = token.departmentId as string;
      session.user.departmentName = token.departmentName as string;
      session.user.wardId = token.wardId as string | null;
      session.accessToken = token.accessToken as string;
      return session;
    },
  },

  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET || "jansunwai-dev-secret-change-in-production",
};
