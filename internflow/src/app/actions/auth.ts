"use server";

import { signIn, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users, companyRegistrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sanitize, validateEmail } from "@/lib/validation";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  try {
    const userId = session.user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return { error: "User not found" };
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { error: "Incorrect current password" };
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    
    await db.update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (err) {
    console.error("Password change error:", err);
    return { error: "Failed to update password" };
  }
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!email || !password || !role) {
    return { error: "Please fill in all fields" };
  }

  try {
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      role,
    });
    
    // In NextAuth v5 Server Actions, redirect: false might just return without throwing
    return { success: true, redirectUrl: getRedirectUrl(role) };
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password for this role." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    
    // Check if it's a redirect error (which next-auth throws when successful if redirect: true, but we used redirect: false, though sometimes next-auth still throws it)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return { success: true, redirectUrl: getRedirectUrl(role) };
    }
    
    throw error; // Re-throw non-auth errors
  }
}

function getRedirectUrl(role: string): string {
  switch (role) {
    case "student":
      return "/dashboard/student";
    case "tutor":
    case "placement_coordinator":
    case "hod":
      return "/dashboard/staff";
    case "dean":
    case "placement_officer":
    case "principal":
    case "coe":
    case "mcr":
    case "placement_head":
    case "management_corporation":
      return "/dashboard/admin";
    case "company":
    case "company_staff":
      return "/dashboard/company";
    default:
      return "/";
  }
}
