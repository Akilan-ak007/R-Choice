import React from "react";
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  ClipboardCheck,
  BarChart3,
  Users,
  Building2,
  Settings,
  GraduationCap,
  GitBranch,
  CalendarDays,
  Trophy,
  Download,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export function getNavSections(role: string): NavSection[] {
  switch (role) {
    case "student":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/student", icon: <LayoutDashboard size={20} /> },
          { label: "My Profile", href: "/profile", icon: <User size={20} /> },
          { label: "Calendar", href: "/calendar", icon: <CalendarDays size={20} /> },
        ]},
        { label: "Internships", items: [
          { label: "Browse Jobs", href: "/jobs", icon: <Briefcase size={20} /> },
          { label: "My Applications", href: "/applications", icon: <FileText size={20} /> },
          { label: "Work Reports", href: "/reports", icon: <ClipboardCheck size={20} /> },
        ]},
      ];
    case "tutor":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/staff", icon: <LayoutDashboard size={20} /> },
          { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} /> },
        ]},
        { label: "Students", items: [
          { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
          { label: "Applied Students", href: "/students/applied", icon: <Users size={20} /> },
          { label: "Shortlisted", href: "/students/shortlisted", icon: <Trophy size={20} /> },
        ]},
        { label: "Opportunities", items: [
          { label: "Current Openings", href: "/jobs", icon: <Briefcase size={20} /> },
          { label: "Post a Job", href: "/jobs/create", icon: <FileText size={20} /> },
        ]},
        { label: "Tools", items: [
          { label: "Export Data", href: "/export", icon: <Download size={20} /> },
        ]},
      ];
    case "placement_coordinator":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/staff", icon: <LayoutDashboard size={20} /> },
          { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} /> },
        ]},
        { label: "Students", items: [
          { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
          { label: "Applied Students", href: "/students/applied", icon: <Users size={20} /> },
          { label: "Shortlisted", href: "/students/shortlisted", icon: <Trophy size={20} /> },
          { label: "Manage Students", href: "/users/create", icon: <Users size={20} /> },
        ]},
        { label: "Internships", items: [
          { label: "Current Openings", href: "/jobs", icon: <Briefcase size={20} /> },
          { label: "Post a Job", href: "/jobs/create", icon: <FileText size={20} /> },
          { label: "Ongoing & Reports", href: "/reports/admin", icon: <ClipboardCheck size={20} /> },
        ]},
        { label: "Tools", items: [
          { label: "Export Data", href: "/export", icon: <Download size={20} /> },
        ]},
      ];
    case "hod":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/staff", icon: <LayoutDashboard size={20} /> },
          { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} /> },
        ]},
        { label: "Department", items: [
          { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
          { label: "Applied Students", href: "/students/applied", icon: <Users size={20} /> },
          { label: "Shortlisted", href: "/students/shortlisted", icon: <Trophy size={20} /> },
          { label: "Hierarchy Manager", href: "/settings/hierarchy", icon: <GitBranch size={20} /> },
        ]},
        { label: "Opportunities", items: [
          { label: "Current Openings", href: "/jobs", icon: <Briefcase size={20} /> },
          { label: "Post a Job", href: "/jobs/create", icon: <FileText size={20} /> },
          { label: "Ongoing & Reports", href: "/reports/admin", icon: <ClipboardCheck size={20} /> },
        ]},
        { label: "Tools", items: [
          { label: "Export Data", href: "/export", icon: <Download size={20} /> },
        ]},
      ];
    case "dean":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
          { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} /> },
          { label: "Reports", href: "/reports/admin", icon: <FileText size={20} /> },
          { label: "Analytics", href: "/analytics", icon: <BarChart3 size={20} /> },
        ]},
        { label: "Manage", items: [
          { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
          { label: "Shortlisted", href: "/students/shortlisted", icon: <Trophy size={20} /> },
          { label: "Companies", href: "/companies", icon: <Building2 size={20} /> },
          { label: "User Accounts", href: "/users", icon: <Users size={20} /> },
        ]},
        { label: "Opportunities", items: [
          { label: "Job Postings", href: "/jobs", icon: <Briefcase size={20} /> },
          { label: "Post a Job", href: "/jobs/create", icon: <FileText size={20} /> },
        ]},
        { label: "Administration", items: [
          { label: "College Structure", href: "/settings/college-structure", icon: <Building2 size={20} /> },
          { label: "Hierarchy Manager", href: "/settings/hierarchy", icon: <GitBranch size={20} /> },
          { label: "Export Data", href: "/export", icon: <Download size={20} /> },
          { label: "Settings", href: "/settings", icon: <Settings size={20} /> },
        ]},
      ];
    case "placement_officer":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
          { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} /> },
          { label: "Job Approvals", href: "/approvals/jobs", icon: <ClipboardCheck size={20} /> },
          { label: "Raise OD Queue", href: "/approvals/results", icon: <ClipboardCheck size={20} /> },
          { label: "Reports", href: "/reports/admin", icon: <FileText size={20} /> },
          { label: "Analytics", href: "/analytics", icon: <BarChart3 size={20} /> },
        ]},
        { label: "Manage", items: [
          { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
          { label: "Shortlisted", href: "/students/shortlisted", icon: <Trophy size={20} /> },
          { label: "User Accounts", href: "/users", icon: <Users size={20} /> },
          { label: "Companies", href: "/companies", icon: <Building2 size={20} /> },
          { label: "Registration Review", href: "/companies/review", icon: <ClipboardCheck size={20} /> },
        ]},
        { label: "Opportunities", items: [
          { label: "Job Postings", href: "/jobs", icon: <Briefcase size={20} /> },
          { label: "Post a Job", href: "/jobs/create", icon: <FileText size={20} /> },
        ]},
        { label: "Tools", items: [
          { label: "Export Data", href: "/export", icon: <Download size={20} /> },
          { label: "Settings", href: "/settings", icon: <Settings size={20} /> },
        ]},
      ];
    case "coe":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
          { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} /> },
          { label: "Reports", href: "/reports/admin", icon: <FileText size={20} /> },
          { label: "Analytics", href: "/analytics", icon: <BarChart3 size={20} /> },
        ]},
        { label: "Manage", items: [
          { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
          { label: "Shortlisted", href: "/students/shortlisted", icon: <Trophy size={20} /> },
        ]},
        { label: "Opportunities", items: [
          { label: "Current Openings", href: "/jobs", icon: <Briefcase size={20} /> },
          { label: "Post a Job", href: "/jobs/create", icon: <FileText size={20} /> },
        ]},
        { label: "Tools", items: [
          { label: "Export Data", href: "/export", icon: <Download size={20} /> },
        ]},
      ];
    case "principal":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
          { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} /> },
          { label: "Reports", href: "/reports/admin", icon: <FileText size={20} /> },
          { label: "Analytics", href: "/analytics", icon: <BarChart3 size={20} /> },
        ]},
        { label: "Manage", items: [
          { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
          { label: "Shortlisted", href: "/students/shortlisted", icon: <Trophy size={20} /> },
          { label: "User Accounts", href: "/users", icon: <Users size={20} /> },
          { label: "Companies", href: "/companies", icon: <Building2 size={20} /> },
        ]},
        { label: "Tools", items: [
          { label: "Export Data", href: "/export", icon: <Download size={20} /> },
          { label: "Settings", href: "/settings", icon: <Settings size={20} /> },
        ]},
      ];
    case "management_corporation":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
          { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} /> },
          { label: "Job Approvals", href: "/approvals/jobs", icon: <ClipboardCheck size={20} /> },
          { label: "Reports", href: "/reports/admin", icon: <FileText size={20} /> },
          { label: "Analytics", href: "/analytics", icon: <BarChart3 size={20} /> },
        ]},
        { label: "Manage", items: [
          { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
          { label: "Shortlisted", href: "/students/shortlisted", icon: <Trophy size={20} /> },
          { label: "User Accounts", href: "/users", icon: <Users size={20} /> },
          { label: "Companies", href: "/companies", icon: <Building2 size={20} /> },
          { label: "Registration Review", href: "/companies/review", icon: <ClipboardCheck size={20} /> },
        ]},
        { label: "Opportunities", items: [
          { label: "Job Postings", href: "/jobs", icon: <Briefcase size={20} /> },
          { label: "Post a Job", href: "/jobs/create", icon: <FileText size={20} /> },
        ]},
        { label: "Configuration", items: [
          { label: "Export Data", href: "/export", icon: <Download size={20} /> },
          { label: "Settings", href: "/settings", icon: <Settings size={20} /> },
        ]},
      ];
    case "company":
    case "company_staff":
      return [
        { label: "Main", items: [
          { label: "Dashboard", href: "/dashboard/company", icon: <LayoutDashboard size={20} /> },
          { label: "My Jobs", href: "/jobs/manage", icon: <Briefcase size={20} /> },
          { label: "Applicants", href: "/applicants", icon: <Users size={20} /> },
        ]},
        { label: "Tools", items: [
          { label: "Export Data", href: "/export", icon: <Download size={20} /> },
        ]},
      ];
    default:
      return [];
  }
}

