"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  Award,
  Briefcase,
  Calendar,
  Check,
  CheckSquare,
  ChevronRight,
  Clock3,
  Code,
  Download,
  ExternalLink,
  GraduationCap,
  MapPin,
  Milestone,
  Star,
  StarOff,
  Target,
  UserCircle,
  Video,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { fetchFullStudentProfile } from "@/app/actions/profile";
import { postCompanyResults, recordApplicantRoundOutcome, shortlistApplicant, toggleApplicantRoundScheduled } from "@/app/actions/applications";
import { exportToCSV } from "@/lib/export-utils";

function getInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0).toUpperCase() || "S";
  const last = lastName.trim().charAt(0).toUpperCase() || "";
  return `${first}${last}`.trim();
}

type ApplicantRow = {
  id: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  status: string | null;
  appliedAt: string | Date | null;
  jobId: string;
  jobTitle: string;
  resumeUrl: string | null;
};

type JobWorkflowSummary = {
  id: string;
  title: string;
  status: string | null;
  totalApplicants: number;
  shortlistedCount: number;
  roundScheduledCount: number;
  selectedCount: number;
  rounds: Array<{
    id: string;
    roundNumber: number;
    roundName: string;
    roundType: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    mode: string | null;
    meetLink: string | null;
    location: string | null;
    description: string | null;
  }>;
};

type FullProfile = {
  user: { avatarUrl?: string | null; firstName: string; lastName: string; email: string; phone?: string | null };
  profile: { department?: string | null; year?: number | null; section?: string | null; professionalSummary?: string | null; cgpa?: string | null; profileCompletionScore?: number | null };
  education: Array<{ degree: string; fieldOfStudy?: string | null; institution: string; startYear?: number | null; endYear?: number | null; score?: string | null }>;
  projects: Array<{ title: string; projectUrl?: string | null; description?: string | null }>;
  skills: Array<{ skillName: string; skillType?: string | null; proficiency?: string | null }>;
  certs: Array<{ name: string; issuingOrg?: string | null; credentialUrl?: string | null }>;
  links: Array<{ platform?: string | null; url?: string | null; title?: string | null }>;
};

type ApplicantRoundProgressRow = {
  applicationId: string;
  roundId: string;
  roundNumber: number;
  roundName: string;
  roundType: string | null;
  progressStatus: string;
  reviewedAt: string | Date | null;
};

function statusLabel(status: string | null) {
  if (status === "selected") return "Selected";
  if (status === "round_scheduled") return "Round Scheduled";
  if (status === "shortlisted") return "Shortlisted";
  return "Applied";
}

function statusClass(status: string | null) {
  if (status === "selected") return "status-approved";
  if (status === "round_scheduled") return "status-pending";
  if (status === "shortlisted") return "status-pending";
  return "status-draft";
}

function isApplicantReadyForFinalResult(
  applicant: ApplicantRow,
  job: JobWorkflowSummary,
  roundProgressByApplication: Record<string, ApplicantRoundProgressRow[]>
) {
  if (!["shortlisted", "round_scheduled"].includes(applicant.status || "")) {
    return false;
  }

  if (job.rounds.length === 0) {
    return true;
  }

  const progress = roundProgressByApplication[applicant.applicationId] || [];
  const clearedRoundIds = new Set(
    progress.filter((item) => item.progressStatus === "cleared").map((item) => item.roundId)
  );
  const hasScheduledRound = progress.some((item) => item.progressStatus === "scheduled");

  return !hasScheduledRound && job.rounds.every((round) => clearedRoundIds.has(round.id));
}

