import { useState, useEffect, useMemo } from 'react';
import { Search, AlertCircle, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui';
import { getAllUsers, updateUser } from '../../services/authService';
import type { UserProfile } from '../../types';

export function AdminAssignmentsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSupervisor, setExpandedSupervisor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    student: UserProfile | null;
    currentSupervisor: UserProfile | null;
    targetSupervisor: UserProfile | null;
  }>({
    isOpen: false,
    student: null,
    currentSupervisor: null,
    targetSupervisor: null,
  });

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const students = useMemo(() => users.filter(u => u.role === 'student'), [users]);
  const supervisors = useMemo(() => users.filter(u => u.role === 'supervisor'), [users]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const lowerQuery = searchQuery.toLowerCase();
    return students.filter(s => 
      s.displayName?.toLowerCase().includes(lowerQuery) ||
      s.email?.toLowerCase().includes(lowerQuery)
    );
  }, [students, searchQuery]);

  const handleToggleAssignment = (student: UserProfile, targetSupervisor: UserProfile) => {
    const isCurrentlyAssignedHere = student.supervisorId === targetSupervisor.uid;
    const isAssignedElsewhere = student.supervisorId && student.supervisorId !== targetSupervisor.uid;

    if (isCurrentlyAssignedHere) {
      void executeAssignment(student.uid, '');
    } else if (isAssignedElsewhere) {
      const currentSup = supervisors.find(s => s.uid === student.supervisorId) || null;
      setConflictModal({
        isOpen: true,
        student,
        currentSupervisor: currentSup,
        targetSupervisor,
      });
    } else {
      void executeAssignment(student.uid, targetSupervisor.uid);
    }
  };

  const executeAssignment = async (studentId: string, targetSupervisorId: string) => {
    try {
      await updateUser(studentId, { supervisorId: targetSupervisorId });
      setUsers(prev => prev.map(u => 
        u.uid === studentId ? { ...u, supervisorId: targetSupervisorId } : u
      ));
      
      closeModal();
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Failed to update assignment. Please try again.");
    }
  };

  const closeModal = () => setConflictModal({ isOpen: false, student: null, currentSupervisor: null, targetSupervisor: null });

  return (
    <div className="page">
      <PageHeader title="Assign Supervisors" subtitle="Manage student-supervisor groups and resolve conflicts" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search students by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 44px', borderRadius: '8px',
                border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem'
              }}
            />
          </div>

          <Card>
            {loading ? <p style={{ color: '#64748b' }}>Loading supervisors...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {supervisors.map(supervisor => {
                  const isExpanded = expandedSupervisor === supervisor.uid;
                  const assignedCount = students.filter(s => s.supervisorId === supervisor.uid).length;
                  const isAtCapacity = assignedCount >= 5;

                  return (
                    <div key={supervisor.uid} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                      <button 
                        onClick={() => setExpandedSupervisor(isExpanded ? null : supervisor.uid)}
                        style={{ 
                          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '16px', background: '#f8fafc', border: 'none', cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{supervisor.displayName}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{supervisor.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '999px',
                            background: isAtCapacity ? '#fee2e2' : '#e0f2fe', color: isAtCapacity ? '#991b1b' : '#0369a1'
                          }}>
                            {assignedCount} / 5 Assigned
                          </span>
                          {isExpanded ? <ChevronUp size={18} color="#64748b"/> : <ChevronDown size={18} color="#64748b"/>}
                        </div>
                      </button>

                      {isExpanded && (
                        <div style={{ padding: '0', background: '#fff' }}>
                          {filteredStudents.map(student => {
                            const isAssignedToThis = student.supervisorId === supervisor.uid;
                            const isAssignedElsewhere = student.supervisorId && student.supervisorId !== supervisor.uid;
                            
                            return (
                              <label key={student.uid} style={{ 
                                display: 'flex', alignItems: 'center', padding: '12px 16px', 
                                borderTop: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s',
                                background: isAssignedToThis ? '#f0fdf4' : 'transparent'
                              }}>
                                <input 
                                  type="checkbox"
                                  checked={isAssignedToThis}
                                  onChange={() => handleToggleAssignment(student, supervisor)}
                                  disabled={!isAssignedToThis && isAtCapacity}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0f172a' }}
                                />
                                <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: isAssignedToThis ? 600 : 400, color: '#1e293b' }}>
                                    {student.displayName}
                                  </span>
                                  {isAssignedElsewhere && !isAssignedToThis && (
                                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <AlertCircle size={12} /> Already assigned
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', color: '#0f172a', margin: 0 }}>Supervisor Groups</h3>
          {supervisors.map(supervisor => {
            const groupStudents = students.filter(s => s.supervisorId === supervisor.uid);
            if (groupStudents.length === 0) return null;

            return (
                <div style = {{ padding: '16px' }}>
                <Card key={supervisor.uid}>
                    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{supervisor.displayName}'s Group</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{groupStudents.length} Students</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {groupStudents.map(s => (
                        <li key={s.uid} style={{ fontSize: '0.85rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} color="#10b981" /> {s.displayName}
                        </li>
                    ))}
                    </ul>
                </Card>
                </div>
            );
          })}
        </div>
      </div>

      {conflictModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            background: '#fff', padding: '32px', borderRadius: '16px', 
            width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#d97706' }}>
              <AlertCircle size={28} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Reassign Student?</h3>
            </div>
            
            <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
              <strong>{conflictModal.student?.displayName}</strong> is already under 
              <strong> {conflictModal.currentSupervisor?.displayName}'s</strong> group. 
              <br/><br/>
              Do you want to remove them from their current group and reassign them to <strong>{conflictModal.targetSupervisor?.displayName}</strong>?
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={closeModal}
                style={{ padding: '10px 16px', border: '1px solid #e2e8f0', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: '#475569' }}
              >
                No, Cancel
              </button>
              <button 
                onClick={() => executeAssignment(conflictModal.student!.uid, conflictModal.targetSupervisor!.uid)}
                style={{ padding: '10px 16px', border: 'none', background: '#0f172a', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                Yes, Reassign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}