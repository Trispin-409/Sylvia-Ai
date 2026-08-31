import React from 'react';
import { CalendarEvent } from '../types';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface CalendarPanelProps {
  events: CalendarEvent[];
}

export const CalendarPanel: React.FC<CalendarPanelProps> = ({ events }) => {
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
          No scheduled events.
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
              <div className="flex items-start justify-between">
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

                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                  Confirmed
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
      {/* Top Header */}
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
              Autonomous schedule conflict detection & timeline synchronization
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono-code bg-sky-950/40 text-sky-300 border border-sky-500/30">
          Sync Status: Verified
        </span>
      </div>

      <div className="space-y-6 max-w-4xl">
        {renderSection('Today', todayEvents, true)}
        {renderSection('Tomorrow', tomorrowEvents)}
        {renderSection('Upcoming Milestones', upcomingEvents)}
      </div>
    </div>
  );
};