export default function ApplicantsClient({
  initialApplicants,
  jobs,
  roundProgressByApplication,
  currentPage = 1,
  totalPages = 1,
  selectedJobId = "all",
  selectedStatus = "all",
}: {
  initialApplicants: ApplicantRow[];
  jobs: JobWorkflowSummary[];
  roundProgressByApplication: Record<string, ApplicantRoundProgressRow[]>;
  currentPage?: number;
  totalPages?: number;
  selectedJobId?: string;
  selectedStatus?: string;
}) {
  const [applicants, setApplicants] = useState<ApplicantRow[]>(initialApplicants);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<FullProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const applicantsByJob = useMemo(() => {
    const grouped = new Map<string, ApplicantRow[]>();
    for (const applicant of applicants) {
      const existing = grouped.get(applicant.jobId) || [];
      existing.push(applicant);
      grouped.set(applicant.jobId, existing);
    }
    return grouped;
  }, [applicants]);

  const selectedCountByJob = useMemo(() => {
    const counts = new Map<string, number>();
    for (const applicant of applicants) {
      if (!selectedIds.has(applicant.applicationId)) continue;
      counts.set(applicant.jobId, (counts.get(applicant.jobId) || 0) + 1);
    }
    return counts;
  }, [applicants, selectedIds]);

  const fetchProfile = async (studentId: string) => {
    setViewingProfile(studentId);
    setIsLoadingProfile(true);
    try {
      const res = await fetchFullStudentProfile(studentId);
      if (res.success && res.data) {
        setProfileData(res.data);
      } else {
        toast.error("Failed to load full profile.");
        setViewingProfile(null);
      }
    } catch {
      toast.error("Error loading profile");
      setViewingProfile(null);
    }
    setIsLoadingProfile(false);
  };

  const toggleSelect = (applicationId: string, isSelectable = true) => {
    if (!isSelectable) {
      toast.error("This candidate is not ready for final result publishing yet.");
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(applicationId)) next.delete(applicationId);
    else next.add(applicationId);
    setSelectedIds(next);
  };

  const handleShortlist = async (applicationId: string) => {
    try {
      const res = await shortlistApplicant(applicationId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.newStatus === "shortlisted" ? "Candidate shortlisted." : "Shortlist removed.");
        setApplicants((prev) => prev.map((app) => (app.applicationId === applicationId ? { ...app, status: res.newStatus ?? null } : app)));
      }
    } catch {
      toast.error("Failed to update shortlist.");
    }
  };

  const handleRoundScheduled = async (applicationId: string) => {
    try {
      const res = await toggleApplicantRoundScheduled(applicationId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.newStatus === "round_scheduled" ? "Candidate moved into scheduled round." : "Candidate returned to shortlist stage.");
        setApplicants((prev) => prev.map((app) => (app.applicationId === applicationId ? { ...app, status: res.newStatus ?? null } : app)));
      }
    } catch {
      toast.error("Failed to update round stage.");
    }
  };

  const handleRoundOutcome = async (applicationId: string, roundId: string, outcome: "cleared" | "rejected") => {
    try {
      const res = await recordApplicantRoundOutcome(applicationId, roundId, outcome);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(outcome === "cleared" ? "Candidate advanced to the next round." : "Candidate marked as rejected for this job.");
        window.location.reload();
      }
    } catch {
      toast.error("Failed to update round outcome.");
    }
  };

  const handleBulkScheduleForJob = async (jobId: string) => {
    const shortlistedApplicants = applicants.filter(
      (item) => item.jobId === jobId && item.status === "shortlisted"
    );

    if (shortlistedApplicants.length === 0) {
      toast.error("No shortlisted candidates are ready for bulk scheduling.");
      return;
    }

    toast.loading("Scheduling shortlisted candidates into the first round...", { id: `bulk-schedule-${jobId}` });

    let successCount = 0;
    for (const applicant of shortlistedApplicants) {
      const result = await toggleApplicantRoundScheduled(applicant.applicationId);
      if (!result.error && result.newStatus === "round_scheduled") {
        successCount += 1;
      }
    }

    if (successCount === 0) {
      toast.error("Bulk scheduling did not update any candidates.", { id: `bulk-schedule-${jobId}` });
      return;
    }

    setApplicants((prev) =>
      prev.map((applicant) =>
        applicant.jobId === jobId && applicant.status === "shortlisted"
          ? { ...applicant, status: "round_scheduled" }
          : applicant
      )
    );

    toast.success(`Scheduled ${successCount} candidate(s) into the round workflow.`, { id: `bulk-schedule-${jobId}` });
  };

  const handleSelectShortlistedForJob = (jobId: string) => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) {
      toast.error("Job context is missing.");
      return;
    }

    const eligibleApplicants = applicants.filter(
      (item) => item.jobId === jobId && isApplicantReadyForFinalResult(item, job, roundProgressByApplication)
    );

    if (eligibleApplicants.length === 0) {
      toast.error(
        job.rounds.length > 0
          ? "No candidate is ready. Every configured round must be cleared before publishing results."
          : "No shortlisted candidate is ready for result publishing."
      );
      return;
    }

    const next = new Set(selectedIds);
    for (const applicant of eligibleApplicants) {
      next.add(applicant.applicationId);
    }
    setSelectedIds(next);
    const skippedCount = applicants.filter(
      (item) => item.jobId === jobId && ["shortlisted", "round_scheduled"].includes(item.status || "")
    ).length - eligibleApplicants.length;
    toast.success(
      skippedCount > 0
        ? `Selected ${eligibleApplicants.length} ready candidate(s). ${skippedCount} still need round completion.`
        : "Ready candidates selected for result publishing."
    );
  };

  const handlePostResultsForJob = async (jobId: string) => {
    const selectedForJob = applicants
      .filter((applicant) => applicant.jobId === jobId && selectedIds.has(applicant.applicationId))
      .map((applicant) => applicant.applicationId);

    if (selectedForJob.length === 0) {
      toast.error("Select at least one candidate for this job.");
      return;
    }

    setIsPosting(true);
    toast.loading("Publishing selected candidates to Placement Officer review queue...", { id: "posting-results" });

    try {
      const res = await postCompanyResults(jobId, selectedForJob);
      if (res.error) {
        toast.error(res.error, { id: "posting-results" });
      } else {
        toast.success(`Published ${selectedForJob.length} result(s) for Placement Officer review.`, { id: "posting-results" });
        setApplicants((prev) =>
          prev.map((applicant) =>
            selectedForJob.includes(applicant.applicationId) ? { ...applicant, status: "selected" } : applicant
          )
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const applicationId of selectedForJob) next.delete(applicationId);
          return next;
        });
      }
    } catch {
      toast.error("An unexpected error occurred.", { id: "posting-results" });
    }

    setIsPosting(false);
  };

  const summary = useMemo(() => {
    return applicants.reduce(
      (acc, applicant) => {
        acc.total += 1;
        if (applicant.status === "shortlisted") acc.shortlisted += 1;
        if (applicant.status === "round_scheduled") acc.scheduled += 1;
        if (applicant.status === "selected") acc.selected += 1;
        return acc;
      },
      { total: 0, shortlisted: 0, scheduled: 0, selected: 0 }
    );
  }, [applicants]);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ flex: "1 1 320px" }}>
          <h1 style={{ margin: "0 0 8px 0" }}>Hiring Workflow Console</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            Review applicants job-by-job, shortlist them, track rounds, and publish final results for Placement Officer OD review.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <Link href={`/jobs/manage${selectedJobId !== "all" ? `/${selectedJobId}` : ""}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
            Manage Rounds
          </Link>
          {applicants.length > 0 && (
            <button
              onClick={() =>
                exportToCSV(
                  "applicants.csv",
                  applicants.map((applicant) => ({
                    ID: applicant.id,
                    Name: `${applicant.firstName} ${applicant.lastName}`,
                    Email: applicant.email,
                    Job: applicant.jobTitle,
                    Status: applicant.status,
                  }))
                )
              }
              className="btn btn-outline"
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              <Download size={18} /> Export List
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <SummaryCard label="Visible Applicants" value={summary.total} accent="var(--primary-color)" />
        <SummaryCard label="Shortlisted" value={summary.shortlisted} accent="#f59e0b" />
        <SummaryCard label="Round Scheduled" value={summary.scheduled} accent="#8b5cf6" />
        <SummaryCard label="Published Results" value={summary.selected} accent="#22c55e" />
      </div>

      <div className="card" style={{ padding: "16px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "end" }}>
        <div style={{ minWidth: "260px", flex: "1 1 260px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Filter by Job
          </div>
          <select
            value={selectedJobId}
            onChange={(event) => {
              const params = new URLSearchParams(window.location.search);
              if (event.target.value === "all") params.delete("jobId");
              else params.set("jobId", event.target.value);
              params.delete("page");
              window.location.search = params.toString();
            }}
            className="input-field"
            style={{ width: "100%" }}
          >
            <option value="all">All job postings</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: "220px", flex: "1 1 220px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Filter by Status
          </div>
          <select
            value={selectedStatus}
            onChange={(event) => {
              const params = new URLSearchParams(window.location.search);
              if (event.target.value === "all") params.delete("status");
              else params.set("status", event.target.value);
              params.delete("page");
              window.location.search = params.toString();
            }}
            className="input-field"
            style={{ width: "100%" }}
          >
            <option value="all">All statuses</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="round_scheduled">Round Scheduled</option>
            <option value="selected">Selected</option>
          </select>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
          No job postings found for this company.
        </div>
      ) : applicants.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
          No applications match the current filter.
        </div>
      ) : (
        jobs
          .filter((job) => selectedJobId === "all" || job.id === selectedJobId)
          .map((job) => {
            const jobApplicants = applicantsByJob.get(job.id) || [];
            if (jobApplicants.length === 0) return null;

            return (
              <div key={job.id} className="card" style={{ marginBottom: "20px", overflow: "hidden" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-elevated)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 320px" }}>
                      <h2 style={{ margin: "0 0 8px 0", fontSize: "1.2rem" }}>{job.title}</h2>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <span>{job.totalApplicants} applicants</span>
                        <span>{job.shortlistedCount} shortlisted</span>
                        <span>{job.roundScheduledCount} in rounds</span>
                        <span>{job.selectedCount} results published</span>
                        <span>Status: {(job.status || "draft").replaceAll("_", " ")}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <button className="btn btn-outline" onClick={() => handleBulkScheduleForJob(job.id)}>
                        Schedule Shortlisted
                      </button>
                      <button className="btn btn-outline" onClick={() => handleSelectShortlistedForJob(job.id)}>
                        Select Ready Candidates
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={isPosting || (selectedCountByJob.get(job.id) || 0) === 0}
                        onClick={() => handlePostResultsForJob(job.id)}
                      >
                        {isPosting ? "Publishing..." : `Post Results (${selectedCountByJob.get(job.id) || 0})`}
                      </button>
                      <Link href={`/jobs/manage/${job.id}/board`} className="btn btn-accent" style={{ textDecoration: "none" }}>
                        Kanban Board
                      </Link>
                      <Link href={`/jobs/manage/${job.id}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                        Edit Rounds
                      </Link>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                    {job.rounds.length === 0 ? (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>No structured rounds added yet.</div>
                    ) : (
                      job.rounds.map((round) => (
                        <div key={round.id} style={{ padding: "10px 12px", border: "1px solid var(--border-color)", borderRadius: "10px", minWidth: "220px", background: "rgba(255,255,255,0.02)" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.86rem", marginBottom: "4px" }}>
                            Round {round.roundNumber}: {round.roundName}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "3px" }}>
                            {round.startsAt && (
                              <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <Clock3 size={13} /> {format(new Date(round.startsAt), "MMM d, yyyy h:mm a")}
                              </span>
                            )}
                            {round.endsAt && (
                              <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <Clock3 size={13} /> Ends {format(new Date(round.endsAt), "MMM d, yyyy h:mm a")}
                              </span>
                            )}
                            {round.mode && (
                              <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <Video size={13} /> {round.mode}
                              </span>
                            )}
                            {round.location && (
                              <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <MapPin size={13} /> {round.location}
                              </span>
                            )}
                            {round.meetLink && (
                              <a href={round.meetLink} target="_blank" rel="noreferrer" style={{ color: "var(--primary-color)", textDecoration: "none" }}>
                                Join link
                              </a>
                            )}
                          </div>
                          {round.description && (
                            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5 }}>
                              {round.description}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ padding: "var(--space-4)", width: "50px" }}>
                          <CheckSquare size={18} color="var(--text-secondary)" />
                        </th>
                        <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Candidate Profile</th>
                        <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Application</th>
                        <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Status</th>
                        <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Workflow Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobApplicants.map((applicant) => {
                        const progress = roundProgressByApplication[applicant.applicationId] || [];
                        const currentScheduledRound = progress.find((item) => item.progressStatus === "scheduled");
                        const clearedRounds = progress.filter((item) => item.progressStatus === "cleared");
                        const readyForFinalResult = isApplicantReadyForFinalResult(applicant, job, roundProgressByApplication);

                        return (
                        <tr
                          key={`${applicant.applicationId}-${applicant.jobId}`}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                            backgroundColor: selectedIds.has(applicant.applicationId)
                              ? "rgba(99,102,241,0.06)"
                              : applicant.status === "round_scheduled"
                                ? "rgba(139,92,246,0.06)"
                                : applicant.status === "shortlisted"
                                ? "rgba(245,158,11,0.04)"
                                : "transparent",
                          }}
                        >
                          <td style={{ padding: "var(--space-4)" }}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(applicant.applicationId)}
                              onChange={() => toggleSelect(applicant.applicationId, readyForFinalResult && applicant.status !== "selected")}
                              disabled={applicant.status === "selected"}
                              style={{ cursor: applicant.status === "selected" ? "not-allowed" : readyForFinalResult ? "pointer" : "help" }}
                            />
                          </td>
                          <td style={{ padding: "var(--space-4)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                              <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)" }}>
                                {applicant.avatarUrl ? (
                                  <Image src={applicant.avatarUrl} alt="Avatar" width={40} height={40} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--primary-color)" }}>
                                    {getInitials(applicant.firstName, applicant.lastName)}
                                  </span>
                                )}
                              </div>
                              <div>
                                <Link href={`/students/${applicant.id}`} style={{ fontWeight: 600, color: "var(--primary-color)", textDecoration: "none" }}>
                                  {applicant.firstName} {applicant.lastName}
                                </Link>
                                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{applicant.email}</div>
                                {applicant.resumeUrl && (
                                  <a href={applicant.resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "var(--primary-color)", marginTop: "4px", display: "inline-block", textDecoration: "none" }}>
                                    View Resume PDF
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "var(--space-4)" }}>
                            <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                              <Briefcase size={16} /> {applicant.jobTitle}
                            </div>
                            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Calendar size={14} /> {applicant.appliedAt ? format(new Date(applicant.appliedAt), "MMM d, yyyy") : "N/A"}
                            </div>
                            {currentScheduledRound && (
                              <div style={{ fontSize: "0.8rem", color: "#8b5cf6", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <Milestone size={13} /> Current Round: {currentScheduledRound.roundName}
                              </div>
                            )}
                            {clearedRounds.length > 0 && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                                Cleared: {clearedRounds.map((round) => `R${round.roundNumber}`).join(", ")}
                              </div>
                            )}
                            {readyForFinalResult && applicant.status !== "selected" && (
                              <div style={{ fontSize: "0.78rem", color: "#22c55e", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <Check size={13} />
                                Ready for final result publishing
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "var(--space-4)" }}>
                            <span className={`status-pill ${statusClass(applicant.status)}`}>{statusLabel(applicant.status)}</span>
                          </td>
                          <td style={{ padding: "var(--space-4)" }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                              {applicant.status !== "selected" && (
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", color: applicant.status === "shortlisted" ? "#f59e0b" : undefined, borderColor: applicant.status === "shortlisted" ? "#f59e0b" : undefined }}
                                  onClick={() => handleShortlist(applicant.applicationId)}
                                >
                                  {applicant.status === "shortlisted" ? <StarOff size={14} /> : <Star size={14} />}
                                  {applicant.status === "shortlisted" ? "Undo" : "Shortlist"}
                                </button>
                              )}
                              {["shortlisted", "round_scheduled"].includes(applicant.status || "") && (
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", color: applicant.status === "round_scheduled" ? "#8b5cf6" : undefined, borderColor: applicant.status === "round_scheduled" ? "#8b5cf6" : undefined }}
                                  onClick={() => handleRoundScheduled(applicant.applicationId)}
                                >
                                  <Milestone size={14} />
                                  {applicant.status === "round_scheduled" ? "Back to Shortlist" : "Schedule Round"}
                                </button>
                              )}
                              {currentScheduledRound && (
                                <>
                                  <button
                                    className="btn btn-outline"
                                    style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", color: "#22c55e", borderColor: "#22c55e" }}
                                    onClick={() => handleRoundOutcome(applicant.applicationId, currentScheduledRound.roundId, "cleared")}
                                  >
                                    <Check size={14} />
                                    Cleared Round
                                  </button>
                                  <button
                                    className="btn btn-outline"
                                    style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", color: "#ef4444", borderColor: "#ef4444" }}
                                    onClick={() => handleRoundOutcome(applicant.applicationId, currentScheduledRound.roundId, "rejected")}
                                  >
                                    <XCircle size={14} />
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                className="btn btn-outline"
                                style={{ padding: "4px 8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}
                                onClick={() => fetchProfile(applicant.id)}
                              >
                                View Profile <ChevronRight size={14} />
                              </button>
                              <Link href={`/students/${applicant.id}`} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
                                Full Student Details <ChevronRight size={14} />
                              </Link>
                              {applicant.resumeUrl ? (
                                <a href={applicant.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
                                  Resume <ExternalLink size={14} />
                                </a>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "24px" }}>
          <a
            href={`?${buildQueryString({ jobId: selectedJobId, status: selectedStatus, page: String(currentPage - 1) })}`}
            className="btn btn-outline"
            style={{ opacity: currentPage <= 1 ? 0.5 : 1, pointerEvents: currentPage <= 1 ? "none" : "auto", display: "inline-block", textDecoration: "none" }}
          >
            Previous
          </a>
          <span style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
            Page {currentPage} of {totalPages}
          </span>
          <a
            href={`?${buildQueryString({ jobId: selectedJobId, status: selectedStatus, page: String(currentPage + 1) })}`}
            className="btn btn-outline"
            style={{ opacity: currentPage >= totalPages ? 0.5 : 1, pointerEvents: currentPage >= totalPages ? "none" : "auto", display: "inline-block", textDecoration: "none" }}
          >
            Next
          </a>
        </div>
      )}

      {viewingProfile && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setViewingProfile(null)}>
          <div className="card" onClick={(event) => event.stopPropagation()} style={{ width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "0" }}>
            <button onClick={() => setViewingProfile(null)} style={{ position: "sticky", top: "16px", left: "calc(100% - 40px)", zIndex: 10, background: "var(--bg-elevated)", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", boxShadow: "var(--shadow-sm)" }}>
              <X size={20} color="var(--text-primary)" />
            </button>

            {isLoadingProfile ? (
              <div style={{ padding: "100px", textAlign: "center" }}>
                <span className="spinner"></span>
                <p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Loading full profile...</p>
              </div>
            ) : profileData ? (
              <div>
                <div style={{ background: "linear-gradient(135deg, var(--bg-hover) 0%, transparent 100%)", padding: "24px 32px", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ width: "70px", height: "70px", borderRadius: "50%", overflow: "hidden", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {profileData.user.avatarUrl ? (
                        <Image src={profileData.user.avatarUrl} alt="Avatar" width={70} height={70} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--primary-color)" }}>
                          {getInitials(profileData.user.firstName, profileData.user.lastName)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1.5rem", margin: 0, fontWeight: 700 }}>{profileData.user.firstName} {profileData.user.lastName}</h2>
                      <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>{profileData.profile.department} (Year {profileData.profile.year}, Sec {profileData.profile.section})</p>
                      <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{profileData.user.email}</span>
                        {profileData.user.phone && <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{profileData.user.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-grid" style={{ padding: "32px" }}>
                  <div>
                    {profileData.profile.professionalSummary && (
                      <div style={{ marginBottom: "32px" }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "16px" }}><Briefcase size={20} /> Professional Summary</h3>
                        <p style={{ lineHeight: 1.6, color: "var(--text-secondary)", fontSize: "0.9375rem" }}>{profileData.profile.professionalSummary}</p>
                      </div>
                    )}

                    {profileData.education.length > 0 && (
                      <div style={{ marginBottom: "32px" }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "16px" }}><GraduationCap size={20} /> Education</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {profileData.education.map((education, index: number) => (
                            <div key={index} style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "8px" }}>
                              <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>{education.degree} {education.fieldOfStudy ? `in ${education.fieldOfStudy}` : ""}</h4>
                              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.875rem" }}>{education.institution}</p>
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                <span>{education.startYear} - {education.endYear || "Present"}</span>
                                {education.score && <span style={{ fontWeight: 600, color: "var(--primary-color)" }}>Score: {education.score}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileData.projects.length > 0 && (
                      <div style={{ marginBottom: "32px" }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "16px" }}><Code size={20} /> Projects</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {profileData.projects.map((project, index: number) => (
                            <div key={index} style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "8px", borderLeft: "3px solid var(--primary-color)" }}>
                              <h4 style={{ margin: "0 0 8px 0", fontSize: "1rem", display: "flex", justifyContent: "space-between" }}>
                                {project.title}
                                {project.projectUrl && <a href={project.projectUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary-color)" }}><ExternalLink size={16} /></a>}
                              </h4>
                              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>{project.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ background: "var(--bg-elevated)", padding: "20px", borderRadius: "12px", marginBottom: "24px" }}>
                      <h4 style={{ fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>Metrics</h4>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)", marginBottom: "12px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>CGPA</span>
                        <span style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--primary-color)" }}>{profileData.profile.cgpa || "N/A"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Profile Score</span>
                        <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>{profileData.profile.profileCompletionScore}/100</span>
                      </div>
                    </div>

                    {profileData.skills.length > 0 && (
                      <div style={{ marginBottom: "24px" }}>
                        <h4 style={{ fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}><Target size={16} /> Skills</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {profileData.skills.map((skill, index: number) => (
                            <span key={index} style={{ background: "var(--bg-hover)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8125rem", fontWeight: 500 }}>
                              {skill.skillName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileData.certs.length > 0 && (
                      <div style={{ marginBottom: "24px" }}>
                        <h4 style={{ fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}><Award size={16} /> Certifications</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {profileData.certs.map((certification, index: number) => (
                            <div key={index} style={{ fontSize: "0.875rem" }}>
                              <div style={{ fontWeight: 500 }}>{certification.name}</div>
                              <div style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", display: "flex", justifyContent: "space-between" }}>
                                <span>{certification.issuingOrg}</span>
                                {certification.credentialUrl && <a href={certification.credentialUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary-color)" }}>Verify</a>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileData.links.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", margin: "0 0 12px 0" }}>External Links</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {profileData.links
                            .filter((link) => Boolean(link.url))
                            .map((link, index: number) => (
                              <a key={index} href={link.url || undefined} target="_blank" rel="noreferrer" style={{ fontSize: "0.875rem", color: "var(--primary-color)", display: "flex", gap: "8px", alignItems: "center", textDecoration: "none" }}>
                                <ExternalLink size={14} /> {link.platform}
                              </a>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <style>{`
        .profile-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
        }
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, color: accent }}>{value}</div>
    </div>
  );
}

function buildQueryString(values: { jobId: string; status: string; page: string }) {
  const params = new URLSearchParams();
  if (values.jobId !== "all") params.set("jobId", values.jobId);
  if (values.status !== "all") params.set("status", values.status);
  params.set("page", values.page);
  return params.toString();
}
