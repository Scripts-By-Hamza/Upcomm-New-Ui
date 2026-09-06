import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, SlidersHorizontal, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canManageSoftwareSettings } from '../../utils/rbac/permissionManager';
import { SoftwareSettingsTab } from '../../components/settings/SoftwareSettingsTab';
import { PreferencesTab } from '../../components/settings/PreferencesTab';

export function SettingsPage() {
  const { currentUser, isInitialized } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSoftwareAdmin = canManageSoftwareSettings(currentUser);

  // Tab resolution with RBAC enforcement
  const requestedTab = searchParams.get('tab');
  const defaultTab = isSoftwareAdmin ? 'software' : 'preferences';
  
  let activeTab = requestedTab || defaultTab;
  if (!isSoftwareAdmin && activeTab === 'software') {
    activeTab = 'preferences';
  }

  // Update query param if it was invalid or unset
  useEffect(() => {
    if (!isSoftwareAdmin && requestedTab === 'software') {
      setSearchParams({ tab: 'preferences' }, { replace: true });
    }
  }, [isSoftwareAdmin, requestedTab, setSearchParams]);

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-12">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Workspace Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isSoftwareAdmin
            ? 'Manage organization software branding, global settings, and personal account preferences.'
            : 'Manage your personal account preferences, theme, and default workspace views.'}
        </p>
      </div>

      {/* Tabs (Only visible for users with multiple available sections) */}
      {isSoftwareAdmin && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('software')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'software'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Software Settings</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('preferences')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Personal Preferences</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="pt-2">
        {activeTab === 'software' && isSoftwareAdmin ? (
          <SoftwareSettingsTab />
        ) : (
          <PreferencesTab />
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
