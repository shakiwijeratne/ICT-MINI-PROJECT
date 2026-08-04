import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Search,
  Pencil,
  Calendar,
  Clock,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

import { useAuth } from "../../contexts/useAuth";
import {
  getDiaries,
  createDiary,
  deleteDiary,
  updateDiary,
} from "../../services/dataService";
import { enhanceDiaryEntry } from "../../services/geminiService";
import { PageHeader, Card, EmptyState } from "../../components/ui";
import type { DiaryEntry } from "../../types";

export function StudentDiaryPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortType, setSortType] = useState("newest");

  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    title: "",
    content: "",
    tasksCompleted: "",
    hoursWorked: 8,
    skillsUsed: "",
  });

  // ============================
  // LOAD DIARIES FROM FIRESTORE
  // ============================
  const load = async () => {
    if (!user) return;

    try {
      const data = await getDiaries(user.uid);
      setEntries(data);
    } catch (error) {
      console.error("Loading diary failed:", error);
      setMessage("Unable to load diary entries");
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  // ============================
  // RESET FORM
  // ============================
  const resetForm = () => {
    setEditingId(null);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      title: "",
      content: "",
      tasksCompleted: "",
      hoursWorked: 8,
      skillsUsed: "",
    });
  };

  // ============================
  // CREATE / UPDATE DIARY
  // ============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        studentId: user.uid,
        date: form.date,
        title: form.title,
        content: form.content,
        tasksCompleted: form.tasksCompleted
          .split("\n")
          .filter(Boolean),
        hoursWorked: Number(form.hoursWorked),
        skillsUsed: form.skillsUsed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await updateDiary(editingId, payload);
        setMessage("Diary updated successfully");
      } else {
        await createDiary(payload);
        setMessage("Diary saved successfully");
      }

      resetForm();
      await load();
    } catch (error) {
      console.error("Save diary error:", error);
      setMessage("Failed to save diary");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // AI ENHANCE
  // ============================
  const handleEnhance = async () => {
    if (!form.content) return;

    setAiLoading(true);

    try {
      const enhanced = await enhanceDiaryEntry(
        form.content,
        form.title || "Diary Entry"
      );

      setForm((previous) => ({
        ...previous,
        content: enhanced,
      }));

      setMessage("AI enhancement applied");
    } catch (error) {
      console.error("AI enhance error:", error);
      setMessage("AI enhancement failed");
    } finally {
      setAiLoading(false);
    }
  };

  // ============================
  // EDIT DIARY
  // ============================
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================
  // DELETE DIARY
  // ============================
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Delete this diary entry?");
    if (!confirmDelete) return;

    try {
      await deleteDiary(id);
      setMessage("Diary deleted successfully");

      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }

      await load();
    } catch (error) {
      console.error("Delete diary error:", error);
      setMessage("Failed to delete diary");
    }
  };

  // ============================
  // FILTER AND SORT DIARIES
  // ============================
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

      if (filterType === "ai") {
        return Boolean(entry.aiEnhanced);
      }

      if (filterType === "today") {
        return entry.date === format(new Date(), "yyyy-MM-dd");
      }

      return true;
    });

    switch (sortType) {
      case "oldest":
        data.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "hours":
        data.sort((a, b) => b.hoursWorked - a.hoursWorked);
        break;
      case "title":
        data.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        data.sort((a, b) => b.date.localeCompare(a.date));
    }

    return data;
  }, [entries, searchTerm, filterType, sortType]);

  const totalHours = entries.reduce(
    (sum, entry) => sum + entry.hoursWorked,
    0
  );

  const totalSkills = new Set(
    entries.flatMap((entry) => entry.skillsUsed)
  ).size;

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
          <h3>{editingId ? "Edit Diary Entry" : "New Diary Entry"}</h3>

          {message && <div className="alert alert-success">{message}</div>}

          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    date: e.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Title
              <input
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                required
                placeholder="Database migration task"
              />
            </label>

            <label>
              Description
              <textarea
                rows={6}
                value={form.content}
                onChange={(e) =>
                  setForm({
                    ...form,
                    content: e.target.value,
                  })
                }
                required
                placeholder="Describe what you did today..."
              />
            </label>

            <label>
              Tasks Completed
              <textarea
                rows={3}
                value={form.tasksCompleted}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tasksCompleted: e.target.value,
                  })
                }
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hoursWorked: Number(e.target.value),
                    })
                  }
                />
              </label>

              <label>
                Skills Used
                <input
                  value={form.skillsUsed}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      skillsUsed: e.target.value,
                    })
                  }
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id);
                        }}
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
      </div>
    </div>
  );
}