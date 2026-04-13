"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info } from "lucide-react";
import { getRecentNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";
import Link from "next/link";
import styles from "../../app/(dashboard)/layout.module.css";

type NotificationType = {
  id: string;
  title: string;
  message: string;
  isRead: boolean | null;
  linkUrl: string | null;
  createdAt: Date | null;
};

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    async function load() {
      const res = await getRecentNotifications();
      if (res.data) setNotifications(res.data);
      setLoading(false);
    }
    load();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  async function handleNotificationClick(id: string, isRead: boolean | null) {
    if (!isRead) {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
    setIsOpen(false);
  }

  async function handleMarkAll() {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  return (
    <div className="relative" ref={dropdownRef} style={{ position: "relative" }}>
      <button 
        className={styles.notifButton} 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.notifDot} />}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "12px",
          width: "350px",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          border: "1px solid var(--border-color)",
          zIndex: 50,
          overflow: "hidden"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-primary)"
          }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-primary)",
                  fontSize: "0.80rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <Bell size={32} opacity={0.2} />
                <span style={{ fontSize: "0.875rem" }}>You are all caught up!</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {notifications.map(notif => {
                  const content = (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id, notif.isRead)}
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid var(--border-color)",
                        backgroundColor: notif.isRead ? "transparent" : "rgba(30, 155, 215, 0.03)",
                        cursor: "pointer",
                        display: "flex",
                        gap: "12px",
                        transition: "background 0.2s"
                      }}
                    >
                      <div style={{
                        flexShrink: 0,
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: notif.isRead ? "transparent" : "var(--color-primary)",
                        marginTop: "6px"
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{notif.title}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                          {notif.message}
                        </p>
                        <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : ""}
                        </div>
                      </div>
                    </div>
                  );

                  return notif.linkUrl ? (
                    <Link href={notif.linkUrl} key={notif.id} style={{ textDecoration: "none" }}>
                      {content}
                    </Link>
                  ) : content;
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
