import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Circle,
  FileBadge,
  GraduationCap,
  Lightbulb,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  WandSparkles,
} from 'lucide-react';

type EvidenceType = 'Work sample' | 'Informal work' | 'Volunteer work' | 'Certificate' | 'Project' | 'Other';

interface CareerEvidence {
  id: string;
  title: string;
  description: string;
  type: EvidenceType;
  createdAt: string;
}

interface CareerTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface CareerProfile {
  fullName: string;
  targetRole: string;
  education: string;
  experience: string;
  skills: string[];
  constraints: string;
  evidence: CareerEvidence[];
  tasks: CareerTask[];
}

const STORAGE_KEY = 'sylvia-career-profile-v1';

const defaultTasks: CareerTask[] = [
  { id: 'target', title: 'Choose a target role', description: 'Pick one role to focus your next steps on.', completed: false },
  { id: 'evidence', title: 'Create one work sample', description: 'Build something small that demonstrates a relevant skill.', completed: false },
  { id: 'profile', title: 'Update your CV or profile', description: 'Use specific examples instead of unsupported claims.', completed: false },
  { id: 'feedback', title: 'Ask for feedback or apply', description: 'Take one concrete step toward a real opportunity.', completed: false },
];

const createDefaultProfile = (): CareerProfile => ({
  fullName: '',
  targetRole: '',
  education: '',
  experience: '',
  skills: [],
  constraints: '',
  evidence: [],
  tasks: defaultTasks.map(task => ({ ...task })),
});

function loadProfile(): CareerProfile {
  const fallback = createDefaultProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<CareerProfile>;
    return {
      ...fallback,
      ...saved,
      skills: Array.isArray(saved.skills) ? saved.skills.filter((skill): skill is string => typeof skill === 'string') : fallback.skills,
      evidence: Array.isArray(saved.evidence) ? saved.evidence : fallback.evidence,
      tasks: Array.isArray(saved.tasks) ? saved.tasks : fallback.tasks,
    };
  } catch {
    return fallback;
  }
}

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/15';
const labelClass = 'block text-xs font-medium text-slate-300';

interface CareerPanelProps {
  onAskSylvia: (prompt: string) => void;
}

