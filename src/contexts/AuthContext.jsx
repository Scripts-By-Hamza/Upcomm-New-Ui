import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_USERS } from '../data/dummyUsers';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  deactivatePushSubscriptionOnLogout,
  reassociatePushSubscriptionOnLogin,
} from '../lib/pwa/pushSubscription';

const AuthContext = createContext(null);

const STORAGE_KEY = 'upcomm_logged_in_user_id';
const USER_CACHE_KEY = 'upcomm_cached_user';

export function AuthProvider({ children }) {
  // Store list of users
  const [users, setUsers] = useState(INITIAL_USERS);
  
  // Stored logged in user: check localStorage
  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null;
  });

  const [cachedUser, setCachedUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_CACHE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEY, currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    }
  }, [currentUserId]);

  // Synchronize logout / session termination across all active browser tabs instantly
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        if (!e.newValue) {
          setCurrentUserId(null);
          setCachedUser(null);
        } else if (e.newValue !== currentUserId) {
          setCurrentUserId(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUserId]);

  // Load real users from Supabase
  const refreshUsers = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data && data.length > 0) {
        setUsers(data);
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId) {
          const matched = data.find((u) => u.id === savedId);
          if (matched) {
            setCachedUser(matched);
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(matched));
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch live users from Supabase:', err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // 1. Initial Load
  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // 2. Global Portal Auto-Refresh Users every 5 minutes (300,000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUsers();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshUsers]);

  const currentUser = React.useMemo(() => {
    if (!currentUserId) return null;
    return users.find((u) => u.id === currentUserId) || cachedUser || null;
  }, [currentUserId, users, cachedUser]);

  // Synchronize authenticated user theme preference to root document element
  useEffect(() => {
    if (currentUser) {
      const userTheme = currentUser.theme === 'dark' ? 'dark' : 'light';
      if (userTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      try {
        localStorage.setItem(`upcomm_theme_${currentUser.id}`, userTheme);
      } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [currentUser]);

  const login = async (email, password) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. If Supabase is configured, check Supabase 'users' table directly
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: dbUsers, error: dbError } = await supabase
            .from('users')
            .select('*')
            .ilike('email', cleanEmail);

          if (!dbError && dbUsers && dbUsers.length > 0) {
            const dbUser = dbUsers[0];

            if (!dbUser.is_active) {
              setLoading(false);
              return { success: false, message: 'Your account is deactivated. Please contact your Admin.' };
            }

            // Strict password check against Supabase table column "password"
            const dbPassword = dbUser.password || '123456';
            if (password !== dbPassword) {
              setLoading(false);
              return { success: false, message: 'Invalid password. Please check your password and try again.' };
            }

            // Sync user into local state
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === dbUser.id);
              if (exists) {
                return prev.map((u) => (u.id === dbUser.id ? { ...u, ...dbUser } : u));
              }
              return [dbUser, ...prev];
            });

            setCurrentUserId(dbUser.id);
            setCachedUser(dbUser);
            localStorage.setItem(STORAGE_KEY, dbUser.id);
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(dbUser));
            reassociatePushSubscriptionOnLogin(dbUser.id);
            setLoading(false);
            return { success: true, user: dbUser };
          }
        } catch (supaErr) {
          console.warn('Supabase users query warning, checking local state:', supaErr);
        }
      }

      // 2. Fallback to local users state with strict password check
      const localUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (localUser) {
        if (!localUser.is_active) {
          setLoading(false);
          return { success: false, message: 'Your account is deactivated. Please contact your Admin.' };
        }

        const expectedPassword = localUser.password || '123456';
        if (password !== expectedPassword) {
          setLoading(false);
          return { success: false, message: 'Invalid password. Please check your password and try again.' };
        }

        setCurrentUserId(localUser.id);
        setCachedUser(localUser);
        localStorage.setItem(STORAGE_KEY, localUser.id);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(localUser));
        reassociatePushSubscriptionOnLogin(localUser.id);
        setLoading(false);
        return { success: true, user: localUser };
      }

      setLoading(false);
      return { success: false, message: 'No user account found with this email address.' };
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message || 'Login failed.' };
    }
  };

  const logout = async () => {
    const priorUserId = currentUserId;
    if (priorUserId) {
      await deactivatePushSubscriptionOnLogout(priorUserId);
    }
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    setCurrentUserId(null);
    setCachedUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
  };

  const switchUser = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUserId(user.id);
      setCachedUser(user);
      localStorage.setItem(STORAGE_KEY, user.id);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    }
  };

  const changePassword = async (newPassword) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUserId
          ? { ...u, must_change_password: false, password: newPassword }
          : u
      )
    );

    // Sync to Supabase users table if configured
    if (isSupabaseConfigured && supabase && currentUserId) {
      try {
        await supabase
          .from('users')
          .update({ must_change_password: false, password: newPassword })
          .eq('id', currentUserId);
      } catch (e) {
        console.warn('Supabase password update error:', e);
      }
    }
    return true;
  };

  const uploadAvatar = async (file) => {
    if (!file || !currentUserId) return null;

    // If Supabase Storage is configured, upload to 'avatars' bucket
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            updateAvatar(publicUrlData.publicUrl);
            return publicUrlData.publicUrl;
          }
        } else {
          console.warn('Supabase storage upload returned error, using local data URL:', uploadError.message);
        }
      } catch (err) {
        console.warn('Supabase storage upload exception:', err);
      }
    }

    // Fallback: create base64 data URL for immediate local preview and state persistence
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;
        updateAvatar(base64Url);
        resolve(base64Url);
      };
      reader.readAsDataURL(file);
    });
  };

  const updateAvatar = (newAvatarUrl) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUserId
          ? { ...u, avatar_url: newAvatarUrl }
          : u
      )
    );

    // Sync to Supabase users table if configured
    if (isSupabaseConfigured && supabase && currentUserId) {
      supabase
        .from('users')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', currentUserId)
        .then(() => {})
        .catch((e) => console.warn('Supabase users avatar update warning:', e));
    }
  };

  const createUser = async (userData) => {
    const id = `usr-${Date.now()}`;
    const defaultCustomId =
      userData.custom_id?.trim() || userData.full_name?.trim().split(/\s+/)[0] || null;
    const newUser = {
      id,
      custom_id: defaultCustomId,
      email: userData.email.trim().toLowerCase(),
      password: userData.password || '123456',
      full_name: userData.full_name.trim(),
      designation: userData.designation?.trim() || 'Team Member Specialist',
      role: userData.role || 'team_member',
      department_id: userData.department_id || null,
      avatar_url:
        userData.avatar_url ||
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250`,
      is_active: true,
      must_change_password: true,
      can_chat_with_ceo: true,
      is_system_account: false,
      exclude_from_directory: false,
      suppress_activity_logging: false,
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('users').insert(newUser);
        if (error) {
          console.error('Supabase user insert error:', error);
        }
      } catch (err) {
        console.error('Supabase user insert exception:', err);
      }
    }

    return newUser;
  };

  const updateUser = async (userId, updates) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );

    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ ...updates })
          .eq('id', userId);
        if (error) {
          console.error('Supabase user update error:', error);
        }
      } catch (err) {
        console.error('Supabase user update exception:', err);
      }
    }
  };

  const updateUserPermissions = async (userId, overrides) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, permission_overrides: overrides } : u))
    );

    if (currentUserId === userId) {
      setCachedUser((prev) => (prev ? { ...prev, permission_overrides: overrides } : prev));
    }

    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ permission_overrides: overrides })
          .eq('id', userId);
        if (error) {
          console.warn('Supabase user permission update warning:', error);
        }
      } catch (err) {
        console.warn('Supabase user permission update exception:', err);
      }
    }
  };

  const resetUserPermissions = async (userId) => {
    return updateUserPermissions(userId, {});
  };

  const deleteUser = async (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);
        if (error) {
          console.error('Supabase user delete error:', error);
        }
      } catch (err) {
        console.error('Supabase user delete exception:', err);
      }
    }
  };

  const updateCurrentUserPreferences = async ({ theme, task_default_view }) => {
    if (!currentUserId) throw new Error('No user is currently logged in.');

    const validThemes = ['light', 'dark'];
    const validViews = ['list', 'board', 'calendar'];

    const prevUser = currentUser;
    const prevTheme = prevUser?.theme || 'light';
    const prevView = prevUser?.task_default_view || 'list';

    const updates = {};
    if (theme !== undefined) {
      if (!validThemes.includes(theme)) throw new Error(`Invalid theme: ${theme}`);
      updates.theme = theme;
    }
    if (task_default_view !== undefined) {
      if (!validViews.includes(task_default_view)) throw new Error(`Invalid task default view: ${task_default_view}`);
      updates.task_default_view = task_default_view;
    }

    if (Object.keys(updates).length === 0) return { success: true };

    // Apply immediate local state & account-scoped cache
    if (updates.theme) {
      try {
        localStorage.setItem(`upcomm_theme_${currentUserId}`, updates.theme);
      } catch (e) {}
      if (updates.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
    if (updates.task_default_view) {
      try {
        localStorage.setItem(`upcomm_task_default_view_${currentUserId}`, updates.task_default_view);
      } catch (e) {}
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === currentUserId ? { ...u, ...updates } : u))
    );
    setCachedUser((prev) => (prev ? { ...prev, ...updates } : prev));

    // Persist to Supabase users table
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', currentUserId);

        if (error) {
          console.warn('Supabase user preferences update warning:', error);
          // If not schema cache error, rollback
          if (error.code !== '42703' && error.code !== 'PGRST204') {
            if (updates.theme) {
              try {
                localStorage.setItem(`upcomm_theme_${currentUserId}`, prevTheme);
              } catch (e) {}
              if (prevTheme === 'dark') {
                document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-theme', 'dark');
              } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.setAttribute('data-theme', 'light');
              }
            }
            if (updates.task_default_view) {
              try {
                localStorage.setItem(`upcomm_task_default_view_${currentUserId}`, prevView);
              } catch (e) {}
            }
            setUsers((prev) =>
              prev.map((u) => (u.id === currentUserId ? { ...u, theme: prevTheme, task_default_view: prevView } : u))
            );
            throw new Error(error.message || 'Failed to save preferences to database.');
          }
        }
      } catch (err) {
        console.error('User preference update exception:', err);
        throw err;
      }
    }

    return { success: true };
  };

  const value = {
    currentUser,
    currentUserId,
    users,
    loading,
    authLoading,
    login,
    logout,
    switchUser,
    changePassword,
    uploadAvatar,
    updateAvatar,
    createUser,
    updateUser,
    updateUserPermissions,
    updateCurrentUserPreferences,
    resetUserPermissions,
    deleteUser,
    setUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