export function getMobileNavItems(role: string): NavItem[] {
  switch (role) {
    case "student":
      return [
        { label: "Home", href: "/dashboard/student", icon: <LayoutDashboard size={22} /> },
        { label: "Jobs", href: "/jobs", icon: <Briefcase size={22} /> },
        { label: "Profile", href: "/profile", icon: <User size={22} /> },
        { label: "Apps", href: "/applications", icon: <FileText size={22} /> },
        { label: "More", href: "/settings", icon: <Settings size={22} /> },
      ];
    case "tutor":
    case "placement_coordinator":
    case "hod":
      return [
        { label: "Home", href: "/dashboard/staff", icon: <LayoutDashboard size={22} /> },
        { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={22} /> },
        { label: "Students", href: "/students", icon: <GraduationCap size={22} /> },
        { label: "Jobs", href: "/jobs", icon: <Briefcase size={22} /> },
        { label: "More", href: "/settings", icon: <Settings size={22} /> },
      ];
    case "dean":
    case "placement_officer":
    case "principal":
    case "coe":
    case "management_corporation":
      return [
        { label: "Home", href: "/dashboard/admin", icon: <LayoutDashboard size={22} /> },
        { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={22} /> },
        { label: "Analytics", href: "/analytics", icon: <BarChart3 size={22} /> },
        { label: "Manage", href: "/users", icon: <Users size={22} /> },
        { label: "More", href: "/settings", icon: <Settings size={22} /> },
      ];
    default:
      return [
        { label: "Home", href: "/dashboard/student", icon: <LayoutDashboard size={22} /> },
      ];
  }
}
