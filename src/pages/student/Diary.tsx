import { useEffect, useState } from 'react';
import { Sparkles, Plus, Trash2, X, Calendar, Clock } from 'lucide-react'; // Added helpful icons
import { format } from 'date-fns';
import { useAuth } from '../../contexts/useAuth';
import { getDiaries, createDiary, deleteDiary } from '../../services/dataService';
import { enhanceDiaryEntry } from '../../services/geminiService';
import { PageHeader, Card, EmptyState } from '../../components/ui';
import type { DiaryEntry } from '../../types';

export function StudentDiaryPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    content: '',
    tasksCompleted: '',
    hoursWorked: 8,
    skillsUsed: '',
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // 👉 NEW STATE: Keeps track of which entry is being viewed in full
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const load = () => {
    if (!user) return;
    getDiaries(user.uid).then(setEntries);
  };

  useEffect(load, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage('');
    try {
      await createDiary({
        studentId: user.uid,
        date: form.date,
        title: form.title,
        content: form.content,
        tasksCompleted: form.tasksCompleted.split('\n').filter(Boolean),
        hoursWorked: form.hoursWorked,
        skillsUsed: form.skillsUsed.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setForm({ ...form, title: '', content: '', tasksCompleted: '', skillsUsed: '' });
      setMessage('Diary entry saved successfully');
      load();
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!form.content) return;
    setAiLoading(true);
    try {
      const enhanced = await enhanceDiaryEntry(form.content, form.title || 'Diary Entry');
      setForm({ ...form, content: enhanced });
      setMessage('AI enhancement applied — review before saving');
    } catch {
      setMessage('AI enhancement failed. Check your Gemini API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    // 👉 Prevents clicking the delete button from opening the modal box accidentally
    e.stopPropagation(); 
    await deleteDiary(id);
    load();
  };

  return (
    <div className="page">
      <PageHeader
        title="Daily Internship Diary"
        subtitle="Record your daily activities, tasks, and learning outcomes"
      />

      <div className="grid-2">
        {/* Left Column: Form Setup */}
        <Card>
          <h3>New Entry</h3>
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
                placeholder="e.g. Database migration task"
                required
              />
            </label>
            <label>
              Content
              <textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Describe your activities, learnings, and challenges..."
                required
              />
            </label>
            <label>
              Tasks Completed (one per line)
              <textarea
                rows={3}
                value={form.tasksCompleted}
                onChange={(e) => setForm({ ...form, tasksCompleted: e.target.value })}
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
                Skills Used (comma-separated)
                <input
                  value={form.skillsUsed}
                  onChange={(e) => setForm({ ...form, skillsUsed: e.target.value })}
                  placeholder="React, SQL, Git"
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={handleEnhance} disabled={aiLoading}>
                <Sparkles size={16} /> {aiLoading ? 'Enhancing...' : 'AI Enhance'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Plus size={16} /> Save Entry
              </button>
            </div>
          </form>
        </Card>

        {/* Right Column: Previous Entries List View */}
        <Card>
          <h3>Previous Entries ({entries.length})</h3>
          {entries.length === 0 ? (
            <EmptyState message="No entries yet" />
          ) : (
            <div className="entry-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {entries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="entry-item"
                  onClick={() => setSelectedEntry(entry)} // 👉 Click to view details
                  style={{ 
                    cursor: 'pointer', 
                    padding: '1rem', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="entry-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Fixed Text Cluttering Structure */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>{entry.title}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {entry.date} · {entry.hoursWorked}hWorked
                      </span>
                    </div>
                    <button type="button" className="icon-btn danger" onClick={(e) => handleDelete(entry.id, e)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p style={{ marginTop: '0.5rem', color: '#475569' }}>
                    {entry.content.slice(0, 140)}{entry.content.length > 140 ? '...' : ''}
                  </p>
                  {entry.aiEnhanced && <span className="ai-tag" style={{ marginTop: '0.5rem', display: 'inline-block' }}>AI Enhanced</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 👉 NEW ELEMENT: Dynamic Details Modal Backdrop */}
      {selectedEntry && (
        <div 
          className="modal-backdrop" 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 1000, padding: '1rem'
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div 
            className="modal-content"
            style={{
              backgroundColor: '#fff', padding: '2rem', borderRadius: '12px',
              maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()} // Keeps modal open when internal space is clicked
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h2>{selectedEntry.title}</h2>
              <button className="icon-btn" onClick={() => setSelectedEntry(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0', fontSize: '0.9rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={16} /> {selectedEntry.date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={16} /> {selectedEntry.hoursWorked} Hours
              </span>
            </div>

            <div style={{ margin: '1.5rem 0' }}>
              <h4>Description</h4>
              <p style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.6' }}>{selectedEntry.content}</p>
            </div>

            {selectedEntry.tasksCompleted && selectedEntry.tasksCompleted.length > 0 && (
              <div style={{ margin: '1.5rem 0' }}>
                <h4>Tasks Completed</h4>
                <ul style={{ paddingLeft: '1.25rem', color: '#334155' }}>
                  {selectedEntry.tasksCompleted.map((task, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{task}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedEntry.skillsUsed && selectedEntry.skillsUsed.length > 0 && (
              <div style={{ margin: '1.5rem 0' }}>
                <h4>Skills Acquired</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {selectedEntry.skillsUsed.map((skill, idx) => (
                    <span key={idx} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}