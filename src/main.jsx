import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Pre-render theme resolution to eliminate flash of wrong theme
try {
  const currentUserId = localStorage.getItem('upcomm_logged_in_user_id');
  if (currentUserId) {
    const cachedTheme = localStorage.getItem(`upcomm_theme_${currentUserId}`);
    if (cachedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
