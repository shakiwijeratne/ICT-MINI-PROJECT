import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { localStore } from './localStore';
import type { UserProfile, UserRole } from '../types';

function uid(): string {
  return crypto.randomUUID();
}

function cleanData(obj: any) {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  extra: Partial<UserProfile> = {},
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: '',
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
    ...extra,
  };

  if (isFirebaseConfigured && auth && db) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    profile.uid = cred.user.uid;
    
    // THE FIX: Clean the profile before saving it
    const safeProfile = cleanData(profile); 
    await setDoc(doc(db, 'users', cred.user.uid), safeProfile);
    
    return safeProfile as UserProfile;
  }

  profile.uid = uid();
  const users = localStore.getUsers();
  if (Object.values(users).some((u) => u.email === email)) {
    throw new Error('An account with this email already exists');
  }
  users[profile.uid] = profile;
  localStore.setUsers(users);
  localStore.setSession(profile.uid);
  return profile;
}

export async function loginUser(email: string, password: string): Promise<UserProfile> {
  if (isFirebaseConfigured && auth && db) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    
    if (!snap.exists()) {
      // 🚨 AUTO-HEAL: The user is in Auth but not DB. Let's create the DB record now!
      console.warn("Profile missing in database. Auto-creating...");
      const recoveredProfile: UserProfile = {
        uid: cred.user.uid,
        email: email,
        displayName: cred.user.displayName || email.split('@')[0], // Fallback name
        role: 'student', // Assume student for recovered accounts
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', cred.user.uid), recoveredProfile);
      return recoveredProfile;
    }
    
    return snap.data() as UserProfile;
  }

  // localStore login logic 
  const users = localStore.getUsers();
  const user = Object.values(users).find((u) => u.email === email);
  if (!user) throw new Error('Invalid email or password');
  if (password.length < 6) throw new Error('Invalid email or password');
  localStore.setSession(user.uid);
  return user;
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
    return;
  }
  localStore.setSession(null);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }
  return localStore.getUsers()[uid] ?? null;
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback);
  }
  return () => {};
}

export async function getCurrentSessionUser(): Promise<UserProfile | null> {
  if (isFirebaseConfigured && auth?.currentUser) {
    return getUserProfile(auth.currentUser.uid);
  }
  const session = localStore.getSession();
  if (!session) return null;
  return getUserProfile(session);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as UserProfile);
  }
  return Object.values(localStore.getUsers());
}

export async function createUserByAdmin(
  data: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  } & Partial<UserProfile>,
): Promise<UserProfile> {
  if (isFirebaseConfigured && auth?.currentUser) {
    const token = await auth.currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(error?.error ?? 'Failed to create user');
    }

    return response.json() as Promise<UserProfile>;
  }

  const users = localStore.getUsers();
  if (Object.values(users).some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('An account with this email already exists');
  }

  const profile: UserProfile = {
    uid: uid(),
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    companyId: data.companyId,
    companyName: data.companyName,
    supervisorId: data.supervisorId,
    department: data.department,
    indexNumber: data.indexNumber,
    phone: data.phone,
    createdAt: new Date().toISOString(),
  };
  users[profile.uid] = profile;
  localStore.setUsers(users);
  return profile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'users', uid), data);
    return;
  }
  const users = localStore.getUsers();
  if (users[uid]) {
    users[uid] = { ...users[uid], ...data };
    localStore.setUsers(users);
  }
}

export async function deleteUser(uid: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'users', uid));
    return;
  }
  const users = localStore.getUsers();
  delete users[uid];
  localStore.setUsers(users);
}

export function loginDemoUser(role: UserRole): UserProfile {
  localStore.seedDemoData();
  const demoIds: Record<UserRole, string> = {
    student: 'demo-student',
    supervisor: 'demo-supervisor',
    company: 'demo-company',
    admin: 'demo-admin',
  };
  const user = localStore.getUsers()[demoIds[role]];
  localStore.setSession(user.uid);
  return user;
}
