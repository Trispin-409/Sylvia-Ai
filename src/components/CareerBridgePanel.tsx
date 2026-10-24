import React, { useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  Compass,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
  Wifi,
  LoaderCircle,
  Brain,
  ListChecks,
} from 'lucide-react';
import { ToolExecution } from '../types';

type CareerAnalysisResult = { reply: string; toolExecutions: ToolExecution[] };

interface CareerBridgePanelProps {
  backendConnected: boolean;
  isWorking: boolean;
  onAnalyze: (prompt: string) => Promise<CareerAnalysisResult | null>;
  onOpenConversation: () => void;
  onOpenMissionControl: () => void;
}

const barrierOptions = [
  { id: 'transport', label: 'Transport cost or distance', icon: <MapPin className="h-4 w-4" /> },
  { id: 'data', label: 'Limited mobile data or connectivity', icon: <Wifi className="h-4 w-4" /> },
  { id: 'device', label: 'Limited access to a laptop/device', icon: <BriefcaseBusiness className="h-4 w-4" /> },
  { id: 'cv', label: 'I need help creating a CV/profile', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'formal-experience', label: 'I have little formal work experience', icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'money', label: 'I need to focus on free/low-cost options', icon: <Wallet className="h-4 w-4" /> },
];

const renderReply = (reply: string) => reply.split('\n').map((line, index) => {
  const trimmed = line.trim();
  if (!trimmed) return <div key={index} className="h-2" />;
  if (/^#{1,3}\s/.test(trimmed)) {
    return <h3 key={index} className="pt-3 text-sm font-semibold text-emerald-100">{trimmed.replace(/^#{1,3}\s/, '').replace(/\*\*/g, '')}</h3>;
  }
  if (/^[-*•]\s/.test(trimmed)) {
    return <div key={index} className="flex gap-2 pl-1 text-sm leading-6 text-slate-200"><span className="text-emerald-300">•</span><span>{trimmed.replace(/^[-*•]\s/, '').replace(/\*\*/g, '')}</span></div>;
  }
  return <p key={index} className="text-sm leading-6 text-slate-200">{trimmed.replace(/\*\*/g, '')}</p>;
});

export const CareerBridgePanel: React.FC<CareerBridgePanelProps> = ({
  backendConnected,
  isWorking,
  onAnalyze,
  onOpenConversation,
  onOpenMissionControl,
}) => {
  const [careerStage, setCareerStage] = useState('Looking for my first opportunity');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [strengths, setStrengths] = useState('');
  const [target, setTarget] = useState('');
  const [location, setLocation] = useState('');
  const [barriers, setBarriers] = useState<string[]>(['formal-experience']);
  const [rememberProfile, setRememberProfile] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [error, setError] = useState('');

  const toggleBarrier = (id: string) => {
    setBarriers(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!experience.trim()) {
      setError('Add at least one real example of work, learning, helping someone, or a project. It does not have to be formal employment.');
      return;
    }

    const barrierLabels = barrierOptions.filter(item => barriers.includes(item.id)).map(item => item.label);
    const prompt = [
      'SYLVIA CAREER — CAREER BRIDGE WORKFLOW (FNB App of the Year Hackathon 2026).',
      'Problem statement: “How might we shorten the distance between young people and meaningful income by translating skills into credible profiles, practical experience, work opportunities and career mobility?”',
      '',
      'Use Sylvia’s existing Google ADK backend, Context Analyst, Decision Partner, Action Planner, persistent Context Memory, Decision DNA and Mission Control tools. This is a live career-support task, not a static demo. Use only function tools actually exposed to the active ADK agent; do not guess tool names. The current client skill catalog names get_current_mission, start_or_update_mission, update_mission_step, get_decision_dna, save_decision_dna_preference and save_context_memory, but the live ADK tool registry is authoritative. Do not call start_mission, add_mission_step, save_preference, get_context_memory or list_context_memories unless those exact functions are registered by the backend. For career-memory recall, use a real runtime context-memory read/list tool only if one is available; otherwise state that saved memory could not be retrieved. Never claim a tool ran or data persisted without its structured tool response.',
      '',
      'USER-PROVIDED PROFILE (treat as user-stated, not independently verified):',
      'Career stage: ' + careerStage,
      'Education or training: ' + (education.trim() || 'Not provided; do not assume a qualification.'),
      'Real experience and examples: ' + experience.trim(),
      'Skills or strengths the user recognises: ' + (strengths.trim() || 'Not specified; derive possible transferable skills only from the supplied evidence and label them as inferred.'),
      'Target roles or interests: ' + (target.trim() || 'Not yet decided; compare a small number of plausible entry-level pathways.'),
      'General location / travel area: ' + (location.trim() || 'Not provided; do not assume a city or area.'),
      'Access barriers: ' + (barrierLabels.length ? barrierLabels.join('; ') : 'None selected by the user.'),
      'Explicit consent to persistent career-profile memory: ' + (rememberProfile ? 'YES — save a concise career-profile summary using the existing persistent Context Memory tool.' : 'NO — do not persist this profile or its personal details.'),
      '',
      'PERSISTENT CONTEXT / PERSONALISATION:',
      'Before making recommendations, use existing persistent Decision DNA/preferences and retrieve CAREER_PROFILE from Context Memory if that key exists. Adapt advice to those saved details and access barriers. Clearly distinguish profile facts supplied now from facts recalled from saved memory. Current user-provided details take precedence for this session when they conflict; do not silently overwrite the saved profile unless the explicit consent checkbox below is selected. If no career profile is found, state that no saved career profile was available; do not fabricate one.',
      '',
      'DELIVER A PRACTICAL CAREER BRIDGE:',
      '1. Summarise the user’s credible evidence without embellishing it.',
      '2. Map transferable skills to the exact examples supplied. Clearly mark each as USER-STATED, INFERRED FROM EVIDENCE, or NEEDS PROOF. For each, suggest a safe way to demonstrate it.',
      '3. Recommend up to three plausible entry-level role pathways, explaining fit, likely entry barriers, missing proof, and one small portfolio/work-sample task per pathway. Do not imply an employer has a vacancy unless a real live search tool verified it.',
      '4. Create a short profile/CV summary using only supplied facts. Never invent qualifications, employers, dates, certificates, references, achievements, or years of experience.',
      '5. Give a practical 7-day work-readiness plan with low-cost or low-data alternatives, taking the selected transport/device/data barriers into account.',
      '6. Predict one likely near-term work-readiness barrier or dropout risk using the current profile and any genuinely available saved context or prior outcomes. Explain which input signals support the forecast, what is uncertain, and the smallest practical action that could reduce that risk. Do not invent historical patterns, percentages, or a statistical forecast when there is insufficient data; say the signal is preliminary.',
      '7. Identify trusted next-step verification needed (for example, checking a real vacancy, training provider, or qualification requirement). Do not invent URLs or opportunities.',
      '8. Use get_current_mission to inspect actual state. If no suitable active Career Bridge mission exists, use the actual registered mission creation/upsert tool (the current client skill catalog names start_or_update_mission) to create “Career Bridge — Work Readiness”. If a suitable mission exists, use the actual registered mission/step update tools where supported to add or update practical actions. Never call a function unless the active backend exposes it, never create a duplicate mission, and never mark future actions completed. Report persistence only when a structured tool response confirms it.',
      '9. End with one highest-value next action and one concise question only if needed.',
      '',
      'PERSISTENCE RULE:',
      rememberProfile
        ? 'The user explicitly opted in. Use save_context_memory with key CAREER_PROFILE, category career, permanence long_term, and a concise value containing only the supplied career evidence, goals, and access preferences needed to adapt future guidance. Report saved/persistent only if the tool result confirms it.'
        : 'The user did not opt in. Do not call save_context_memory for this profile. Do not save it to Decision DNA. Continue with analysis only.',
      '',
      'Keep advice respectful and encouraging. Do not equate lack of formal employment with lack of ability. Separate evidence from inference, and never present a recommendation as a verified job match.',
    ].join('\n');

    setError('');
    setAnalysis('');
    setToolExecutions([]);
    try {
      const result = await onAnalyze(prompt);
      if (!result) {
        setError('Sylvia could not return a structured response. Open Console Stream for the backend error and try again.');
        return;
      }
      setAnalysis(result.reply);
      setToolExecutions(result.toolExecutions);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The career analysis could not be completed.');
    }
  };

  return (
    <div className="sylvia-workspace-feature-scroll h-full min-h-0 w-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-800/50 bg-gradient-to-br from-[#0a2b1b] via-[#06160f] to-[#06101a] p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/75">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1">Sylvia Career</span>
                <span>FNB · Youth Employment & Work Readiness</span>
              </div>
              <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">Your experience already means something.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">
                Turn real work, community contributions, school projects and self-taught skills into credible evidence—then choose a practical route toward your next opportunity.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200">
              <span className={'h-2 w-2 rounded-full ' + (backendConnected ? 'bg-emerald-400' : 'bg-amber-400')} />
              {backendConnected ? 'Sylvia backend reachable' : 'Backend connection needs checking'}
            </div>
          </div>
          <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: <Brain className="h-4 w-4" />, title: 'Recognise evidence', body: 'Translate formal and informal experience into transferable skills.' },
              { icon: <Compass className="h-4 w-4" />, title: 'Find a direction', body: 'Compare realistic entry paths and identify missing proof.' },
              { icon: <Target className="h-4 w-4" />, title: 'Take the next step', body: 'Turn advice into a trackable work-readiness mission.' },
            ].map(item => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-200">{item.icon}</div>
                <div className="text-sm font-medium text-white">{item.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-300">{item.body}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-emerald-900/40 bg-[#041009]/80 p-4 sm:p-6">
            <div className="flex items-start gap-3 border-b border-white/10 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><BriefcaseBusiness className="h-5 w-5" /></div>
              <div>
                <h2 className="text-base font-semibold text-white">Build your career bridge</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">Tell Sylvia what is true today. A small real example is more useful than a perfect CV.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-300">
                Where are you in your journey?
                <select value={careerStage} onChange={event => setCareerStage(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-400">
                  <option>Looking for my first opportunity</option>
                  <option>Studying or recently finished school</option>
                  <option>Have informal or short-term experience</option>
                  <option>Have work experience and want to move forward</option>
                  <option>Changing career direction</option>
                  <option>Returning to work</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-300">
                Education or training (optional)
                <input value={education} onChange={event => setEducation(event.target.value)} placeholder="e.g. highest grade, course or certificate" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400" />
              </label>
            </div>

            <label className="block text-xs font-medium text-slate-300">
              What have you actually done? <span className="text-emerald-300">Required</span>
              <textarea required rows={5} value={experience} onChange={event => setExperience(event.target.value)} placeholder="Paid work, helping in a family business, community work, looking after responsibilities, selling products, school projects, learning online, building apps, fixing things, organising people…" className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400" />
              <span className="mt-1.5 block text-[11px] font-normal text-slate-500">No formal job is required. Describe the task and what you personally did; Sylvia must not turn it into invented work experience.</span>
            </label>

            <label className="block text-xs font-medium text-slate-300">
              Skills or strengths you already notice (optional)
              <textarea rows={2} value={strengths} onChange={event => setStrengths(event.target.value)} placeholder="e.g. explaining things, working with customers, solving problems, using computers" className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400" />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-300">
                Work you would like to explore (optional)
                <input value={target} onChange={event => setTarget(event.target.value)} placeholder="e.g. IT support, retail, logistics, admin" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400" />
              </label>
              <label className="block text-xs font-medium text-slate-300">
                General area (optional)
                <input value={location} onChange={event => setLocation(event.target.value)} placeholder="Town or area only; no street address" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400" />
              </label>
            </div>

            <fieldset>
              <legend className="mb-2 text-xs font-medium text-slate-300">What makes work or training harder right now?</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {barrierOptions.map(option => (
                  <label key={option.id} className={'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs transition-colors ' + (barriers.includes(option.id) ? 'border-emerald-400/35 bg-emerald-400/[0.08] text-emerald-100' : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-600')}>
                    <input type="checkbox" checked={barriers.includes(option.id)} onChange={() => toggleBarrier(option.id)} className="accent-emerald-400" />
                    <span className="shrink-0">{option.icon}</span>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3.5">
              <input type="checkbox" checked={rememberProfile} onChange={event => setRememberProfile(event.target.checked)} className="mt-0.5 accent-emerald-400" />
              <span>
                <span className="flex items-center gap-2 text-xs font-medium text-slate-200"><ShieldCheck className="h-4 w-4 text-emerald-300" />Remember my career profile</span>
                <span className="mt-1 block text-[11px] leading-5 text-slate-400">Optional. With your consent, Sylvia will request to save a concise profile summary in its existing persistent Context Memory so later guidance can adapt. Leave unchecked for analysis only.</span>
              </span>
            </label>

            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs leading-5 text-rose-200"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

            <button type="submit" disabled={isWorking} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
              {isWorking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isWorking ? 'Sylvia is building your career bridge…' : 'Build my Career Bridge'}
              {!isWorking && <ArrowRight className="h-4 w-4" />}
            </button>
            <p className="text-[10px] leading-4 text-slate-500">Your information is sent to Sylvia’s configured backend for this request. Persistent saving is requested only when the checkbox above is selected.</p>
          </form>

          <section className="space-y-4">
            <div className="rounded-2xl border border-emerald-900/40 bg-[#041009]/70 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-200"><Sparkles className="h-4 w-4" /></div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Your next-step report</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Sylvia uses your answers and its existing agent workflow to create guidance grounded in your experience.</p>
                </div>
              </div>

              {!analysis && !isWorking && (
                <div className="mt-5 rounded-xl border border-dashed border-slate-700 bg-slate-950/45 p-5 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-slate-400"><Compass className="h-5 w-5" /></div>
                  <p className="mt-3 text-sm font-medium text-slate-200">Your career bridge will appear here</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">We’ll map evidence to transferable skills, compare pathways, highlight what needs proof, and propose a practical plan.</p>
                </div>
              )}

              {isWorking && !analysis && (
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5">
                  <div className="flex items-center gap-2 text-sm text-emerald-100"><LoaderCircle className="h-4 w-4 animate-spin" />Working with Sylvia’s live agent backend</div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">Preparing evidence-grounded skills, accessible pathways and your next action.</p>
                </div>
              )}

              {analysis && (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/80"><CheckCircle2 className="h-4 w-4" />Career Bridge Analysis</div>
                    <div className="space-y-1">{renderReply(analysis)}</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3.5">
                    <div className="mb-2 text-xs font-semibold text-slate-200">Backend tool trace</div>
                    {toolExecutions.length === 0 ? (
                      <p className="text-xs leading-5 text-slate-500">No structured tool calls were returned for this response. The report is advice, not proof that a profile or mission was saved.</p>
                    ) : (
                      <div className="space-y-2">
                        {toolExecutions.map(tool => (
                          <div key={tool.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-800/80 px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-slate-200">{tool.action}</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">{tool.toolName}</div>
                            </div>
                            <span className={'shrink-0 rounded-full px-2 py-1 text-[10px] ' + (tool.status === 'completed' ? 'bg-emerald-400/10 text-emerald-200' : tool.status === 'failed' ? 'bg-rose-400/10 text-rose-200' : 'bg-amber-400/10 text-amber-200')}>{tool.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button type="button" onClick={onOpenConversation} className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-medium text-slate-200 hover:border-emerald-400/40 hover:text-emerald-100"><Brain className="h-4 w-4" />Open conversation</button>
                    <button type="button" onClick={onOpenMissionControl} className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/15"><Target className="h-4 w-4" />Open Mission Control</button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200"><ShieldCheck className="h-4 w-4 text-emerald-300" />Trust and fairness safeguards</div>
              <div className="mt-3 space-y-2 text-xs leading-5 text-slate-400">
                <p>• Informal experience counts as evidence when it is described honestly.</p>
                <p>• Inferred skills must be linked to the user’s examples and labelled as inferred.</p>
                <p>• No invented vacancies, employers, certificates, or job-application outcomes.</p>
                <p>• Career-profile persistence is optional and requires user consent.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CareerBridgePanel;