export const CareerPanel: React.FC<CareerPanelProps> = ({ onAskSylvia }) => {
  const [profile, setProfile] = useState<CareerProfile>(loadProfile);
  const [skillInput, setSkillInput] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('Work sample');
  const [saveMessage, setSaveMessage] = useState('Saved on this device');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSaveMessage('Saved on this device');
    } catch {
      setSaveMessage('Could not save in this browser');
    }
  }, [profile]);

  const skillCount = profile.skills.filter(skill => skill.trim().length > 0).length;
  const profileCompleteness = useMemo(() => {
    const completed = [
      profile.fullName.trim().length > 0,
      profile.targetRole.trim().length > 0,
      profile.education.trim().length > 0,
      profile.experience.trim().length > 0,
      skillCount > 0,
    ].filter(Boolean).length;
    return Math.round((completed / 5) * 100);
  }, [profile.fullName, profile.targetRole, profile.education, profile.experience, skillCount]);

  const completedTasks = profile.tasks.filter(task => task.completed).length;
  const nextTask = profile.tasks.find(task => !task.completed);

  const updateField = <K extends 'fullName' | 'targetRole' | 'education' | 'experience' | 'constraints>(
    field: K,
    value: CareerProfile[K],
  ) => setProfile(previous => ({ ...previous, [field]: value }));

  const updateSkills = (value: string) => {
    setSkillInput(value);
    setProfile(previous => ({
      ...previous,
      skills: value.split(/[\n,]/).map(skill => skill.trim()).filter(Boolean),
    }));
  };

  const addEvidence = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!evidenceTitle.trim()) return;
    const item: CareerEvidence = {
      id: `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: evidenceTitle.trim(),
      description: evidenceDescription.trim(),
      type: evidenceType,
      createdAt: new Date().toISOString(),
    };
    setProfile(previous => ({ ...previous, evidence: [item, ...previous.evidence] }));
    setEvidenceTitle('');
    setEvidenceDescription('');
  };

  const buildSylviaPrompt = () => {
    const careerContext = {
      name: profile.fullName || 'Not provided',
      targetRole: profile.targetRole || 'Not decided',
      education: profile.education || 'Not provided',
      experienceIncludingInformalWork: profile.experience || 'Not provided',
      skills: profile.skills,
      evidence: profile.evidence.map(({ title, description, type }) => ({ title, description, type })),
      barriersAndConstraints: profile.constraints || 'Not provided',
      completedActions: profile.tasks.filter(task => task.completed).map(task => task.title),
    };
    return [
      'Help me with the Sylvia Career work-readiness journey for the youth employment challenge.',
      'Use the profile below to create a practical, supportive assessment. Treat informal work, volunteering, self-directed learning, and personal projects as potentially relevant experience, but do not exaggerate or invent credentials.',
      'Please return: (1) my current strengths grounded in the supplied profile, (2) likely skill gaps for my target role and clearly label assumptions, (3) one practical work sample I can complete with limited resources, (4) a realistic 7-day action plan, and (5) next steps toward suitable entry-level opportunities.',
      'Do not invent live job vacancies, employers, mentorship availability, qualifications, or completed outcomes. If you cannot verify current openings with an available tool, say so and give me useful search terms and places to check. Keep the advice plain-language, affordable, and sensitive to the barriers I listed.',
      'My career profile (JSON):',
      JSON.stringify(careerContext, null, 2),
    ].join('\n\n');
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-mono-code uppercase tracking-[0.18em] text-indigo-300">
              <BriefcaseBusiness className="h-4 w-4" /> Sylvia Career
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">Turn your skills into proof.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Build a credible profile from your education, informal experience and practical abilities — then choose a concrete next step toward work.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300 md:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{saveMessage}</span>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-950 p-5 md:p-6">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-200">
                <Sparkles className="h-4 w-4" /> Your career readiness loop
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Understand your starting point, capture evidence of what you can do, and work on the next most useful action. This is a profile-completeness indicator, not an employability score.
              </p>
              <div className="mt-4 h-2 max-w-lg overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all" style={{ width: `${profileCompleteness}%` }} />
              </div>
              <div className="mt-2 flex max-w-lg items-center justify-between text-xs text-slate-400">
                <span>Profile completeness</span><span>{profileCompleteness}%</span>
              </div>
            </div>
            <button
              onClick={() => onAskSylvia(buildSylviaPrompt())}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <WandSparkles className="h-4 w-4" /> Build my plan with Sylvia <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric icon={<Target className="h-4 w-4" />} label="Target role" value={profile.targetRole ? 'Added' : 'Not set'} />
          <Metric icon={<Lightbulb className="h-4 w-4" />} label="Skills listed" value={String(skillCount)} />
          <Metric icon={<FileBadge className="h-4 w-4" />} label="Evidence items" value={String(profile.evidence.length)} />
          <Metric icon={<Check className="h-4 w-4" />} label="Actions completed" value={`${completedTasks}/${profile.tasks.length}`} />
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4 md:p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-2.5 text-indigo-300"><GraduationCap className="h-5 w-5" /></div>
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Your career profile</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">Include work you did informally and skills you learned on your own. Only share what you are comfortable storing in this browser.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Name or preferred name
                <input className={fieldClass} value={profile.fullName} onChange={event => updateField('fullName', event.target.value)} placeholder="What should Sylvia call you?" autoComplete="name" />
              </label>
              <label className={labelClass}>Target job or career
                <input className={fieldClass} value={profile.targetRole} onChange={event => updateField('targetRole', event.target.value)} placeholder="e.g. Junior developer, merchandiser" />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>Education and training
                <textarea className={fieldClass} rows={2} value={profile.education} onChange={event => updateField('education', event.target.value)} placeholder="School, certificates, courses or training — include dates if useful." />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>Experience, including informal work
                <textarea className={fieldClass} rows={3} value={profile.experience} onChange={event => updateField('experience', event.target.value)} placeholder="Jobs, family business, helping customers, volunteering, fixing things, personal projects or responsibilities." />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>Skills you can demonstrate
                <textarea className={fieldClass} rows={2} value={skillInput || profile.skills.join(', ')} onChange={event => updateSkills(event.target.value)} placeholder="e.g. customer service, Python basics, stock handling, writing, problem-solving" />
                <span className="mt-1 block text-[11px] font-normal text-slate-500">Separate skills with commas or new lines.</span>
              </label>
              <label className={`${labelClass} sm:col-span-2`}>Barriers or practical constraints (optional)
                <textarea className={fieldClass} rows={2} value={profile.constraints} onChange={event => updateField('constraints', event.target.value)} placeholder="e.g. limited data, transport cost, study schedule, access to a computer" />
              </label>
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4 md:p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-2.5 text-violet-300"><BadgeCheck className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Evidence of your skills</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Record projects, certificates, informal work or other examples. Listing evidence does not independently verify it.</p>
                </div>
              </div>
              <form className="space-y-3" onSubmit={addEvidence}>
                <label className={labelClass}>Evidence title
                  <input className={fieldClass} value={evidenceTitle} onChange={event => setEvidenceTitle(event.target.value)} placeholder="e.g. Built a small Python calculator" required />
                </label>
                <label className={labelClass}>Type
                  <select className={fieldClass} value={evidenceType} onChange={event => setEvidenceType(event.target.value as EvidenceType)}>
                    <option>Work sample</option><option>Informal work</option><option>Volunteer work</option><option>Certificate</option><option>Project</option><option>Other</option>
                  </select>
                </label>
                <label className={labelClass}>What does it demonstrate?
                  <textarea className={fieldClass} rows={2} value={evidenceDescription} onChange={event => setEvidenceDescription(event.target.value)} placeholder="Describe what you did and what you learned." />
                </label>
                <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20">
                  <Plus className="h-4 w-4" /> Add evidence
                </button>
              </form>

              {profile.evidence.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {profile.evidence.map(item => (
                    <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-100">{item.title}</div>
                          <div className="mt-1 text-[11px] text-violet-300">{item.type}</div>
                          {item.description && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">{item.description}</p>}
                        </div>
                        <button type="button" onClick={() => setProfile(previous => ({ ...previous, evidence: previous.evidence.filter(evidence => evidence.id !== item.id) }))} aria-label={`Remove ${item.title}`} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-4 text-center">
                  <FileBadge className="mx-auto h-5 w-5 text-slate-500" />
                  <p className="mt-2 text-xs text-slate-400">Your evidence list is empty. Start with any project, responsibility or task you can explain.</p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4 md:p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-2.5 text-emerald-300"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Your next steps</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">A starter checklist you control. Mark actions complete as you do them.</p>
                </div>
              </div>
              <div className="space-y-2">
                {profile.tasks.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setProfile(previous => ({ ...previous, tasks: previous.tasks.map(item => item.id === task.id ? { ...item, completed: !item.completed } : item) }))}
                    className="flex w-full items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/45 p-3 text-left transition hover:border-slate-700"
                    aria-pressed={task.completed}
                  >
                    <span className={`mt-0.5 ${task.completed ? 'text-emerald-400' : 'text-slate-600'}`}>{task.completed ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{task.description}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-indigo-400/15 bg-indigo-500/5 p-3 text-xs leading-5 text-slate-400">
                <BookOpen className="mr-1 inline h-3.5 w-3.5 text-indigo-300" />
                {nextTask ? <><span className="font-semibold text-indigo-200">Suggested next action:</span> {nextTask.title}</> : <><span className="font-semibold text-emerald-200">Checklist complete.</span> Review your evidence and choose the next real-world step.</>}
              </div>
            </section>
          </div>
        </div>

        <footer className="flex flex-col gap-2 border-t border-slate-800/80 pt-4 text-[11px] leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Privacy note: this first version stores your profile in this browser on this device. It is not yet synced to an account or Sylvia's backend.</span>
          <button type="button" onClick={() => { setProfile(createDefaultProfile()); setSkillInput(''); }} className="inline-flex items-center gap-1 self-start text-slate-400 transition hover:text-rose-300">
            <Trash2 className="h-3.5 w-3.5" /> Clear local profile
          </button>
        </footer>
      </div>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
    <div className="flex items-center gap-2 text-xs text-slate-400">{icon}<span>{label}</span></div>
    <div className="mt-2 font-display text-xl font-semibold text-slate-100">{value}</div>
  </div>
);

export default CareerPanel;
