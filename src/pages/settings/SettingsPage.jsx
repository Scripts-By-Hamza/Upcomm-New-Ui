import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SettingsNav } from '../../components/settings/SettingsNav';
import { ProfileSettingsPanel } from '../../components/settings/ProfileSettingsPanel';
import { NotificationSettingsPanel } from '../../components/settings/NotificationSettingsPanel';
import { AppearanceSettingsPanel } from '../../components/settings/AppearanceSettingsPanel';
import { PreferencesSettingsPanel } from '../../components/settings/PreferencesSettingsPanel';

const VALID_SECTIONS = ['profile', 'notifications', 'appearance', 'preferences'];

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSection = searchParams.get('section') || 'profile';
  const activeSection = VALID_SECTIONS.includes(rawSection) ? rawSection : 'profile';

  const handleSelectSection = (sectionId) => {
    setSearchParams({ section: sectionId });
  };

  return (
    <div className="max-w-[1140px] mx-auto space-y-6 font-['Inter'] pb-12 select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Page Header (on normal background, no enclosing card) */}
      <div>
        <h1 className="text-[22px] sm:text-[24px] font-semibold text-[#18181B] tracking-tight">
          Settings
        </h1>
        <p className="text-[13px] sm:text-[13.5px] text-[#52525B] mt-1 font-normal">
          Manage your account and workspace preferences.
        </p>
      </div>

      {/* 2. Main Settings Layout (Left: Sub-nav, Right: Active Panel) */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Settings Sub-Navigation */}
        <SettingsNav
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
        />

        {/* Active Settings Panel */}
        <div className="flex-1 min-w-0 w-full">
          {activeSection === 'profile' && <ProfileSettingsPanel />}
          {activeSection === 'notifications' && <NotificationSettingsPanel />}
          {activeSection === 'appearance' && <AppearanceSettingsPanel />}
          {activeSection === 'preferences' && <PreferencesSettingsPanel />}
        </div>
      </div>
    </div>
  );
}
