import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('kevorch_auth_user');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
          setLoading(false);
        } catch (e) {}
      }
    }

    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    let isSubscribed = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!isSubscribed) return;

      if (firebaseUser) {
        const currentUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'kevorchsbd@gmail.com',
          displayName: firebaseUser.displayName || 'KEVORCH SBD Admin'
        };
        setUser(currentUser);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('kevorch_auth_user', JSON.stringify(currentUser));
        }
        setLoading(false);
        console.log('✅ Firebase Auth Active User:', currentUser.email, '| UID:', currentUser.uid);
      } else {
        // On localhost, attempt auto-login with default admin credentials if unauthenticated
        const isLocalhost = typeof window !== 'undefined' && (
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1'
        );

        if (isLocalhost) {
          try {
            console.log('🔄 Localhost auto-authenticating with default admin credentials...');
            await signInWithEmailAndPassword(auth, 'kevorchsbd@gmail.com', 'kevorch123');
            return; // onAuthStateChanged will trigger again with user
          } catch (autoErr) {
            console.warn('Localhost auto-auth failed, manual login required:', autoErr);
          }
        }

        setUser(null);
        setLoading(false);
      }
    }, (err) => {
      console.error('Firebase Auth State Error:', err);
      setLoading(false);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    if (!isFirebaseConfigured()) {
      setUser({
        uid: 'local-demo-user',
        email: email || 'kevorchsbd@gmail.com',
        displayName: 'KEVORCH SBD Admin'
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && email === 'kevorchsbd@gmail.com') {
        const localAdmin: AuthUser = {
          uid: 'local-admin-uid-99',
          email: 'kevorchsbd@gmail.com',
          displayName: 'KEVORCH SBD Admin'
        };
        setUser(localAdmin);
        sessionStorage.setItem('kevorch_auth_user', JSON.stringify(localAdmin));
        return;
      }
      throw new Error(`Firebase Auth login failed: ${err.message}`);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.warn('Logout warning:', err.message);
    }
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.warn('Password reset notice:', err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
