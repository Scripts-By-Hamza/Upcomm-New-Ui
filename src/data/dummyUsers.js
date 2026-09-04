export const INITIAL_USERS = [
  // 1. Admin
  {
    id: 'usr-admin-1',
    email: 'muhammaddumerr@gmail.com',
    full_name: 'Muhammad Dumer',
    designation: 'Managing Director / Executive Admin',
    role: 'admin',
    department_id: null,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    is_active: true,
    must_change_password: true,
    is_system_account: false,
    exclude_from_directory: false,
    suppress_activity_logging: false,
    created_at: '2026-08-15T17:48:03.947Z',
  },

  // 2. IT Support Admin (HIDDEN SYSTEM ACCOUNT)
  {
    id: 'usr-itsupport-1',
    email: 'ranahamza241203@gmail.com',
    full_name: 'Rana Hamza',
    designation: 'IT Systems & Infrastructure Administrator',
    role: 'it_support_admin',
    department_id: null,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    is_active: true,
    must_change_password: true,
    is_system_account: true,
    exclude_from_directory: true,
    suppress_activity_logging: true,
    created_at: '2026-08-15T17:48:03.947Z',
  },

  // 3. Support Admin
  {
    id: 'usr-admin-2',
    email: 'support@upcomm.com',
    full_name: 'Support Admin',
    designation: 'Support Administrator',
    role: 'admin',
    department_id: null,
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
    is_active: true,
    must_change_password: false,
    is_system_account: false,
    exclude_from_directory: false,
    suppress_activity_logging: false,
    created_at: '2026-08-28T22:28:00.000Z',
  },
];
