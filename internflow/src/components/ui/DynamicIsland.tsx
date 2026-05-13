"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, Info } from "lucide-react";

export type IslandNotification = {
  id: string;
  message: string;
  type?: "info" | "success" | "warning";
  icon?: React.ReactNode;
  duration?: number;
};

// Global store for the dynamic island
let listeners: ((notifications: IslandNotification[]) => void)[] = [];
let currentNotifications: IslandNotification[] = [];

export const showIslandNotification = (notification: Omit<IslandNotification, "id">) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newNotif = { ...notification, id };
  
  currentNotifications = [newNotif]; // Replace current for dynamic island effect
  listeners.forEach(listener => listener([...currentNotifications]));

  if (notification.duration !== Infinity) {
    setTimeout(() => {
      currentNotifications = currentNotifications.filter(n => n.id !== id);
      listeners.forEach(listener => listener([...currentNotifications]));
    }, notification.duration || 4000);
  }
  
  return id;
};

export function DynamicIsland() {
  const [notifications, setNotifications] = useState<IslandNotification[]>([]);

  useEffect(() => {
    const listener = (notifs: IslandNotification[]) => setNotifications(notifs);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const current = notifications[notifications.length - 1];

  return (
    <div className="dynamic-island-container">
      <motion.div
        layout
        initial={{ y: -50, scale: 0.8, opacity: 0, borderRadius: 999 }}
        animate={{ 
          y: current ? 0 : -50,
          scale: current ? 1 : 0.8,
          opacity: current ? 1 : 0,
          width: current ? "auto" : 40,
          height: current ? 40 : 40,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="dynamic-island"
      >
        <AnimatePresence mode="popLayout">
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)", scale: 0.9 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="dynamic-island-content"
            >
              {current.icon ? current.icon : (
                current.type === "success" ? <CheckCircle2 size={16} color="#4ade80" /> : 
                current.type === "warning" ? <Bell size={16} color="#fbbf24" /> : 
                <Info size={16} color="#60a5fa" />
              )}
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{current.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
