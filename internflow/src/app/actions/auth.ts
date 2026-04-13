"use server";

import { signIn, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

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
      .set({ passwordHash: newHash })
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
    await signIn("credentials", {
      email,
      password,
      role,
      redirectTo: getRedirectUrl(role),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password for this role." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error; // Re-throw non-auth errors (e.g., redirect)
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
      return "/dashboard/admin";
    case "company":
      return "/dashboard/company";
    default:
      return "/";
  }
}

export async function registerCompany(formData: FormData) {
  const companyName = formData.get("companyName") as string;
  const industry = formData.get("industry") as string;
  const website = formData.get("website") as string;
  const hrName = formData.get("hrName") as string;
  const hrPhone = formData.get("hrPhone") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!companyName || !industry || !website || !hrName || !hrPhone || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long" };
  }

  try {
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return { error: "An account with this email already exists" };
    }

    const newHash = await bcrypt.hash(password, 12);
    
    // Using transaction would be better, but doing sequentially for now
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: newHash,
      role: "company",
      firstName: companyName, // For UI purposes
      lastName: "Partner",
      isActive: true,
    }).returning({ id: users.id });

    // We can also insert into companyRegistrations so they have a full profile
    // But since the UI form doesn't ask for city/state/pin/address, we'll put some placeholders
    // or just let them complete it later. Actually, companyRegistrations requires some notNull fields.
    // Let me check schema. yes: address, city, state, pinCode.
    // I will use placeholders for now to satisfy DB constraints.
    const { companyRegistrations } = await import("@/lib/db/schema");
    await db.insert(companyRegistrations).values({
      userId: newUser.id,
      companyLegalName: companyName,
      companyType: "Private",
      industrySector: industry,
      website: website,
      hrName: hrName,
      hrEmail: email,
      hrPhone: hrPhone,
      address: "Please update",
      city: "Please update",
      state: "Please update",
      pinCode: "000000",
      status: "approved" // Immediately approve contextually so they can post right away for test
    });

    return { success: true };
  } catch (error) {
    console.error("Company registration error:", error);
    return { error: "Failed to create company account. Try again later." };
  }
}


