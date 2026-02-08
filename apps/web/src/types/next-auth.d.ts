import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    departmentId: string;
    departmentName: string;
    wardId: string | null;
    accessToken: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      departmentId: string;
      departmentName: string;
      wardId: string | null;
    };
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    departmentId: string;
    departmentName: string;
    wardId: string | null;
    accessToken: string;
  }
}
