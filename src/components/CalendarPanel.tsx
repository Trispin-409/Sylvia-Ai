import React from 'react';
import { CalendarEvent, WorkspaceHealth } from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  AlertCircle,
} from 'lucide-react';

interface CalendarPanelProps {
  events: CalendarEvent[];
  workspaceHealth?: WorkspaceHealth;
}

export const CalendarPanel: React.FC<CalendarPanelProps> = ({ events, workspaceHealth }) => {
  const todayEvents = events.filter(e => e.period === 'today');
  const tomorrowEvents = events.filter(e => e.period === 'tomorrow');
  const upcomingEvents = events.filter(e => e.period === 'upcoming');

  const renderSection = (title: string, items: CalendarEvent[], isToday = false) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <h3 className="font-mono-code font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-sky-400" />
          {title}
        </h3>
        <span className="text-[11px] font-mono-code text-slate-400">
          {items.length} {items.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-400 font-mono-code text-xs text-center">
          No live Calendar events loaded.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map(evt => (
            <div
              key={evt.id}
              className={`p-4 rounded-xl border transition-all ${
                isToday
                  ? 'glass-panel-elevated border-sky-500/30 shadow-lg shadow-sky-950/20'
                  : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-display font-semibold text-sm text-slate-100 mb-1">
                    {evt.title}
                  </h4>

                  <div className="flex items-center gap-4 text-xs font-mono-code text-slate-400">
                    <span className="flex items-center gap-1.5 text-sky-300 font-medium">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      {evt.startTime} - {evt.endTime} ({evt.durationMinutes}m)
                    </span>

                    <span className="px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                      {evt.calendarName}
                    </span>
                  </div>

                  {evt.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 font-sans">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{evt.location}</span>
                    </div>
                  )}

                  {evt.attendees && evt.attendees.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-mono-code">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{evt.attendees.join(', ')}</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-sky-950/40 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                  Live record
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div id="sylvia-calendar-panel" className="w-full h-full flex flex-col p-6 overflow-y-auto select-none">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-100">
              Google Workspace: Calendar Timeline
            </h2>
            <p className="text-xs text-slate-400">
              Live Calendar records returned by the Google ADK Workspace Specialist
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-mono-code border ${
          workspaceHealth?.calendarConnected
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
            : workspaceHealth
              ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
              : 'bg-slate-950/60 text-slate-400 border-slate-700'
        }`}>
          {workspaceHealth?.calendarConnected ? 'Calendar: Connected' : workspaceHealth ? 'Calendar: Not Connected' : 'Calendar: Not Checked'}
        </span>
      </div>

      {!workspaceHealth ? (
        <div className="mb-6 p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-slate-500 font-mono-code text-xs">
          <AlertCircle className="w-4 h-4 inline-block mr-2 text-slate-600" />
          Calendar connection has not been queried yet. Sylvia will show live events only after a backend Workspace check or Calendar operation.
        </div>
      ) : workspaceHealth.error ? (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-200 font-mono-code text-xs">
          <AlertCircle className="w-4 h-4 inline-block mr-2" />
          {workspaceHealth.error}
        </div>
      ) : null}

      <div className="space-y-6 max-w-4xl">
        {renderSection('Today', todayEvents, true)}
        {renderSection('Tomorrow', tomorrowEvents)}
        {renderSection('Upcoming', upcomingEvents)}
      </div>
    </div>
  );
};
