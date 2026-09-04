import React from 'react';
import { UserRound, Bell, Paintbrush, SlidersHorizontal } from 'lucide-react';

export const SETTINGS_SECTIONS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: UserRound,
    description: 'Manage personal profile and workspace details',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Configure in-app alerts and notifications',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Paintbrush,
    description: 'Customize UI theme and display density',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: SlidersHorizontal,
    description: 'Set default workspace behavior and options',
  },
];

export function SettingsNav({ activeSection, onSelectSection }) {
  return (
    <nav
      aria-label="Settings sections"
      className="w-full md:w-[220px] shrink-0"
    >
      <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center gap-3 px-3.5 h-[44px] rounded-[8px] text-[13px] font-medium transition-all text-left cursor-pointer whitespace-nowrap md:whitespace-normal select-none ${
                isActive
                  ? 'bg-[#F1F3F5] dark:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5] font-semibold'
                  : 'bg-transparent text-[#52525B] dark:text-[#C4C7CE] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#1D2024]'
              }`}
            >
              {/* Left active green indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#059669] rounded-r"
                  aria-hidden="true"
                />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[#18181B] dark:text-[#F4F4F5]' : 'text-[#71717A] dark:text-[#8E949E]'
                }`}
              />

              <span className="truncate">{section.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
