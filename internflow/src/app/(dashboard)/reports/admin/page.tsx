import { auth } from "@/lib/auth";
import { fetchReportFilterOptions } from "@/app/actions/analyticsReports";
import { redirect } from "next/navigation";
import ReportsClient from "./ReportsClient";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const allowedRoles = ["dean", "placement_officer", "coe", "placement_head", "management_corporation", "principal", "hod", "placement_coordinator", "mcr"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/");
  }

  // Fetch unique values for filter dropdowns directly from the server
  const filterOptions = await fetchReportFilterOptions();

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="page-header">
        <h1>Institutional Placement Reports</h1>
        <p>
          Generate and export detailed, differentiated reports for student internships and full-time employment. 
          Use the filters below to segment data by school, department, batch, and more.
        </p>
      </div>

      <ReportsClient filterOptions={filterOptions} />
    </div>
  );
}
