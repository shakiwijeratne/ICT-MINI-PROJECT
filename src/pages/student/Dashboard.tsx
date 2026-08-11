import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { useInternshipData } from '../../contexts/InternshipContext';
import { PageHeader, Card, StatCard, EmptyState } from '../../components/ui';



export function StudentDashboard() {
  const { user } = useAuth();
  
  // Connect to the centralized data stream
  const { diaries, reports, internship, notifications } = useInternshipData();

  const navigate = useNavigate();

  const pendingReports = reports.filter(
    (r) => r.status === "submitted" || r.status === "company_verified"
  ).length; 

  const totalHours = diaries.reduce((sum, d) => sum + d.hoursWorked, 0);
  
  const aiEntries = diaries.filter((d) => Boolean(d.aiEnhanced)).length;

  const allSkills = diaries.flatMap((d) => d.skillsUsed);
  const uniqueSkills = [...new Set(allSkills)];

  const topSkills = [...uniqueSkills]
    .map((skill) => ({
      skill,
      count: allSkills.filter((s) => s === skill).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

  let daysRemaining = 0;
  if (internship) {
    const end = new Date(internship.endDate);
    daysRemaining = Math.max(
      0,
      Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }

  return (
    <div className="page">
      <PageHeader
        title={`${greeting}, ${user?.displayName ?? 'Student'} 👋`}
        subtitle="Track your internship progress, submit diaries, and manage weekly reports"
      />

      <div className="stats-grid">
        <StatCard label="Diary Entries" value={diaries.length} icon={<BookOpen size={24} />} />
        <StatCard label="Weekly Reports" value={reports.length} icon={<FileText size={24} />} />
        <StatCard label="Hours Logged" value={totalHours} icon={<Clock size={24} />} />
        <StatCard
          label="Progress"
          value={`${internship?.progress ?? 0}%`}
          icon={<TrendingUp size={24} />}
        />
        <StatCard label="AI Enhanced" value={aiEntries} icon={<Sparkles size={24} />} />
        <StatCard label="Skills Learned" value={uniqueSkills.length} icon={<Award size={24} />} />
      </div>

      {internship && (
        <Card className="internship-card">
          <h3>Current Internship</h3>
          <div className="internship-details">
            <div><strong>Company:</strong> {internship.companyName}</div>
            <div><strong>Period:</strong> {internship.startDate} — {internship.endDate}</div>
            <div><strong>Status:</strong> {internship.status}</div>
            <div><strong>Progress:</strong> {internship.progress}%</div>
            <div><strong>Days Remaining:</strong> {daysRemaining}</div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${internship.progress}%` }} />
          </div>
          <p style={{ marginTop: '10px', fontWeight: 600 }}>
            Internship Completion: {internship.progress}%
          </p>
        </Card>
      )}

      <div className="grid-2">
        <Card>
          <h3>Recent Diary Entries</h3>
          {diaries.length === 0 ? (
            <EmptyState message="No diary entries yet. Start logging your daily activities." />
          ) : (
            <ul className="item-list">
              {diaries.slice(0, 5).map((d) => (
                <li 
                  key={d.id} 
                  onClick={() => navigate('/student/diary')}
                  style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                  className="hover-highlight" // Optional: if you have a hover class
                >
                  <strong>{d.date}</strong> — {d.title}
                  <span>{d.hoursWorked}h</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3>Notifications</h3>
          {notifications.length === 0 ? (
            <EmptyState message="No notifications" />
          ) : (
            <ul className="item-list">
              {notifications.map((n) => (
                <li key={n.id} className={n.read ? '' : 'unread'}>
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                </li>
              ))}
            </ul>
          )}

          {pendingReports > 0 && (
            <div className="alert alert-warning">
              You have {pendingReports} draft report(s) pending submission
            </div>
          )}
        </Card>
      </div>


      
      <div className="grid-2">
        <Card>
          <h3>Top Skills</h3>
          {topSkills.length === 0 ? (
            <EmptyState message="No skills recorded yet." />
          ) : (
            <ul className="item-list">
              {topSkills.map((item) => (
                <li key={item.skill}>
                  <strong>{item.skill}</strong>
                  <span>{item.count} entries</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3>Internship Summary</h3>
          <div className="internship-details">
            <div><Calendar size={16} />Total Diary Entries: <strong>{diaries.length}</strong></div>
            <div><Clock size={16} />Total Hours: <strong>{totalHours}</strong></div>
            <div><Sparkles size={16} />AI Enhanced: <strong>{aiEntries}</strong></div>
            <div><Award size={16} />Skills Learned: <strong>{uniqueSkills.length}</strong></div>
          </div>
        </Card>
      </div>
    </div>
  );
}