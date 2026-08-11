import { useEffect, useState } from "react";
import { Users, Building2, GraduationCap } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import { getInternships } from "../../services/dataService";
import { PageHeader, Card, EmptyState } from "../../components/ui";
import type { Internship } from "../../types";
import { getAllUsers } from "../../services/authService";

interface AssignedCompanyStudent extends Internship {
  universitySupervisorName: string;
  universitySupervisorEmail: string;
}

export function CompanyStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<AssignedCompanyStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      if (!user) return;

      try {
        setLoading(true);

        const [allUsers, allInternships] = await Promise.all([
          getAllUsers(),
          getInternships(),
        ]);

        const companySupervisor = allUsers.find(
          (u) => u.uid === user.uid && u.role === "company"
        );

        if (!companySupervisor) {
          console.warn("Company supervisor profile not found.");
          setStudents([]);
          return;
        }

        const assignedInternships = allInternships.filter((internship) => {
          const sameCompany =
            internship.companyId === companySupervisor.companyId;
          const sameSupervisor =
            internship.companySupervisor === companySupervisor.displayName;

          return sameCompany && sameSupervisor;
        });

        const mappedStudents = assignedInternships.map((internship) => {
          const student = allUsers.find(
            (u) => u.uid === internship.studentId && u.role === "student"
          );

          const universitySupervisor = allUsers.find(
            (u) =>
              u.uid === student?.supervisorId ||
              u.uid === internship.universitySupervisorId
          );

          return {
            ...internship,
            universitySupervisorName:
              universitySupervisor?.displayName ?? "Not Assigned",
            universitySupervisorEmail:
              universitySupervisor?.email ?? "Email not available",
          };
        });

        setStudents(mappedStudents);
      } catch (error) {
        console.error("Error loading company students:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [user]);

  return (
    <div className="page">
      <PageHeader
        title="My Students"
        subtitle="View interns assigned to you and their university supervisors"
      />

      {loading ? (
        <Card>
          <p>Loading assigned students...</p>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <EmptyState message="No students are currently assigned to you" />
        </Card>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {students.map((student) => (
            <Card key={student.id}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    background: "#e0e7ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={22} color="#2563eb" />
                </div>

                <div>
                  <h3 style={{ margin: 0 }}>{student.studentName}</h3>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      color: "#64748b",
                      fontSize: "0.85rem",
                      marginBottom: "5px",
                    }}
                  >
                    <Building2 size={16} />
                    Company
                  </div>
                  <strong>{student.companyName}</strong>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      color: "#64748b",
                      fontSize: "0.85rem",
                      marginBottom: "5px",
                    }}
                  >
                    <GraduationCap size={16} />
                    University Supervisor
                  </div>
                  <strong>{student.universitySupervisorName}</strong>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.85rem",
                      marginTop: "4px",
                    }}
                  >
                    {student.universitySupervisorEmail}
                  </div>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.85rem",
                      marginBottom: "5px",
                    }}
                  >
                    Internship Position
                  </div>
                  <strong>{student.position}</strong>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.85rem",
                      marginBottom: "5px",
                    }}
                  >
                    Status
                  </div>
                  <strong>{student.status}</strong>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.85rem",
                      marginBottom: "5px",
                    }}
                  >
                    Internship Progress
                  </div>
                  <strong>{student.progress}%</strong>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "0.85rem",
                      marginBottom: "5px",
                    }}
                  >
                    Internship Period
                  </div>
                  <strong>
                    {student.startDate} - {student.endDate}
                  </strong>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}