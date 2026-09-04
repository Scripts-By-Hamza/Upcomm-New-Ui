import React, { useState } from 'react';
import { Bell, CheckCircle2, Loader2 } from 'lucide-react';

export function NotificationSettingsPanel() {
  const [notifications, setNotifications] = useState({
    taskAssigned: true,
    dueSoonReminders: true,
    statusUpdates: true,
    mentionsAndComments: true,
    soundAlerts: true,
    emailDigest: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleOption = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 sm:p-8 shadow-none flex-1 min-w-0 font-['Inter']">
      <div className="text-[11px] sm:text-[12px] font-semibold text-[#71717A] uppercase tracking-wider mb-2">
        NOTIFICATIONS
      </div>

      <div className="mb-6">
        <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#18181B] tracking-tight">
          Notification Preferences
        </h2>
        <p className="text-[13px] text-[#52525B] mt-1">
          Customize in-app alerts, sounds, and email summaries for your workspace.
        </p>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-[8px] text-[12.5px] text-[#065F46] font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>Notification preferences updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4 divide-y divide-[#F4F4F5]">
          {/* Item 1 */}
          <div className="pt-4 first:pt-0 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-[13.5px] font-medium text-[#18181B]">Task Assignments</h4>
              <p className="text-[12px] text-[#71717A] mt-0.5">Receive an instant notification when a task is assigned to you.</p>
            </div>
            <button
              type="button"
              onClick={() => toggleOption('taskAssigned')}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                notifications.taskAssigned ? 'bg-[#059669]' : 'bg-[#E5E7EB]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  notifications.taskAssigned ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Item 2 */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-[13.5px] font-medium text-[#18181B]">Due Date Reminders</h4>
              <p className="text-[12px] text-[#71717A] mt-0.5">Get notified for upcoming tasks approaching their due date.</p>
            </div>
            <button
              type="button"
              onClick={() => toggleOption('dueSoonReminders')}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                notifications.dueSoonReminders ? 'bg-[#059669]' : 'bg-[#E5E7EB]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  notifications.dueSoonReminders ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Item 3 */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-[13.5px] font-medium text-[#18181B]">Status & Review Updates</h4>
              <p className="text-[12px] text-[#71717A] mt-0.5">Alerts when task statuses change or completion requests are approved.</p>
            </div>
            <button
              type="button"
              onClick={() => toggleOption('statusUpdates')}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                notifications.statusUpdates ? 'bg-[#059669]' : 'bg-[#E5E7EB]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  notifications.statusUpdates ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Item 4 */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-[13.5px] font-medium text-[#18181B]">Comments & Mentions</h4>
              <p className="text-[12px] text-[#71717A] mt-0.5">Notify when team members mention you or comment on your assigned tasks.</p>
            </div>
            <button
              type="button"
              onClick={() => toggleOption('mentionsAndComments')}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                notifications.mentionsAndComments ? 'bg-[#059669]' : 'bg-[#E5E7EB]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  notifications.mentionsAndComments ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Item 5 */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-[13.5px] font-medium text-[#18181B]">Notification Sound Chimes</h4>
              <p className="text-[12px] text-[#71717A] mt-0.5">Play a subtle audio tone when new notifications arrive in the topbar.</p>
            </div>
            <button
              type="button"
              onClick={() => toggleOption('soundAlerts')}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                notifications.soundAlerts ? 'bg-[#059669]' : 'bg-[#E5E7EB]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  notifications.soundAlerts ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] pt-6 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="h-[40px] px-5 text-[13px] font-medium text-white bg-[#059669] hover:bg-[#047857] rounded-[8px] cursor-pointer transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-none"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
