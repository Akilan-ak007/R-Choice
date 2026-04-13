"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { MapPin, Building2, Briefcase, Zap, X, Check, SearchX } from "lucide-react";
import ApplyButton from "@/app/(dashboard)/jobs/ApplyButton";

function SwipeCard({ job, index, onSwipe, isStudent }: { job: any; index: number; onSwipe: (id: string, dir: "left" | "right") => void; isStudent: boolean }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Visual cues for swiping
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe(job.id, "right");
    } else if (info.offset.x < -100) {
      onSwipe(job.id, "left");
    }
  };

  const isFront = index === 0;

  return (
    <motion.div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        x: isFront ? x : 0,
        rotate: isFront ? rotate : 0,
        opacity: isFront ? opacity : 1,
        scale: isFront ? 1 : 1 - index * 0.05,
        y: isFront ? 0 : index * 10,
        zIndex: 100 - index,
      }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={isFront ? { cursor: "grabbing" } : {}}
      animate={{ scale: isFront ? 1 : 1 - index * 0.05, y: isFront ? 0 : index * 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="card"
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "var(--space-6)" }}>
        {/* Swipe Indicators */}
        <motion.div 
          style={{ opacity: likeOpacity, position: "absolute", top: 32, right: 32, border: "4px solid var(--color-success)", color: "var(--color-success)", padding: "4px 12px", borderRadius: 8, fontSize: "2rem", fontWeight: "bold", transform: "rotate(15deg)", zIndex: 10 }}
        >
          SAVE
        </motion.div>
        <motion.div 
          style={{ opacity: nopeOpacity, position: "absolute", top: 32, left: 32, border: "4px solid var(--color-danger)", color: "var(--color-danger)", padding: "4px 12px", borderRadius: 8, fontSize: "2rem", fontWeight: "bold", transform: "rotate(-15deg)", zIndex: 10 }}
        >
          PASS
        </motion.div>

        <div style={{ display: "flex", gap: "16px", marginBottom: "var(--space-6)", alignItems: "center" }}>
          <div style={{ width: "80px", height: "80px", background: "var(--bg-hover)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "var(--color-primary)" }}>
            {job.companyName?.[0] || <Briefcase size={32} />}
          </div>
          <div>
            <h2 style={{ fontSize: "1.5rem", margin: "0 0 4px 0" }}>{job.title}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "1rem" }}>
              <Building2 size={16} /> {job.companyName}
            </div>
          </div>
        </div>

        <div style={{ flexGrow: 1, overflowY: "auto", paddingRight: "8px" }}>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>
            {job.description}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "var(--space-6)" }}>
            <span className="job-tag" style={{ fontSize: "0.875rem", padding: "6px 12px" }}><MapPin size={14} /> {job.location}</span>
            <span className="job-tag" style={{ fontSize: "0.875rem", padding: "6px 12px", color: "var(--color-warning)", background: "rgba(244,122,42,0.1)" }}>💰 {job.stipendInfo || "Stipend TBA"}</span>
            <span className="job-tag" style={{ fontSize: "0.875rem", padding: "6px 12px" }}>⏱️ {job.workMode || "On-site"}</span>
          </div>

          <div>
            <h4 style={{ marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px" }}>Required Skills</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(job.requiredSkills || ["JavaScript", "React", "Node.js"]).map((skill: string, i: number) => (
                <span key={i} style={{ background: "var(--bg-hover)", padding: "4px 10px", borderRadius: "100px", fontSize: "0.875rem" }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {isFront && (
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-4)", display: "flex", justifyContent: "space-between", marginTop: "auto", gap: "16px" }}>
            <button 
              onClick={() => onSwipe(job.id, "left")}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "12px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}
            >
              <X size={20} /> Pass
            </button>
            {isStudent ? (
              <div style={{ flex: 1 }}>
                <ApplyButton job={job} />
              </div>
            ) : (
              <button 
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px", borderRadius: "12px", background: "var(--color-primary)", color: "white", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem" }}
              >
                View Details
              </button>
            )}
            <button 
              onClick={() => onSwipe(job.id, "right")}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", padding: "12px", borderRadius: "12px", background: "rgba(34, 197, 94, 0.1)", color: "var(--color-success)", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}
            >
              <Check size={20} /> Shortlist
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function SwipeDeck({ jobs, isStudent }: { jobs: any[]; isStudent: boolean }) {
  const [deck, setDeck] = useState(jobs);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const handleSwipe = (id: string, dir: "left" | "right") => {
    setDirection(dir);
    setTimeout(() => {
      setDeck((prev) => prev.filter((j) => j.id !== id));
      setDirection(null);
    }, 200);
  };

  if (deck.length === 0) {
    return (
      <div style={{ height: "calc(100vh - 250px)", minHeight: "450px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "var(--space-6)" }}>
        <div style={{ width: 80, height: 80, background: "var(--bg-hover)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-4)", color: "var(--text-muted)" }}>
          <SearchX size={40} />
        </div>
        <h2 style={{ marginBottom: "var(--space-2)" }}>You're all caught up!</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto var(--space-6)" }}>
          You've reviewed all available jobs in your criteria. Check back later for new opportunities.
        </p>
        <button className="btn btn-outline" onClick={() => setDeck(jobs)}>
          Review Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100dvh - 200px)", minHeight: "500px", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: "500px", height: "calc(100dvh - 230px)", minHeight: "450px" }}>
        <AnimatePresence>
          {deck.map((job, idx) => (
            <SwipeCard 
              key={job.id} 
              job={job} 
              index={idx} 
              onSwipe={handleSwipe} 
              isStudent={isStudent} 
            />
          )).reverse()}
        </AnimatePresence>
      </div>
      
      <p style={{ position: "absolute", bottom: 0, textAlign: "center", width: "100%", fontSize: "0.875rem", color: "var(--text-muted)" }}>
        Swipe Right to Shortlist • Swipe Left to Pass
      </p>
    </div>
  );
}
