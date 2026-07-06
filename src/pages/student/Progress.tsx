import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '../../contexts/useAuth';
import { getDiaries, getReports, getEvaluations, getInternships } from '../../services/dataService';
import { PageHeader, Card, StatCard } from '../../components/ui';
import { Calendar, Target, Award } from 'lucide-react';
import { TECHNICAL_SKILLS, SOFT_SKILLS } from '../../types';

export function StudentProgressPage() {
  const { user } = useAuth();
  const [weeklyHours, setWeeklyHours] = useState<{ week: string; hours: number }[]>([]);
  const [skillData, setSkillData] = useState<{ skill: string; score: number }[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDiaries(user.uid),
      getReports(user.uid),
      getEvaluations(user.uid),
      getInternships({ studentId: user.uid }),
    ]).then(([diaries, reports, evaluations, internships]) => {
      setProgress(internships[0]?.progress ?? 0);

      const hoursByWeek: Record<string, number> = {};
      diaries.forEach((d) => {
        const week = d.date.slice(0, 7);
        hoursByWeek[week] = (hoursByWeek[week] ?? 0) + d.hoursWorked;
      });
      setWeeklyHours(
        Object.entries(hoursByWeek)
          .map(([week, hours]) => ({ week, hours }))
          .slice(-8),
      );

      const avgSkills: Record<string, number[]> = {};
      evaluations.forEach((ev) => {
        Object.entries({ ...ev.technicalSkills, ...ev.softSkills }).forEach(([skill, score]) => {
          if (!avgSkills[skill]) avgSkills[skill] = [];
          avgSkills[skill].push(score);
        });
      });
      setSkillData(
        Object.entries(avgSkills).map(([skill, scores]) => ({
          skill,
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10,
        })),
      );

      void reports;
    });
  }, [user]);

  const defaultSkills = [...TECHNICAL_SKILLS, ...SOFT_SKILLS].map((s) => ({
    skill: s,
    score: skillData.find((d) => d.skill === s)?.score ?? 0,
  }));

  return (
    <div className="page">
      <PageHeader title="Internship Progress" subtitle="Track your hours, skills, and overall completion" />

      <div className="stats-grid">
        <StatCard label="Overall Progress" value={`${progress}%`} icon={<Target size={24} />} />
        <StatCard label="Skills Evaluated" value={skillData.length} icon={<Award size={24} />} />
        <StatCard label="Weeks Tracked" value={weeklyHours.length} icon={<Calendar size={24} />} />
      </div>

      <div className="grid-2">
        <Card>
          <h3>Weekly Hours</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3>Skill Ratings</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={defaultSkills.filter((s) => s.score > 0).length ? defaultSkills.filter((s) => s.score > 0) : defaultSkills.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" angle={-30} textAnchor="end" height={80} fontSize={11} />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="score" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
