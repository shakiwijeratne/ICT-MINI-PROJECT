import { useMemo, useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Search,
  Pencil,
  Calendar,
  Clock,
  BarChart3,
  Save, // <-- Added Save icon
} from "lucide-react";
import { format } from "date-fns";

import { useAuth } from "../../contexts/useAuth";
import { useInternshipData } from "../../contexts/InternshipContext";
import {
  createDiary,
  deleteDiary,
  updateDiary,
} from "../../services/dataService";
import { enhanceDiaryEntry } from "../../services/geminiService";
import { PageHeader, Card, EmptyState } from "../../components/ui";
import type { DiaryEntry } from "../../types";

// <-- 1. Import your custom hook
import { useFormDraft } from "../../hooks/useFormDraft"; 

export function StudentDiaryPage() {
  const { user } = useAuth();
  
  const { diaries: entries, refreshData } = useInternshipData();

  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortType, setSortType] = useState("newest");

  // <-- 2. Define initial state so the date evaluates cleanly
  const initialFormState = useMemo(() => ({
    date: format(new Date(), "yyyy-MM-dd"),
    title: "",
    content: "",
    tasksCompleted: "",
    hoursWorked: 8,
    skillsUsed: "",
  }), []);

  // <-- 3. Replace useState with useFormDraft
  const draftKey = user?.uid ? `diary_draft_${user.uid}` : "";
  const { 
    formData: form, 
    setFormData: setForm, 
    clearDraft, 
    hasDraft 
  } = useFormDraft(draftKey, initialFormState);

  // <-- 4. Update resetForm to wipe the draft from local storage
  const resetForm = () => {
    setEditingId(null);
    clearDraft(); 
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      title: "",
      content: "",
      tasksCompleted: "",
      hoursWorked: 8,
      skillsUsed: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setMessage("Failed: User is not authenticated.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        studentId: user.uid,
        date: form.date,
        title: form.title,
        content: form.content,
        tasksCompleted: form.tasksCompleted.split("\n").filter(Boolean),
        hoursWorked: Number(form.hoursWorked),
        skillsUsed: form.skillsUsed.split(",").map((s) => s.trim()).filter(Boolean),
        aiEnhanced: false,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDiary(editingId, payload);
        setMessage("Diary updated successfully!");
      } else {
        await createDiary(payload);
        setMessage("Diary saved successfully!");
      }

      resetForm(); // This now automatically clears the draft
      await refreshData();
    } catch (error: any) {
      console.error("Save diary error details:", error);
      setMessage(`Failed to save diary: ${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!form.content) return;
    setAiLoading(true);
    try {
      const enhanced = await enhanceDiaryEntry(form.content, form.title || "Diary Entry");
      setForm((previous: any) => ({ ...previous, content: enhanced }));
      setMessage("AI enhancement applied");
    } catch (error) {
      console.error("AI enhance error:", error);
      setMessage("AI enhancement failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      title: entry.title,
      content: entry.content,
      tasksCompleted: entry.tasksCompleted.join("\n"),
      hoursWorked: entry.hoursWorked,
      skillsUsed: entry.skillsUsed.join(", "),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setEntryToDelete(id);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!entryToDelete) return;

    try {
      await deleteDiary(entryToDelete);
      setMessage("Diary deleted successfully");

      if (selectedEntry?.id === entryToDelete) {
        setSelectedEntry(null);
      }
      
      setEntryToDelete(null);
      await refreshData(); 
    } catch (error) {
      console.error("Delete diary error:", error);
      setMessage("Failed to delete diary from database");
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEntryToDelete(null);
  };

  const filteredEntries = useMemo(() => {
    const search = searchTerm.toLowerCase();
    let data = [...entries];

    data = data.filter((entry) => {
      const matches =
        entry.title.toLowerCase().includes(search) ||
        entry.content.toLowerCase().includes(search) ||
        entry.skillsUsed.join(" ").toLowerCase().includes(search) ||
        entry.tasksCompleted.join(" ").toLowerCase().includes(search);

      if (!matches) return false;
      if (filterType === "ai") return Boolean(entry.aiEnhanced);
      if (filterType === "today") return entry.date === format(new Date(), "yyyy-MM-dd");
      return true;
    });

    switch (sortType) {
      case "oldest": data.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "hours": data.sort((a, b) => b.hoursWorked - a.hoursWorked); break;
      case "title": data.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: data.sort((a, b) => b.date.localeCompare(a.date));
    }

    return data;
  }, [entries, searchTerm, filterType, sortType]);

  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const totalSkills = new Set(entries.flatMap((entry) => entry.skillsUsed)).size;
  const aiCount = entries.filter((entry) => entry.aiEnhanced).length;

  return (
    <div className="page">
      <PageHeader
        title="Daily Internship Diary"
        subtitle="Record your daily internship activities and monitor your progress."
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div>
            <span className="stat-label">Total Entries</span>
            <span className="stat-value">{entries.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div>
            <span className="stat-label">Total Hours</span>
            <span className="stat-value">{totalHours}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="stat-label">AI Enhanced</span>
            <span className="stat-value">{aiCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div>
            <span className="stat-label">Skills Learned</span>
            <span className="stat-value">{totalSkills}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* ============================
            CREATE / UPDATE FORM
        ============================ */}
        <Card>
          {/* <-- 5. Added Draft Status Indicator to the Header --> */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>{editingId ? "Edit Diary Entry" : "New Diary Entry"}</h3>
            
            {hasDraft && !editingId && (
              <span style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <Save size={14} /> Draft Auto-Saved
              </span>
            )}
          </div>

          {message && <div className="alert alert-success">{message}</div>}

          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </label>

            <label>
              Title
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Database migration task"
              />
            </label>

            <label>
              Description
              <textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
                placeholder="Describe what you did today..."
              />
            </label>

            <label>
              Tasks Completed
              <textarea
                rows={3}
                value={form.tasksCompleted}
                onChange={(e) => setForm({ ...form, tasksCompleted: e.target.value })}
                placeholder="One task per line"
              />
            </label>

            <div className="form-row">
              <label>
                Hours Worked
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={form.hoursWorked}
                  onChange={(e) => setForm({ ...form, hoursWorked: Number(e.target.value) })}
                />
              </label>

              <label>
                Skills Used
                <input
                  value={form.skillsUsed}
                  onChange={(e) => setForm({ ...form, skillsUsed: e.target.value })}
                  placeholder="React, SQL, Git"
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleEnhance}
                disabled={aiLoading}
              >
                <Sparkles size={16} />
                {aiLoading ? "Enhancing..." : "AI Enhance"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}

              {/* Added explicit manual clear draft button if they want to discard unsubmitted data */}
              {!editingId && hasDraft && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetForm}
                >
                  Discard Draft
                </button>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <Plus size={16} />
                {editingId ? "Update Entry" : "Save Entry"}
              </button>
            </div>
          </form>
        </Card>

        {/* ============================
            PREVIOUS DIARY ENTRIES
        ============================ */}
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <h3>Previous Entries ({filteredEntries.length})</h3>

            <div
              style={{
                display: "flex",
                gap: ".75rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "10px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: "35px" }}
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="ai">AI Enhanced</option>
              </select>

              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="hours">Hours</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <EmptyState message="No diary entries found." />
          ) : (
            <div className="entry-list">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="entry-item"
                  onClick={() => setSelectedEntry(entry)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="entry-header">
                    <div>
                      <strong>{entry.title}</strong>
                      <br />
                      <span>
                        {entry.date} • {entry.hoursWorked} Hours
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: ".5rem" }}>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(entry);
                        }}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={(e) => handleDelete(e, entry.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p style={{ marginTop: ".75rem" }}>
                    {entry.content.slice(0, 180)}
                    {entry.content.length > 180 ? "..." : ""}
                  </p>

                  {entry.aiEnhanced && (
                    <span className="ai-tag">AI Enhanced</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
        
        {/* DIARY VIEW MODAL */}
        {selectedEntry && (
          <div style={modalOverlayStyle}>
            <div className="card" style={modalContentStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>{selectedEntry.title}</h2>
                <span style={{ color: '#64748b', fontWeight: 500 }}>{selectedEntry.date}</span>
              </div>
              
              <div style={{ marginBottom: '1.5rem', color: '#334155' }}>
                <p><strong>Hours Logged:</strong> {selectedEntry.hoursWorked}h</p>
                <p><strong>Description:</strong></p>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedEntry.content}</p>
                
                {selectedEntry.tasksCompleted?.length > 0 && (
                  <>
                    <p><strong>Tasks Completed:</strong></p>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                      {selectedEntry.tasksCompleted.map((task, i) => <li key={i}>{task}</li>)}
                    </ul>
                  </>
                )}
                
                {selectedEntry.skillsUsed?.length > 0 && (
                  <p><strong>Skills:</strong> {selectedEntry.skillsUsed.join(', ')}</p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setSelectedEntry(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* ============================
              DELETE CONFIRMATION MODAL
            ============================ */}
        {entryToDelete && (
          <div style={modalOverlayStyle} onClick={cancelDelete}>
            <div 
              className="card" 
              style={{ ...modalContentStyle, maxWidth: '400px', textAlign: 'center' }}
              onClick={(e) => e.stopPropagation()} 
            >
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>Delete Entry</h3>
              <p style={{ color: '#475569' }}>Are you sure you want to delete this diary entry? This action cannot be undone.</p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button 
                  type="button"  
                  className="btn btn-primary danger" 
                  onClick={confirmDelete}
                >
                  Yes, Sure
                </button>
                <button 
                  type="button"  
                  className="btn btn-outline" 
                  onClick={cancelDelete}
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>  
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)', 
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '1rem'
};

const modalContentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  maxHeight: '85vh',
  overflowY: 'auto',
  backgroundColor: '#ffffff', 
  border: '1px solid #e2e8f0', 
  color: '#0f172a', 
  padding: '24px',
  borderRadius: '12px'
};