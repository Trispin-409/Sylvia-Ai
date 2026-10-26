import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  MapPin,
  FileText,
  Pencil,
  Lock,
  GraduationCap,
  Play,
  MessageSquare,
  Code,
  BookOpen,
  PieChart,
  RotateCw,
  Mic,
  ArrowRight,
  ClipboardList,
  Plus,
  Milestone,
  Flag,
  CheckCircle2,
  Check,
  ChevronDown,
  ChevronRight,
  X,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Copy,
  Trash2,
  Sliders,
  Send,
  LoaderCircle,
} from 'lucide-react';
import { ToolExecution } from '../types';
import { SkillGapRadarChart, ROLE_BENCHMARKS, TargetRoleBenchmark } from './SkillGapRadarChart';

interface CareerBridgeWorkspaceProps {
  backendConnected: boolean;
  isWorking: boolean;
  onAnalyze: (prompt: string) => Promise<{ reply: string; toolExecutions: ToolExecution[] } | null>;
  onOpenConversation: () => void;
  onOpenMissionControl: () => void;
  onReturnToCompanion?: () => void;
  onNavigateToView?: (view: any) => void;
}

interface ApplicationItem {
  id: string;
  role: string;
  company: string;
  status: 'Applied' | 'Review' | 'Interview' | 'Offer' | 'Screened';
  dateApplied: string;
}

interface RoadmapItem {
  id: string;
  title: string;
  completed: boolean;
}

interface CourseItem {
  id: string;
  title: string;
  duration: string;
  level: string;
  icon: 'play' | 'chat' | 'code';
  enrolled: boolean;
  progress: number;
  description: string;
  url?: string;
}

interface InternshipItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  stipend: string;
  category: 'Design' | 'Marketing' | 'Tech' | 'Remote';
  tags: string[];
  sourceUrl?: string;
  applicationUrl?: string;
  deadline?: string;
  verificationStatus?: string;
}

const INTERVIEW_QUESTIONS = [
  {
    question: 'Tell me about a time you handled a difficult project.',
    category: 'Behavioral',
    tip: 'Use the STAR method (Situation, Task, Action, Result). Highlight how you resolved conflict or ambiguity proactively.',
  },
  {
    question: 'How do you prioritize competing deadlines across different stakeholders?',
    category: 'Situational',
    tip: 'Explain your framework for assessing urgency vs impact, and how you communicate status changes before deadlines slip.',
  },
  {
    question: 'Walk me through your design process from problem discovery to final prototype.',
    category: 'Technical',
    tip: 'Anchor on user research, defining constraints early, rapid wireframing, usability testing, and measurable outcomes.',
  },
  {
    question: 'Tell me about a time you received critical feedback and how you incorporated it.',
    category: 'Growth',
    tip: 'Show humbleness and objectivity. Detail what action you took and how it improved the final deliverable.',
  },
  {
    question: 'Why are you passionate about building a career in this industry?',
    category: 'Motivation',
    tip: 'Connect a personal experience or project with real-world problems you are excited to solve.',
  },
];

