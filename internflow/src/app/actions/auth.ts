"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

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

