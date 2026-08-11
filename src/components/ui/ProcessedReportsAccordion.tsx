import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { StatusBadge } from '.'; // Assuming you have this from your existing code
import type { WeeklyReport, UserProfile } from '../../types';

interface ProcessedReportsAccordionProps {
  reports: WeeklyReport[];
  students: UserProfile[];
  viewerRole: 'university_supervisor' | 'company_supervisor';
}

export function ProcessedReportsAccordion({ reports, students, viewerRole }: ProcessedReportsAccordionProps) {
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Group reports by student ID
  const groupedReports = useMemo(() => {
    const groups: Record<string, WeeklyReport[]> = {};
    reports.forEach((report) => {
      if (!groups[report.studentId]) {
        groups[report.studentId] = [];
      }
      groups[report.studentId].push(report);
    });
    
    // Sort reports inside each group by weekStart (descending)
    Object.keys(groups).forEach(studentId => {
      groups[studentId].sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
    });
    
    return groups;
  }, [reports]);

  const toggleStudent = (studentId: string) => {
    setExpandedStudentId(prev => prev === studentId ? null : studentId);
  };

  if (reports.length === 0) {
    return null; // Don't show the section if there's no history
  }

  return (
    <div style={{ marginTop: '32px' }}>
      <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
        Previously Processed Reports
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Object.entries(groupedReports).map(([studentId, studentReports]) => {
          const student = students.find(s => s.uid === studentId);
          const isExpanded = expandedStudentId === studentId;

          return (
            <div key={studentId} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
              
              {/* Accordion Header (Clickable) */}
              <button
                onClick={() => toggleStudent(studentId)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px', background: '#f8fafc', border: 'none', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>
                    {student?.displayName || 'Unknown Student'}
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {studentReports.length} processed report{studentReports.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
              </button>

              {/* Accordion Body (Expanded state) */}
              {isExpanded && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {studentReports.map(report => (
                    <div 
                      key={report.id} 
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Calendar size={18} color="#94a3b8" />
                        <div>
                          <p style={{ margin: 0, fontWeight: 500, color: '#334155', fontSize: '0.95rem' }}>
                            Week of {report.weekStart}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                            {report.weekEnd ? `Ends: ${report.weekEnd}` : 'Standard Week'}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <StatusBadge status={report.status} />
                        
                        {/* Contextual subtitle based on who is viewing and what the status is */}
                        {report.status === 'rejected' && viewerRole === 'university_supervisor' && (
                          <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} /> Rejected by you
                          </span>
                        )}
                        {report.status === 'rejected' && viewerRole === 'company_supervisor' && (
                          <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={12} /> Rejected by you
                          </span>
                        )}
                        {report.status === 'company_verified' && viewerRole === 'company_supervisor' && (
                          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Waiting for Uni Approval
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}