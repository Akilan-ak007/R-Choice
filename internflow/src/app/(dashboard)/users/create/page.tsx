import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateUserClient } from "./CreateUserClient";

export default async function CreateUserPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const currentRole = session.user.role || "";

  return <CreateUserClient currentRole={currentRole} />;
}
