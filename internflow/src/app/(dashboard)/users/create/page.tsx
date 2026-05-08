import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateUserClient } from "./CreateUserClient";
import { getCollegeHierarchy } from "@/app/actions/hierarchy";

export default async function CreateUserPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const currentRole = session.user.role || "";
  const collegeHierarchy = await getCollegeHierarchy();

  return <CreateUserClient currentRole={currentRole} collegeHierarchy={collegeHierarchy} />;
}