async function extractUploadedFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt')) return file.text();
  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const worker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => ('str' in item ? item.str : '')).join(' '));
    }
    return pages.join('\n').trim();
  }
  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.trim();
  }
  throw new Error('Upload a PDF, DOCX, or TXT CV.');
}
export const CareerBridgeWorkspace: React.FC<CareerBridgeWorkspaceProps> = ({
  backendConnected,
  isWorking,
  onAnalyze,
  onOpenConversation,
  onOpenMissionControl,
  onReturnToCompanion,
  onNavigateToView,
}) => {
  // 1. Search internships state
  const [searchQuery, setSearchQuery] = useState('IT internships and learnerships');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [showInternshipsModal, setShowInternshipsModal] = useState(false);
  const [opportunities, setOpportunities] = useState<InternshipItem[]>([]);
  const [isSearchingOpportunities, setIsSearchingOpportunities] = useState(false);
  const [opportunitySearchError, setOpportunitySearchError] = useState<string | null>(null);

  // 2. CV revamp state
  const [cvFileName, setCvFileName] = useState('');
  const [cvText, setCvText] = useState('');
  const [cvUploadError, setCvUploadError] = useState<string | null>(null);
  const [cvScore, setCvScore] = useState<number | null>(null);
  const [showRevampModal, setShowRevampModal] = useState(false);
  const [isRevamping, setIsRevamping] = useState(false);
  const [revampFeedback, setRevampFeedback] = useState<string | null>(null);

  // 3. Courses state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isSearchingCourses, setIsSearchingCourses] = useState(false);
  const [courseSearchError, setCourseSearchError] = useState<string | null>(null);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  // 4. Skill gap state & D3 Radar view
  const [skillGapViewMode, setSkillGapViewMode] = useState<'radar' | 'bars'>('bars');
  const [targetRoleId, setTargetRoleId] = useState<string>('product-design');
  const [skills, setSkills] = useState<Array<{ name: string; percentage: number | null; color: string }>>([
    { name: 'Design', percentage: null, color: 'bg-[#1a6682]' },
    { name: 'Data', percentage: null, color: 'bg-[#1a6682]' },
    { name: 'Comm.', percentage: null, color: 'bg-[#1a6682]' },
  ]);
  const [showSkillGapModal, setShowSkillGapModal] = useState(false);
  const [skillAnalysisText, setSkillAnalysisText] = useState<string | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // 5. Interview practice state
  const [questionIndex, setQuestionIndex] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [showAnswerBox, setShowAnswerBox] = useState(false);
  const [aiCoachingTip, setAiCoachingTip] = useState<string | null>(null);
  const [isCoaching, setIsCoaching] = useState(false);

  // 6. Applications state
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [showLogAppModal, setShowLogAppModal] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState<ApplicationItem['status']>('Applied');

  // 7. Roadmap state
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([
    { id: 'rm_1', title: 'Complete profile', completed: false },
    { id: 'rm_2', title: 'Upload & revamp CV', completed: false },
    { id: 'rm_3', title: 'Finish "Data storytelling" course', completed: false },
    { id: 'rm_4', title: 'Practice 3 mock interviews', completed: false },
    { id: 'rm_5', title: 'Apply to 5 internships', completed: false },
  ]);
  const [roadmapSuccessMsg, setRoadmapSuccessMsg] = useState(false);

  // Profile Menu Dropdown
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Only source-linked records returned by the live ADK tool are displayed.
  const filteredInternships = opportunities.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || item.title.toLowerCase().includes(query) || item.tags.some(tag => tag.toLowerCase().includes(query)) || item.company.toLowerCase().includes(query);
    const matchesTag = !selectedTag || item.category === selectedTag || (selectedTag === 'Remote' && item.location.toLowerCase().includes('remote'));
    return matchesQuery && matchesTag;
  });

  const recordsFrom = (value: unknown, depth = 0): Record<string, unknown>[] => {
    if (depth > 6 || value == null) return [];
    if (typeof value === 'string') {
      const text = value.trim(); const first = text.indexOf('{'); const last = text.lastIndexOf('}');
      try { return recordsFrom(JSON.parse(first >= 0 && last > first ? text.slice(first, last + 1) : text), depth + 1); } catch { return []; }
    }
    if (Array.isArray(value)) {
      const direct = value.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object' && typeof (x as Record<string, unknown>).title === 'string' && ((x as Record<string, unknown>).source_url || (x as Record<string, unknown>).sourceUrl || (x as Record<string, unknown>).url)));
      if (direct.length) return direct;
      for (const item of value) { const found = recordsFrom(item, depth + 1); if (found.length) return found; }
      return [];
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      for (const key of ['opportunities', 'courses', 'results', 'items']) if (Array.isArray(obj[key])) { const found = recordsFrom(obj[key], depth + 1); if (found.length) return found; }
      for (const child of Object.values(obj)) { const found = recordsFrom(child, depth + 1); if (found.length) return found; }
    }
    return [];
  };
  const textField = (value: unknown, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
  const handleSearchOpportunities = async () => {
    setIsSearchingOpportunities(true); setOpportunitySearchError(null); setShowInternshipsModal(true);
    try {
      const result = await onAnalyze('Use the real live search_live_opportunities tool now. Search current South African jobs, internships, learnerships and bursaries for this query: ' + (searchQuery.trim() || 'entry-level opportunities') + '. Request up to 8. Return structured tool records with title, summary, opportunity_type, location, eligibility, deadline, paid_status, source_url, application_url and verification_status. Never invent results, URLs, salaries, deadlines or match percentages. If the tool fails or returns no grounded sources, say so.');
      const records = recordsFrom(result);
      const mapped = records.map((item, index) => {
        const sourceUrl = textField(item.source_url ?? item.sourceUrl ?? item.url); const title = textField(item.title);
        if (!title || !/^https?:\/\//i.test(sourceUrl)) return null;
        const type = textField(item.opportunity_type ?? item.type, 'Opportunity'); const categoryText = (title + ' ' + type).toLowerCase();
        const category: InternshipItem['category'] = /design|ux|ui/.test(categoryText) ? 'Design' : /market|growth|content/.test(categoryText) ? 'Marketing' : /remote/.test(categoryText) ? 'Remote' : 'Tech';
        return { id: textField(item.id, 'live-' + index + '-' + sourceUrl), title, company: textField(item.company ?? item.organization ?? item.provider ?? item.source_title, 'Provider not stated'), location: textField(item.location, 'Location not stated'), type, stipend: textField(item.paid_status ?? item.stipend, 'Pay not stated'), category, tags: [type], sourceUrl, applicationUrl: textField(item.application_url ?? item.applicationUrl) || undefined, deadline: textField(item.deadline) || undefined, verificationStatus: textField(item.verification_status, 'search_result_only') } as InternshipItem;
      }).filter((item): item is InternshipItem => Boolean(item));
      setOpportunities(mapped); if (!mapped.length) setOpportunitySearchError(result?.reply || 'No structured source-linked opportunities were returned by the live backend.');
    } catch (error) { setOpportunitySearchError(error instanceof Error ? error.message : 'Live opportunity search failed.'); }
    finally { setIsSearchingOpportunities(false); }
  };
  const handleSearchCourses = async () => {
    setIsSearchingCourses(true); setCourseSearchError(null); setShowCoursesModal(true); setSelectedCourse(null);
    try {
      const result = await onAnalyze('Use the real live search_live_opportunities tool to find current online courses and training for South African entry-level job seekers: digital skills, data, communication, IT, frontend and workplace readiness. Prefer free or low-cost options; category training; return structured records with title, summary, provider, source_url, application_url and verification_status. Never invent course names, durations, prices or URLs.');
      const records = recordsFrom(result);
      const mapped: CourseItem[] = records.map((item, index) => { const url = textField(item.source_url ?? item.sourceUrl ?? item.url); return { id: textField(item.id, 'course-' + index), title: textField(item.title, 'Course'), duration: textField(item.duration, 'Duration not stated'), level: textField(item.level, 'Level not stated'), icon: 'play' as const, enrolled: false, progress: 0, description: textField(item.summary ?? item.description, 'Review course details on the source page.'), url: /^https?:\/\//i.test(url) ? url : undefined }; }).filter(course => Boolean(course.url));
      setCourses(mapped); if (!mapped.length) setCourseSearchError(result?.reply || 'No structured source-linked courses were returned by the live backend.');
    } catch (error) { setCourseSearchError(error instanceof Error ? error.message : 'Live course search failed.'); }
    finally { setIsSearchingCourses(false); }
  };

  const handleNextQuestion = () => {
    setQuestionIndex(prev => (prev + 1) % INTERVIEW_QUESTIONS.length);
    setPracticeAnswer('');
    setAiCoachingTip(null);
  };

  const handleGetInterviewFeedback = async () => {
    if (!practiceAnswer.trim()) return;
    setIsCoaching(true);
    try {
      const q = INTERVIEW_QUESTIONS[questionIndex];
      const prompt = `You are Sylvia, executive career coach. Review this answer for the interview question: "${q.question}".
User's candidate answer: "${practiceAnswer}".
Give 2 brief, encouraging bullet points on what was strong and 1 tactical improvement using the STAR method. Keep it under 100 words.`;
      const res = await onAnalyze(prompt);
      if (res?.reply) {
        setAiCoachingTip(res.reply);
      } else {
        setAiCoachingTip('Strong structure! Be sure to quantify your impact (e.g. reduced turnaround time by 30% or saved 4 hours per sprint).');
      }
    } catch {
      setAiCoachingTip('Great foundation. Focus on leading with the tangible result and what you learned from the experience.');
    } finally {
      setIsCoaching(false);
    }
  };

  const handleRevampCVWithAI = async () => {
    setShowRevampModal(true);
    if (!cvText.trim()) { setRevampFeedback('Upload a readable PDF, DOCX or TXT CV first. Sylvia will review the text extracted from your actual file.'); return; }
    setIsRevamping(true);
    try {
      const prompt = 'You are Sylvia, a truthful CV reviewer. Review the actual extracted CV below for the target role ' + (searchQuery || 'entry-level work') + '. Use only details in the CV. Never invent employers, qualifications, dates, achievements, metrics or skills. Suggest specific rewrites, relevant ATS keywords, and explain the basis of any score; do not assume a score.\n\nFilename: ' + cvFileName + '\n\nCV TEXT:\n' + cvText.slice(0, 14000);
      const res = await onAnalyze(prompt);
      setRevampFeedback(res?.reply || 'The live backend returned no CV analysis. No score has been assumed.');
      setCvScore(null);
    } catch (error) { setRevampFeedback('CV analysis failed: ' + (error instanceof Error ? error.message : String(error))); setCvScore(null); }
    finally { setIsRevamping(false); }
  };
  const handleReanalyzeSkills = async () => {
    setIsReanalyzing(true);
    try {
      const result = await onAnalyze('Analyze my actual skills for target role ' + targetRoleId + '. Use only my real context and any uploaded CV; do not invent scores or experience. Return evidence-backed strengths, gaps, and next steps.');
      setSkillAnalysisText(result?.reply || 'No live skill analysis was returned.');
      setShowSkillGapModal(true);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleToggleRoadmap = (id: string) => {
    setRoadmap(prev =>
      prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleUpdateRoadmapProgress = () => {
    setRoadmapSuccessMsg(true);
    setTimeout(() => setRoadmapSuccessMsg(false), 3000);
  };

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;
    const newItem: ApplicationItem = {
      id: `app_${Date.now()}`,
      company: newCompany.trim(),
      role: newRole.trim(),
      status: newStatus,
      dateApplied: new Date().toISOString().split('T')[0],
    };
    setApplications(prev => [newItem, ...prev]);
    setNewCompany('');
    setNewRole('');
    setShowLogAppModal(false);
  };



  const currentQuestion = INTERVIEW_QUESTIONS[questionIndex];
  const inProgressCoursesCount = courses.filter(c => c.enrolled && c.progress < 100).length;

  return (
    <div className="w-full max-w-full min-h-full bg-[#f0f4f9] text-slate-800 flex flex-col font-sans select-text px-3.5 sm:px-6 py-3.5 sm:py-4 space-y-3.5 sm:space-y-4 pb-16 shrink-0 box-border">
      {/* Top Banner Navigation / Breadcrumb */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => {
            if (onReturnToCompanion) onReturnToCompanion();
            else if (onNavigateToView) onNavigateToView('chat');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1a6682] transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span>Back to Sylvia Workspace</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenConversation}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 shadow-xs transition-colors"
          >
            Console Stream
          </button>
          <button
            onClick={onOpenMissionControl}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#1a6682] text-white hover:bg-[#15546b] shadow-xs transition-colors"
          >
            Mission Control
          </button>
        </div>
      </div>

      {/* Header Bar */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#145b77] text-white flex items-center justify-center shadow-md shadow-[#145b77]/20 shrink-0">
            <Briefcase className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
              Work Empowerment
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide">
              Readiness · Growth · Opportunity
            </p>
          </div>
        </div>

        {/* Profile Avatar Pill */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(prev => !prev)}
            className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white shadow-xs transition-all"
            aria-label="Sylvia Operator Account"
          >
            <div className="w-6 h-6 rounded-full bg-[#dbe8f2] text-[#1b5e79] font-bold text-[11px] flex items-center justify-center">
              SYL
            </div>
            <span className="text-xs font-semibold text-slate-800">Sylvia</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-100 shadow-xl p-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">Sylvia Career Bridge</p>
                <p className="text-[10px] text-slate-400">Collaborative Work Engine</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenConversation();
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#1a6682]" />
                <span>Open AI Chat Stream</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenMissionControl();
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              >
                <Milestone className="w-3.5 h-3.5 text-[#1a6682]" />
                <span>View Mission Control</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  if (onReturnToCompanion) onReturnToCompanion();
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-t border-slate-100 mt-1"
              >
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Minimize to Companion</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ROW 1: 3 CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {/* CARD 1: Find internship */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#eef6fa] text-[#1a6682] flex items-center justify-center">
              <Search className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Find internship</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Search thousands of curated internships matching your skills and goals.
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:border-[#1a6682] transition-colors">
              <MapPin className="w-3.5 h-3.5 text-slate-400 ml-1.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Role or keywords..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none font-medium"
              />
              <button
                onClick={() => { void handleSearchOpportunities(); }}
                className="px-3 py-1 bg-[#1a6682] hover:bg-[#15546b] text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
              >
                Search
              </button>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {['Remote', 'Design', 'Marketing', '</> Tech'].map(tag => {
                const cleanTag = tag.replace('</> ', '');
                const isSelected = selectedTag === cleanTag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? '' : cleanTag)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                      isSelected
                        ? 'bg-[#1a6682]/10 border-[#1a6682] text-[#1a6682] font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {tag === 'Remote' && '⏱ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Match Feedback Line */}
          <div
            onClick={() => setShowInternshipsModal(true)}
            className="mt-3 pt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-[#1a6682] transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6682] shrink-0" />
            <span>
              {isSearchingOpportunities ? 'Searching live sources…' : filteredInternships.length + ' source-linked results'} for "{searchQuery || selectedTag || 'roles'}"
            </span>
          </div>
        </div>

        {/* CARD 2: Revamp CV */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#eef6fa] text-[#1a6682] flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Revamp CV</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Get instant feedback, modern templates, and AI-powered improvements.
              </p>
            </div>

            {/* Uploaded Box */}
            <label className="block border-2 border-dashed border-[#8ec0d8] bg-[#f4f9fc] hover:bg-[#eaf4fa] rounded-xl p-2.5 text-center cursor-pointer transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="sr-only"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setCvUploadError(null); setCvText(''); setCvFileName('');
                  try {
                    const extracted = await extractUploadedFileText(file);
                    if (!extracted.trim()) throw new Error('No readable text found. This may be a scanned PDF; use a text-based PDF or DOCX.');
                    setCvFileName(file.name); setCvText(extracted.slice(0, 14000)); setCvScore(null);
                  } catch (error) { setCvUploadError(error instanceof Error ? error.message : 'Could not read this CV file.'); }
                }}
              />
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#1a6682]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1a6682]" />
                <span>{cvFileName ? cvFileName + ' ready for analysis' : 'Choose a PDF, DOCX or TXT CV'}</span>
              </div>
            </label>
            {cvUploadError && <p className="text-[10px] text-rose-600" role="alert">{cvUploadError}</p>}

            {/* Action Button */}
            <button
              onClick={handleRevampCVWithAI}
              className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all hover:border-slate-300"
            >
              <Pencil className="w-3.5 h-3.5 text-[#1a6682]" />
              <span>Revamp with AI</span>
            </button>
          </div>

          {/* Private & Secure text */}
          <div className="mt-3 pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Private & secure</span>
          </div>
        </div>

        {/* CARD 3: Access courses */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#eef6fa] text-[#1a6682] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Access courses</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Upskill with expert-led courses. New content added weekly.
              </p>
            </div>

            {/* Course List Items */}
            <div className="space-y-1.5 pt-0.5">
              {courses.slice(0, 3).map(course => (
                <div
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    setShowCoursesModal(true);
                  }}
                  className="group p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#eef6fa] text-[#1a6682] flex items-center justify-center shrink-0">
                      {course.icon === 'play' && <Play className="w-3 h-3 fill-current ml-0.5" />}
                      {course.icon === 'chat' && <MessageSquare className="w-3 h-3" />}
                      {course.icon === 'code' && <Code className="w-3 h-3" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-[#1a6682] transition-colors">
                        {course.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <span>⏱ {course.duration}</span>
                        <span>·</span>
                        <span>{course.level}</span>
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1a6682] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-3 pt-1">
            <button
              onClick={() => { void handleSearchCourses(); }}
              className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:border-slate-300 shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1a6682]" />
              <span>Browse live courses</span>
            </button>
          </div>
        </div>
      </div>

      {/* ROW 2: 4 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* CARD 4: Skill gap */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#eef6fa] text-[#1a6682] flex items-center justify-center">
                <PieChart className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              {/* View Mode Toggle Button */}
              <div className="inline-flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  onClick={() => setSkillGapViewMode('bars')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    skillGapViewMode === 'bars'
                      ? 'bg-white text-[#1a6682] shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Progress Bars View"
                >
                  Bars
                </button>
                <button
                  onClick={() => setSkillGapViewMode('radar')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    skillGapViewMode === 'radar'
                      ? 'bg-white text-[#1a6682] shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="D3 Radar Chart View"
                >
                  Radar
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Skill gap</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                See how your skills match target roles.
              </p>
            </div>

            {skillGapViewMode === 'radar' ? (
              <div className="pt-0 flex justify-center">
                <SkillGapRadarChart
                  compact={true}
                  selectedRoleId={targetRoleId}
                  onSelectRole={setTargetRoleId}
                  onSelectCourse={courseTitle => {
                    const matched = courses.find(
                      c =>
                        c.title.toLowerCase().includes(courseTitle.toLowerCase()) ||
                        courseTitle.toLowerCase().includes(c.title.toLowerCase())
                    );
                    if (matched) {
                      setSelectedCourse(matched);
                      setShowCoursesModal(true);
                    } else {
                      setShowCoursesModal(true);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {skills.map(skill => (
                  <div key={skill.name} className="flex items-center justify-between gap-2.5 text-xs">
                    <span className="font-semibold text-slate-700 w-12 shrink-0 text-[11px] sm:text-xs">{skill.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#1a6682] rounded-full transition-all duration-700"
                        style={{ width: `${skill.percentage ?? 0}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-700 w-8 text-right shrink-0 text-[11px] sm:text-xs">
                      {skill.percentage === null ? 'Not analyzed' : `${skill.percentage}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-3 pt-1">
            <button
              onClick={() => setShowSkillGapModal(true)}
              disabled={isReanalyzing}
              className="w-full py-2 px-3 bg-[#1a6682] hover:bg-[#15546b] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
              <span>{isReanalyzing ? 'Re-analyzing...' : 'Re-analyze'}</span>
            </button>
          </div>
        </div>

        {/* CARD 5: Interview practice */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#eef6fa] text-[#1a6682] flex items-center justify-center">
              <Mic className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Interview practice</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Answer common questions and get tips.
              </p>
            </div>

            {/* Question Callout */}
            <div
              onClick={() => setShowAnswerBox(true)}
              className="p-2.5 rounded-xl bg-[#f0f6fa] border-l-3 border-[#1a6682] cursor-pointer hover:bg-[#e6f1f7] transition-all group"
              title="Click to practice this question"
            >
              <p className="text-xs font-medium text-slate-800 leading-snug italic group-hover:text-[#1a6682] transition-colors">
                "{currentQuestion.question}"
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-3 pt-1">
            <button
              onClick={handleNextQuestion}
              className="w-full py-2 px-3 bg-[#1a6682] hover:bg-[#15546b] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Next question</span>
            </button>
          </div>
        </div>

        {/* CARD 6: Applications */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#eef6fa] text-[#1a6682] flex items-center justify-center">
              <ClipboardList className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Applications</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Track your application stages.
              </p>
            </div>

            {/* Status Indicator Legend */}
            <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium overflow-x-auto pb-0.5">
              <span className="flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Applied
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Screened
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Interview
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Offer
              </span>
            </div>

            {/* Application List Items */}
            <div className="space-y-1.5 pt-0.5">
              {applications.slice(0, 3).map(app => {
                const badgeStyles =
                  {
                    Interview: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Review: 'bg-amber-50 text-amber-700 border-amber-200',
                    Offer: 'bg-sky-50 text-sky-700 border-sky-200',
                    Applied: 'bg-slate-100 text-slate-700 border-slate-200',
                    Screened: 'bg-amber-50 text-amber-700 border-amber-200',
                  }[app.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-1.5 rounded-lg border border-slate-100 bg-white"
                  >
                    <div className="min-w-0 pr-1.5">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">
                        {app.role} · {app.company}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${badgeStyles}`}
                    >
                      {app.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-3 pt-1">
            <button
              onClick={() => setShowLogAppModal(true)}
              className="w-full py-2 px-3 bg-[#1a6682] hover:bg-[#15546b] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log application</span>
            </button>
          </div>
        </div>

        {/* CARD 7: Your roadmap */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#eef6fa] text-[#1a6682] flex items-center justify-center">
              <Milestone className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Your roadmap</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Next steps to land your dream role.
              </p>
            </div>

            {/* Roadmap Checklist */}
            <div className="space-y-1.5 pt-0.5 text-xs">
              {roadmap.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleToggleRoadmap(item.id)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  {item.completed ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-400 mx-[3px] shrink-0" />
                  )}
                  <span
                    className={`truncate text-[11px] sm:text-xs transition-colors ${
                      item.completed
                        ? 'text-slate-400 line-through font-normal'
                        : 'text-slate-700 font-medium group-hover:text-slate-900'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-3 pt-1">
            <button
              onClick={handleUpdateRoadmapProgress}
              className="w-full py-2 px-3 bg-[#1a6682] hover:bg-[#15546b] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Update progress</span>
            </button>
            {roadmapSuccessMsg && (
              <p className="text-[10px] text-center text-emerald-600 font-medium mt-1 animate-in fade-in">
                Roadmap synced with Sylvia Mission Control!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER STATUS PILLS */}
      <div className="w-full bg-white rounded-xl px-4 py-2.5 sm:py-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-[#1a6682] text-white flex items-center justify-center text-[8px] font-bold">
            ✓
          </div>
          <span className="text-slate-700 font-medium text-xs">
            <span className="font-mono tabular-nums font-bold">{applications.length}</span> applications tracked
          </span>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#1a6682]" />
          <span className="text-slate-700 font-medium text-xs">
            CV score: <strong className="text-slate-900 font-bold font-mono tabular-nums">{cvScore === null ? 'Not analyzed' : cvScore}</strong>{cvScore === null ? '' : ' / 100'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5 text-[#1a6682]" />
          <span className="text-slate-700 font-medium text-xs">
            <span className="font-mono tabular-nums font-bold">{inProgressCoursesCount}</span> courses in progress
          </span>
        </div>
      </div>

      {/* ===================== MODALS ===================== */}

      {/* 1. INTERNSHIPS MODAL */}
      {showInternshipsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Curated Internships</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredInternships.length} matches for "{searchQuery || 'all roles'}"
                </p>
              </div>
              <button
                onClick={() => setShowInternshipsModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-3">
              {isSearchingOpportunities && <p className="py-6 text-center text-sm text-slate-500">Searching live sources through Sylvia…</p>}
              {opportunitySearchError && !isSearchingOpportunities && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{opportunitySearchError}</p>}
              {!isSearchingOpportunities && !opportunitySearchError && filteredInternships.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No source-linked opportunities returned. Try a different search.</p>}
              {filteredInternships.map(internship => (
                <div
                  key={internship.id}
                  className="p-4 rounded-2xl border border-slate-200/90 hover:border-[#1a6682] bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">{internship.title}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{internship.verificationStatus || 'search_result_only'}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {internship.company} · {internship.location} · {internship.stipend}{internship.deadline ? ' · Deadline: ' + internship.deadline : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {internship.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <a href={internship.applicationUrl || internship.sourceUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-[#1a6682] hover:bg-[#15546b] text-white rounded-xl text-xs font-semibold shadow-xs text-center">View source</a>
                    <button
                      onClick={() => setShowInternshipsModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. REVAMP CV MODAL */}
      {showRevampModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#1a6682] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">AI CV Revamp Studio</h3>
                  <p className="text-xs text-slate-500">Document: {cvFileName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowRevampModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Ring */}
            <div className="p-4 rounded-2xl bg-[#f0f6fa] border border-[#d2e4f0] flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                  ATS Readiness Score
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-[#1a6682]">{cvScore === null ? "—" : cvScore}</span>
                  <span className="text-sm font-semibold text-slate-500">/ 100</span>
                </div>
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  ✓ High match for {searchQuery || 'Product Design'} roles
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={handleRevampCVWithAI}
                  disabled={isRevamping}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-[#1a6682] text-[#1a6682] hover:bg-[#1a6682] hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRevamping ? 'animate-spin' : ''}`} />
                  <span>Re-evaluate</span>
                </button>
              </div>
            </div>

            {/* Feedback Content */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-800 space-y-2">
              {isRevamping ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <LoaderCircle className="w-6 h-6 animate-spin text-[#1a6682]" />
                  <p className="font-semibold text-slate-600">Sylvia is analyzing ATS keywords & impact metrics...</p>
                </div>
              ) : (
                <div className="prose prose-xs max-w-none whitespace-pre-line">
                  {revampFeedback}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRevampModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#1a6682] hover:bg-[#15546b] text-white text-xs font-semibold"
              >
                Apply Improvements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COURSES MODAL */}
      {showCoursesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Career Skill Courses</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Curated learning paths for youth work readiness and employment
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCoursesModal(false);
                  setSelectedCourse(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSearchingCourses && <p className="py-6 text-center text-sm text-slate-500">Searching live course sources through Sylvia…</p>}
            {courseSearchError && !isSearchingCourses && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{courseSearchError}</p>}
            {!isSearchingCourses && !courseSearchError && courses.length === 0 && !selectedCourse && <p className="py-6 text-center text-sm text-slate-500">No source-linked courses returned.</p>}
            {selectedCourse ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-xs text-[#1a6682] font-semibold flex items-center gap-1 hover:underline"
                >
                  ← Back to all courses
                </button>
                <div className="p-5 rounded-2xl bg-[#f0f6fa] border border-[#d2e4f0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1a6682] uppercase tracking-wide">
                      {selectedCourse.level} Course
                    </span>
                    <span className="text-xs text-slate-500 font-medium">⏱ {selectedCourse.duration}</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">{selectedCourse.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedCourse.description}</p>
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1 font-semibold text-slate-700">
                      <span>Progress</span>
                      <span>{selectedCourse.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#1a6682] rounded-full transition-all"
                        style={{ width: `${selectedCourse.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  {selectedCourse.url && <a href={selectedCourse.url} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-xl bg-[#1a6682] hover:bg-[#15546b] text-white text-xs font-semibold">Open course source</a>}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map(course => (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-[#1a6682] bg-white transition-all cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {course.level}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">⏱ {course.duration}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{course.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs text-[#1a6682] font-semibold">
                        {course.enrolled ? `${course.progress}% Completed` : 'Free Access'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. LOG APPLICATION MODAL */}
      {showLogAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form
            onSubmit={handleAddApplication}
            className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Log New Application</h3>
              <button
                type="button"
                onClick={() => setShowLogAppModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="Company or organisation"
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#1a6682]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UX Designer Intern..."
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#1a6682]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Stage</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#1a6682] bg-white"
                >
                  <option value="Applied">Applied</option>
                  <option value="Screened">Screened</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Review">Review</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogAppModal(false)}
                className="px-4 py-2 text-xs rounded-xl border border-slate-200 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs rounded-xl bg-[#1a6682] hover:bg-[#15546b] text-white font-semibold shadow-xs"
              >
                Log Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. SKILL GAP RE-ANALYSIS & D3 RADAR DIAGNOSTIC MODAL */}
      {showSkillGapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#eef6fa] text-[#1a6682] flex items-center justify-center">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Skill Gap Diagnostic Studio</h3>
                  <p className="text-xs text-slate-500">
                    D3 radial analysis of your profile versus industry benchmarks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSkillGapModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {skillAnalysisText && <div className="rounded-2xl border border-[#d2e4f0] bg-[#f4f9fc] p-4 text-xs text-slate-700 whitespace-pre-wrap">{skillAnalysisText}</div>}

            {/* Role benchmarks switcher & re-analyze trigger */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Target Role:</span>
                <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  {ROLE_BENCHMARKS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setTargetRoleId(r.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        targetRoleId === r.id
                          ? 'bg-[#1a6682] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {r.roleName}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleReanalyzeSkills}
                disabled={isReanalyzing}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#1a6682] text-[#1a6682] hover:bg-[#1a6682] hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                <span>{isReanalyzing ? 'Re-calculating...' : 'Refresh AI Diagnostic'}</span>
              </button>
            </div>

            {/* D3 Radar Chart Container */}
            <div className="p-4 rounded-3xl bg-[#fcfdfe] border border-slate-200/80 flex flex-col items-center">
              <SkillGapRadarChart
                compact={false}
                selectedRoleId={targetRoleId}
                onSelectRole={setTargetRoleId}
                onSelectCourse={courseTitle => {
                  setShowSkillGapModal(false);
                  const matched = courses.find(
                    c =>
                      c.title.toLowerCase().includes(courseTitle.toLowerCase()) ||
                      courseTitle.toLowerCase().includes(c.title.toLowerCase())
                  );
                  if (matched) {
                    setSelectedCourse(matched);
                    setShowCoursesModal(true);
                  } else {
                    setShowCoursesModal(true);
                  }
                }}
              />
            </div>

            {/* Detailed Competency Gap Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Competency Breakdown & Course Pathways
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(ROLE_BENCHMARKS.find(r => r.id === targetRoleId) || ROLE_BENCHMARKS[0]).skills.map(
                  sk => {
                    const delta = sk.current - sk.benchmark;
                    const isExceeding = delta >= 0;
                    return (
                      <div
                        key={sk.key}
                        className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{sk.axis}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              isExceeding
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isExceeding ? `+${delta}% match` : `${delta}% gap`}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                            <span>Profile: {sk.current}%</span>
                            <span>Target: {sk.benchmark}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-[#1a6682] rounded-full"
                              style={{ width: `${sk.current}%` }}
                            />
                          </div>
                        </div>

                        {/* Direct Course Recommendation */}
                        <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 truncate mr-1">
                            Course: <strong className="text-slate-700">{sk.courseSuggestion}</strong>
                          </span>
                          <button
                            onClick={() => {
                              setShowSkillGapModal(false);
                              const matched = courses.find(
                                c =>
                                  c.title.toLowerCase().includes(sk.courseSuggestion.toLowerCase()) ||
                                  sk.courseSuggestion.toLowerCase().includes(c.title.toLowerCase())
                              );
                              if (matched) {
                                setSelectedCourse(matched);
                                setShowCoursesModal(true);
                              } else {
                                setShowCoursesModal(true);
                              }
                            }}
                            className="text-[#1a6682] hover:text-[#145b77] font-semibold shrink-0 hover:underline"
                          >
                            Enroll →
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Strategic Advice Banner */}
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#1a6682] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sylvia Readiness Insight:</p>
                <p className="text-sky-800 mt-0.5 leading-relaxed">
                  Closing the <strong>Data & Metrics (-12%)</strong> and{' '}
                  <strong>User Research (-2%)</strong> gaps will boost your match score for top-tier{' '}
                  {ROLE_BENCHMARKS.find(r => r.id === targetRoleId)?.roleName} internships by using evidence from your CV and a live skill-gap review.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSkillGapModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#1a6682] hover:bg-[#15546b] text-white text-xs font-semibold shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERVIEW PRACTICE MODAL */}
      {showAnswerBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#eef6fa] text-[#1a6682] flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Interview Practice</h3>
                  <span className="text-[10px] font-semibold text-[#1a6682] uppercase tracking-wider">
                    {currentQuestion.category} Question
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAnswerBox(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#f0f6fa] border-l-4 border-[#1a6682]">
              <p className="text-xs font-semibold text-slate-800 italic leading-relaxed">
                "{currentQuestion.question}"
              </p>
              <p className="text-[11px] text-slate-500 mt-2 font-normal">
                💡 <strong>Sylvia Tip:</strong> {currentQuestion.tip}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Your Response:</label>
              <textarea
                rows={4}
                value={practiceAnswer}
                onChange={e => setPracticeAnswer(e.target.value)}
                placeholder="Draft or dictate your response here (e.g. using the STAR framework)..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#1a6682] bg-slate-50/50"
              />
            </div>

            {aiCoachingTip && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sylvia's Feedback & Coaching:</span>
                </p>
                <p className="text-[11px] whitespace-pre-line text-emerald-800">{aiCoachingTip}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowAnswerBox(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={handleGetInterviewFeedback}
                disabled={isCoaching || !practiceAnswer.trim()}
                className="px-5 py-2 bg-[#1a6682] hover:bg-[#15546b] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isCoaching ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Get Sylvia Feedback</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerBridgeWorkspace;
