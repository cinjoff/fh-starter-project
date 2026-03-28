export type MemberRole = "owner" | "admin" | "member";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  createdAt: Date;
}

export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: MemberRole;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
