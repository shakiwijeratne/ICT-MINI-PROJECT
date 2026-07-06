import { useEffect, useState } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
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

  const handleDelete = async (id: string) => {
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

        <Card>
          <h3>Previous Entries ({entries.length})</h3>
          {entries.length === 0 ? (
            <EmptyState message="No entries yet" />
          ) : (
            <div className="entry-list">
              {entries.map((entry) => (
                <div key={entry.id} className="entry-item">
                  <div className="entry-header">
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{entry.date} · {entry.hoursWorked}h</span>
                    </div>
                    <button type="button" className="icon-btn danger" onClick={() => handleDelete(entry.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p>{entry.content.slice(0, 200)}{entry.content.length > 200 ? '...' : ''}</p>
                  {entry.aiEnhanced && <span className="ai-tag">AI Enhanced</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
