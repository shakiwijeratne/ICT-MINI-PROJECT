import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfilePhoto } from '../../services/dataService'; 
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  UserCheck, 
  GraduationCap, 
  Calendar, 
  IdCard, 
  Edit2, 
  Check, 
  ArrowLeft, 
  Trash2,
  ShieldAlert,
  X,
  Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core visual data state
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    role: user?.role || 'student',
    email: user?.email || '',
    phone: '',
    studentId: '',
    department: '',
    company: '',
    companySupervisor: '',
    universitySupervisor: '',
    internshipPeriod: '',
    photoURL: user?.photoURL || ''
  });

  // Mutable state for the edit form
  const [formData, setFormData] = useState({ ...profileData });

  // 1. Fetch comprehensive user data from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          
          const loadedData = {
            displayName: data.name || data.displayName || user.displayName || 'Unknown User',
            role: data.role || user.role || 'student',
            email: data.email || user.email || 'No email provided',
            phone: data.phone || '',
            studentId: data.indexNumber || data.studentId || 'Not specified',
            department: data.department || 'Not specified',
            company: data.company || 'Not Assigned',
            companySupervisor: data.companySupervisor || 'Not Assigned',
            universitySupervisor: data.universitySupervisor || 'Not Assigned',
            internshipPeriod: data.internshipPeriod || 'Not specified',
            photoURL: data.photoURL || user.photoURL || ''
          };
          
          setProfileData(loadedData);
          setFormData(loadedData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // 2. Handle Image Upload directly to Firebase Storage
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        await updateProfilePhoto(user.uid, base64String);
        
        // Instantly update the UI
        setProfileData(prev => ({ ...prev, photoURL: base64String }));
      } catch (error) {
        console.error("Error updating profile photo:", error);
        alert("Failed to upload photo. Please try again.");
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsDataURL(file); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Save modified fields back to Firestore
  const handleSave = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Update specific document fields
      await updateDoc(userDocRef, {
        name: formData.displayName, 
        phone: formData.phone,
        indexNumber: formData.studentId, 
        company: formData.company,
        companySupervisor: formData.companySupervisor,
        universitySupervisor: formData.universitySupervisor,
        internshipPeriod: formData.internshipPeriod,
      });

      // Sync the visual profile data with the newly saved form data
      setProfileData(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save changes.");
    }
  };

  const confirmDelete = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div style={{ padding: '24px 32px 32px 32px', maxWidth: '1080px', margin: '0 auto', fontFamily: 'inherit', color: '#1f2937' }}>
      
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          marginBottom: '16px',
          color: '#4b5563',
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            padding: '32px 40px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            
            {/* Interactive Avatar Container */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => !isLoading && !isUploading && fileInputRef.current?.click()}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  cursor: (isLoading || isUploading) ? 'default' : 'pointer',
                  opacity: isUploading ? 0.6 : 1
                }}
              >
                {profileData.photoURL ? (
                  <img 
                    src={profileData.photoURL} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <div 
                onClick={() => !isLoading && !isUploading && fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: '-4px',
                  backgroundColor: isUploading ? '#94a3b8' : '#2563eb',
                  color: 'white',
                  padding: '6px',
                  borderRadius: '50%',
                  cursor: (isLoading || isUploading) ? 'default' : 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Camera size={14} />
              </div>
            </div>

            <div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#ffffff', textTransform: 'capitalize' }}>
                {isLoading ? 'Loading...' : profileData.displayName}
              </h1>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {isLoading ? '...' : profileData.role}
              </span>
            </div>
          </div>

          <div>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(profileData); // Revert changes
                    setIsEditing(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    color: '#1e40af',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  <Check size={16} /> Save Changes
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ffffff',
                  color: '#1e40af',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <Edit2 size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '32px 40px' }}>
          
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#2563eb" /> Personal Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color="#64748b" />
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '14px', minWidth: '160px' }}>Full Name :</span>
              {isEditing ? (
                <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{isLoading ? '...' : profileData.displayName}</span>
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IdCard size={16} color="#64748b" />
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '14px', minWidth: '160px' }}>Student ID :</span>
              {isEditing ? (
                <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{isLoading ? '...' : profileData.studentId}</span>
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} color="#64748b" />
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '14px', minWidth: '160px' }}>Email Address :</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>{isLoading ? '...' : profileData.email}</span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="#64748b" />
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '14px', minWidth: '160px' }}>Phone Number :</span>
              {isEditing ? (
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+94 7X XXX XXXX" style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{isLoading ? '...' : (profileData.phone || 'Not provided')}</span>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '24px 0' }} />

          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="#2563eb" /> Internship Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color="#64748b" />
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '14px', minWidth: '160px' }}>Assigned Company :</span>
              {isEditing ? (
                <input type="text" name="company" value={formData.company} onChange={handleChange} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{isLoading ? '...' : profileData.company}</span>
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="#64748b" />
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '14px', minWidth: '160px' }}>Internship Period :</span>
              {isEditing ? (
                <input type="text" name="internshipPeriod" value={formData.internshipPeriod} onChange={handleChange} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{isLoading ? '...' : profileData.internshipPeriod}</span>
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={16} color="#64748b" />
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '14px', minWidth: '160px' }}>Company Supervisor :</span>
              {isEditing ? (
                <input type="text" name="companySupervisor" value={formData.companySupervisor} onChange={handleChange} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{isLoading ? '...' : profileData.companySupervisor}</span>
              )}
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={16} color="#64748b" />
              <span style={{ fontWeight: 600, color: '#64748b', fontSize: '14px', minWidth: '160px' }}>University Supervisor :</span>
              {isEditing ? (
                <input type="text" name="universitySupervisor" value={formData.universitySupervisor} onChange={handleChange} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{isLoading ? '...' : profileData.universitySupervisor}</span>
              )}
            </div>
          </div>

        </div>
      </div>

      <div
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={22} color="#dc2626" />
          <div>
            <h4 style={{ margin: 0, color: '#991b1b', fontSize: '14px', fontWeight: 600 }}>Delete Account</h4>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '12px', marginTop: '2px' }}>
              Once deleted, your account cannot be recovered.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Trash2 size={15} /> Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
              Delete Account
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}