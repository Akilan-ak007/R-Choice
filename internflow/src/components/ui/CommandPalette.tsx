"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Building2, 
  CalendarDays, 
  FileText, 
  GraduationCap, 
  LayoutDashboard, 
  Search, 
  Settings, 
  User,
  Users
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-content" onClick={(e) => e.stopPropagation()}>
        <Command>
          <div className="cmd-search-wrapper">
            <Search className="cmd-search-icon" size={20} />
            <Command.Input placeholder="Type a command or search..." autoFocus />
          </div>
          
          <Command.List>
            <Command.Empty>No results found.</Command.Empty>
            
            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => runCommand(() => router.push("/dashboard/student"))}>
                <LayoutDashboard size={16} /> Student Dashboard
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/dashboard/staff"))}>
                <LayoutDashboard size={16} /> Staff Dashboard
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/dashboard/admin"))}>
                <LayoutDashboard size={16} /> Admin Dashboard
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Entities">
              <Command.Item onSelect={() => runCommand(() => router.push("/students"))}>
                <GraduationCap size={16} /> Students Directory
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/companies"))}>
                <Building2 size={16} /> Company Directory
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/jobs"))}>
                <Briefcase size={16} /> Job Postings
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/applications"))}>
                <FileText size={16} /> Applications
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Settings & Utils">
              <Command.Item onSelect={() => runCommand(() => router.push("/profile"))}>
                <User size={16} /> My Profile
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/calendar"))}>
                <CalendarDays size={16} /> Calendar
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/users"))}>
                <Settings size={16} /> System Settings
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
