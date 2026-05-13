import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, companyRegistrations } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import BulkApprovalClient from "./BulkApprovalClient";

export const dynamic = "force-dynamic";
export default async function JobApprovalsPage(props: { searchParams: Promise<{ queue?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  if (!["placement_officer", "management_corporation", "mcr"].includes(role)) {
    redirect("/");
  }

  const searchParams = await props.searchParams;
  const queue = searchParams.queue || (role === "placement_officer" ? "po" : "mcr");
  const targetStatuses: Array<"pending_review" | "pending_mcr_approval"> = queue === "po" ? ["pending_review"] : ["pending_mcr_approval"];

  const jobs = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      companyId: companyRegistrations.id,
      companyName: companyRegistrations.companyLegalName,
      stipend: jobPostings.stipendSalary,
      location: jobPostings.location,
      description: jobPostings.description,
      requiredSkills: jobPostings.requiredSkills,
      openingsCount: jobPostings.openingsCount,
      createdAt: jobPostings.createdAt
    })
    .from(jobPostings)
    .leftJoin(companyRegistrations, eq(jobPostings.companyId, companyRegistrations.id))
    .where(inArray(jobPostings.status, targetStatuses))
    .orderBy(desc(jobPostings.createdAt));

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <h1>Job Postings Review</h1>
        <p>
          Review and approve internship and job opportunities before they become visible to students and staff.
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
          <Link href="/approvals/jobs?queue=po" className={queue === "po" ? "btn btn-primary" : "btn btn-outline"} style={{ textDecoration: "none" }}>
            PO Review Queue
          </Link>
          <Link href="/approvals/jobs?queue=mcr" className={queue === "mcr" ? "btn btn-primary" : "btn btn-outline"} style={{ textDecoration: "none" }}>
            MCR Review Queue
          </Link>
        </div>
      </div>

      <BulkApprovalClient jobs={jobs} />
    </div>
  );
}
