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

export async function registerUser(
  role: UserRole,
  email: string,
  password: string,
  displayName: string,
  extra: Partial<UserProfile> = {},
): Promise<UserProfile> {
  const profile: UserProfile = {
    uid: '',
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
    companyName: '',
    ...extra,
  };

  if (isFirebaseConfigured && auth && db) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    profile.uid = cred.user.uid;
    const cleanProfile = Object.fromEntries(
      Object.entries(profile).filter(([, value]) => value !== undefined)
    ) as UserProfile;

    await setDoc(doc(db, 'users', cred.user.uid), cleanProfile);
      return profile;
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
    if (!snap.exists()) throw new Error('User profile not found');
    return snap.data() as UserProfile;
  }

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

export async function updateUser(userId: string, data: Partial<UserProfile>): Promise<void> {
  if (isFirebaseConfigured && db) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
  }
  // Optional: If you are using localStore as a fallback like in dataService.ts
  // const users = localStore.getUsers();
  // localStore.setUsers(users.map(u => u.uid === userId ? { ...u, ...data } : u));
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
