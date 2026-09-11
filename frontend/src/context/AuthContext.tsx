import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { fetchUsers, fetchUser } from '../services/api.js';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  switchUser: (userId: string) => Promise<void>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInitialUsers = async () => {
    try {
      setLoading(true);
      const userList = await fetchUsers();
      setUsers(userList);

      const savedUserId = localStorage.getItem('farketmez_user_id');
      if (savedUserId && userList.some(u => u.id === savedUserId)) {
        const fullUser = await fetchUser(savedUserId);
        setCurrentUser(fullUser);
      } else if (userList.length > 0) {
        setCurrentUser(userList[0]);
        localStorage.setItem('farketmez_user_id', userList[0].id);
      }
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialUsers();
  }, []);

  const switchUser = async (userId: string) => {
    try {
      const user = await fetchUser(userId);
      setCurrentUser(user);
      localStorage.setItem('farketmez_user_id', user.id);
    } catch (e) {
      console.error('Error switching user:', e);
    }
  };

  const refreshUsers = async () => {
    const userList = await fetchUsers();
    setUsers(userList);
    if (currentUser) {
      const updated = await fetchUser(currentUser.id);
      setCurrentUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, loading, switchUser, setCurrentUser, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
