"use client";

import { useState, useMemo } from "react";
import { Save, Plus, Trash2, Link as LinkIcon, Globe, Code2, Terminal, GripVertical } from "lucide-react";
import { saveLinks } from "@/app/actions/profile";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GitHubHeatmap } from "@/components/profile/GitHubHeatmap";

const platforms = ["GitHub", "LeetCode", "HackerRank", "LinkedIn", "Portfolio", "Other"];

const getIcon = (platform: string) => {
  switch (platform) {
    case "GitHub": return <Globe size={18} />;
    case "LeetCode": return <Code2 size={18} />;
    case "HackerRank": return <Terminal size={18} />;
    default: return <LinkIcon size={18} />;
  }
};

function SortableLinkRow({
  link,
  index,
  onUpdate,
  onDelete,
}: {
  link: any;
  index: number;
  onUpdate: (index: number, field: string, value: string) => void;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-3"
      data-dragging={isDragging || undefined}
    >
      <div className="input-group" style={{ position: "relative" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            {...attributes}
            {...listeners}
            style={{
              cursor: "grab",
              color: "var(--text-muted)",
              display: "inline-flex",
              padding: "2px",
              borderRadius: "4px",
              transition: "color var(--transition-fast)",
            }}
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </span>
          Platform
        </label>
        <select
          className="input-field"
          value={link.platform || "Other"}
          onChange={(e) => onUpdate(index, "platform", e.target.value)}
        >
          {platforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label>Title / Identifier</label>
        <input
          className="input-field"
          placeholder="e.g. My Profile"
          value={link.title || ""}
          onChange={(e) => onUpdate(index, "title", e.target.value)}
          required
        />
      </div>
      <div className="input-group" style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <label>URL</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {getIcon(link.platform)}
            <input
              className="input-field"
              placeholder="https://"
              value={link.url || ""}
              onChange={(e) => onUpdate(index, "url", e.target.value)}
              required
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(index)}
          style={{
            color: "var(--color-danger)",
            paddingBottom: "12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "transform var(--transition-fast)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}

export default function LinksClient({ initialLinks }: { initialLinks: any[] }) {
  const [links, setLinks] = useState<any[]>(
    (initialLinks || []).map((l, i) => ({ ...l, _id: `link-${i}` }))
  );
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex((i) => i._id === active.id);
        const newIndex = items.findIndex((i) => i._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.info("Link order updated — remember to save!");
    }
  };

  const handleUpdate = (index: number, field: string, value: string) => {
    const n = [...links];
    n[index][field] = value;
    setLinks(n);
  };

  const handleDelete = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
    toast("Link removed", { description: "Click Save to confirm." });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
    const filtered = links.filter((l) => l.url && l.title);
      const res = await saveLinks(filtered);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Links saved successfully!");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    }
    setIsSaving(false);
  };

  // Find github link
  const githubLink = useMemo(() => links.find((l) => l.platform?.toLowerCase() === "github" && l.url), [links]);
  const githubUser = useMemo(() => {
    if (!githubLink?.url) return null;
    try {
      const url = new URL(githubLink.url);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[0] || "intern";
    } catch {
      return "intern";
    }
  }, [githubLink]);

  return (
    <div style={{ maxWidth: "800px" }}>
      <div className="card animate-fade-in" style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LinkIcon size={24} color="var(--color-primary)" /> Externals & Links
          </h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Drag <GripVertical size={12} style={{ verticalAlign: "middle" }} /> to reorder
          </span>
        </div>

        <form onSubmit={handleSave}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={links.map((l) => l._id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {links.map((link, idx) => (
                  <SortableLinkRow
                    key={link._id}
                    link={link}
                    index={idx}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-8)" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                setLinks([...links, { platform: "GitHub", title: "", url: "", _id: `link-${Date.now()}` }])
              }
            >
              <Plus size={18} /> Add Link
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {githubUser && (
        <div style={{ 
          "--github-level-0": "var(--bg-secondary)",
          "--github-level-1": "rgba(46, 160, 67, 0.4)",
          "--github-level-2": "rgba(46, 160, 67, 0.6)",
          "--github-level-3": "rgba(46, 160, 67, 0.8)",
          "--github-level-4": "rgba(46, 160, 67, 1)",
        } as React.CSSProperties}>
          <GitHubHeatmap username={githubUser} />
        </div>
      )}
    </div>
  );
}
