import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  Settings, 
  Mail, 
  Hash, 
  Building2, 
  Camera, 
  Bell, 
  Moon 
} from 'lucide-react';

// --- Adjust these import paths to match your project structure ---
import { auth, db } from '../../services/firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { updateProfilePhoto } from '../../services/dataService'; 

const Profile = () => {
  const [userData, setUserData] = useState({
    name: 'Loading...',
    role: 'Loading...',
    email: 'Loading...',
    indexNumber: 'Loading...',
    department: 'Loading...',
    photoURL: ''
  });
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. Fetch User Data from Firestore ---
  useEffect(() => {
    // Listen for Firebase authentication state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Reference the specific user's document in Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData({
              name: data.name || currentUser.displayName || 'Unknown User',
              role: data.role || 'Student',
              email: data.email || currentUser.email || 'No email provided',
              indexNumber: data.indexNumber || 'Not specified',
              department: data.department || 'Not specified',
              photoURL: data.photoURL || currentUser.photoURL || ''
            });
          } else {
            console.warn("User document does not exist in Firestore!");
            // Fallback to auth object data if Firestore doc is missing
            setUserData(prev => ({
              ...prev,
              name: currentUser.displayName || 'Unknown User',
              email: currentUser.email || 'No email provided',
            }));
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Handle logged out state (e.g., redirect to login)
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // --- 2. Handle Profile Photo Upload ---
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        
        // Call the function from your dataService.ts
        await updateProfilePhoto(auth.currentUser!.uid, base64String);
        
        // Update local state to reflect the new image instantly
        setUserData(prev => ({ ...prev, photoURL: base64String }));
      } catch (error) {
        console.error("Error updating profile photo:", error);
        alert("Failed to upload photo. Please try again.");
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsDataURL(file); // Convert file to Base64
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-6 lg:p-8 space-y-6 text-slate-800">
      
      {/* --- Profile Header Card --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="relative group flex-shrink-0">
          <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
            {userData.photoURL ? (
              <img 
                src={userData.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={48} className="text-slate-300" />
            )}
          </div>
          
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          {/* Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isLoading}
            className={`absolute bottom-0 right-0 p-2 rounded-full text-white shadow-lg transition-colors cursor-pointer ${isUploading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Camera size={16} />
          </button>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isLoading ? '...' : userData.name}
          </h1>
          <p className="text-blue-600 font-semibold uppercase tracking-widest text-xs mt-1.5">
            {isLoading ? '...' : userData.role}
          </p>
        </div>
      </div>

      {/* --- General Settings Card --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Settings size={20} className="text-slate-500" />
          General Settings
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Bell size={18} />
              </div>
              <span className="font-medium text-slate-700">Email Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={emailNotifications}
                onChange={() => setEmailNotifications(!emailNotifications)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                <Moon size={18} />
              </div>
              <div>
                <span className="font-medium text-slate-700 block">Dark Mode</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-not-allowed">
              <input type="checkbox" className="sr-only peer" disabled />
              <div className="w-11 h-6 bg-slate-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5"></div>
            </label>
          </div>
        </div>
      </div>

      {/* --- Personal Information Card --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
          Personal Information
        </h2>
        
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <div className="text-slate-500 flex items-center gap-2 font-medium text-sm">
              <Mail size={16} /> Email Address
            </div>
            <div className="md:col-span-2 font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100 break-all">
              {isLoading ? '...' : userData.email}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <div className="text-slate-500 flex items-center gap-2 font-medium text-sm">
              <Hash size={16} /> Index Number
            </div>
            <div className="md:col-span-2 font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
              {isLoading ? '...' : userData.indexNumber}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <div className="text-slate-500 flex items-center gap-2 font-medium text-sm">
              <Building2 size={16} /> Department
            </div>
            <div className="md:col-span-2 font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
              {isLoading ? '...' : userData.department}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;