import React, { useState, useId } from 'react';
import * as d3 from 'd3';
import { Sparkles, ArrowUpRight, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

export interface SkillDimension {
  axis: string;
  key: string;
  current: number;    // 0 - 100
  benchmark: number;  // 0 - 100
  courseSuggestion: string;
  courseDuration: string;
}

export interface TargetRoleBenchmark {
  id: string;
  roleName: string;
  category: string;
  skills: SkillDimension[];
}

export const ROLE_BENCHMARKS: TargetRoleBenchmark[] = [
  {
    id: 'product-design',
    roleName: 'Product Design',
    category: 'Design & UX',
    skills: [
      { axis: 'UI Design', key: 'ui', current: 86, benchmark: 85, courseSuggestion: 'Advanced Design Systems', courseDuration: '2h 15m' },
      { axis: 'User Research', key: 'research', current: 78, benchmark: 80, courseSuggestion: 'Qualitative User Interviews', courseDuration: '1h 30m' },
      { axis: 'Prototyping', key: 'proto', current: 82, benchmark: 75, courseSuggestion: 'Interactive Micro-animations', courseDuration: '3h 00m' },
      { axis: 'Data & Metrics', key: 'data', current: 58, benchmark: 70, courseSuggestion: 'Data storytelling', courseDuration: '2h 30m' },
      { axis: 'Communication', key: 'comm', current: 74, benchmark: 80, courseSuggestion: 'Communication skills', courseDuration: '1h 45m' },
      { axis: 'Frontend Basics', key: 'tech', current: 65, benchmark: 60, courseSuggestion: 'Intro to frontend', courseDuration: '4h 20m' },
    ],
  },
  {
    id: 'frontend-dev',
    roleName: 'Frontend Engineer',
    category: 'Engineering',
    skills: [
      { axis: 'UI Design', key: 'ui', current: 86, benchmark: 65, courseSuggestion: 'Advanced Design Systems', courseDuration: '2h 15m' },
      { axis: 'User Research', key: 'research', current: 78, benchmark: 50, courseSuggestion: 'Usability Testing for Devs', courseDuration: '1h 15m' },
      { axis: 'Prototyping', key: 'proto', current: 82, benchmark: 80, courseSuggestion: 'Component State Architectures', courseDuration: '2h 45m' },
      { axis: 'Data & Metrics', key: 'data', current: 58, benchmark: 75, courseSuggestion: 'Data storytelling', courseDuration: '2h 30m' },
      { axis: 'Communication', key: 'comm', current: 74, benchmark: 75, courseSuggestion: 'Communication skills', courseDuration: '1h 45m' },
      { axis: 'Frontend Basics', key: 'tech', current: 65, benchmark: 90, courseSuggestion: 'Modern React & TypeScript Deep Dive', courseDuration: '5h 10m' },
    ],
  },
  {
    id: 'data-analyst',
    roleName: 'Data Analyst',
    category: 'Analytics',
    skills: [
      { axis: 'UI Design', key: 'ui', current: 86, benchmark: 50, courseSuggestion: 'Information Dashboard Design', courseDuration: '2h 00m' },
      { axis: 'User Research', key: 'research', current: 78, benchmark: 60, courseSuggestion: 'A/B Experimentation & Metrics', courseDuration: '1h 45m' },
      { axis: 'Prototyping', key: 'proto', current: 82, benchmark: 45, courseSuggestion: 'Interactive Data Visualizations', courseDuration: '2h 30m' },
      { axis: 'Data & Metrics', key: 'data', current: 58, benchmark: 92, courseSuggestion: 'Data storytelling', courseDuration: '2h 30m' },
      { axis: 'Communication', key: 'comm', current: 74, benchmark: 85, courseSuggestion: 'Executive Stakeholder Reporting', courseDuration: '1h 30m' },
      { axis: 'Frontend Basics', key: 'tech', current: 65, benchmark: 65, courseSuggestion: 'Python & SQL Analytics Pipeline', courseDuration: '3h 40m' },
    ],
  },
];

interface SkillGapRadarChartProps {
  compact?: boolean;
  selectedRoleId?: string;
  onSelectRole?: (roleId: string) => void;
  onSelectCourse?: (courseTitle: string) => void;
}

export function SkillGapRadarChart({
  compact = false,
  selectedRoleId = 'product-design',
  onSelectRole,
  onSelectCourse,
}: SkillGapRadarChartProps) {
  const gradientId = useId();
  const [activeRole, setActiveRole] = useState(selectedRoleId);
  const [hoveredSkill, setHoveredSkill] = useState<SkillDimension | null>(null);

  // Sync external role change
  React.useEffect(() => {
    if (selectedRoleId) setActiveRole(selectedRoleId);
  }, [selectedRoleId]);

  const benchmarkProfile =
    ROLE_BENCHMARKS.find(b => b.id === activeRole) || ROLE_BENCHMARKS[0];
  const skills = benchmarkProfile.skills;
  const numAxes = skills.length;

  // Radar geometry dimensions
  const size = compact ? 190 : 340;
  const margin = compact ? 26 : 46;
  const radius = (size - margin * 2) / 2;
  const center = size / 2;
  const angleSlice = (Math.PI * 2) / numAxes;

  // D3 Scales
  const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

  // Points generator
  const getCoordinates = (value: number, index: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const x = center + rScale(value) * Math.cos(angle);
    const y = center + rScale(value) * Math.sin(angle);
    return { x, y };
  };

  // Build polygon path strings
  const currentCoords = skills.map((s, i) => getCoordinates(s.current, i));
  const currentPathString = currentCoords.reduce(
    (acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x},${curr.y}`,
    ''
  ) + ' Z';

  const benchmarkCoords = skills.map((s, i) => getCoordinates(s.benchmark, i));
  const benchmarkPathString = benchmarkCoords.reduce(
    (acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x},${curr.y}`,
    ''
  ) + ' Z';

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];

  const handleRoleChange = (roleId: string) => {
    setActiveRole(roleId);
    if (onSelectRole) onSelectRole(roleId);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Role Selector Tabs (Single-line controls) */}
      {!compact && (
        <div className="w-full mb-3 flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
            Target Benchmark:
          </div>
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            {ROLE_BENCHMARKS.map(role => (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeRole === role.id
                    ? 'bg-white text-[#1a6682] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {role.roleName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* D3 Radar SVG */}
      <div className="relative w-full flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className={`w-full overflow-visible select-none drop-shadow-xs ${compact ? 'max-w-[200px] h-[130px]' : 'max-w-[340px] h-auto'}`}
        >
          <defs>
            <linearGradient id={`radar-fill-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a6682" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#145b77" stopOpacity="0.25" />
            </linearGradient>
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1a6682" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Background Concentric Circular/Polygonal Grid */}
          {gridLevels.map(level => {
            const levelPoints = skills.map((_, i) => getCoordinates(level, i));
            const levelPath = levelPoints.reduce(
              (acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x},${curr.y}`,
              ''
            ) + ' Z';
            return (
              <g key={`level-${level}`}>
                <path
                  d={levelPath}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={level === 100 ? 1.5 : 1}
                  strokeDasharray={level === 100 ? undefined : '2,2'}
                />
                {level === 100 && (
                  <text
                    x={center + 3}
                    y={center - rScale(level) + 10}
                    className="text-[9px] fill-slate-300 font-mono font-medium"
                  >
                    100%
                  </text>
                )}
              </g>
            );
          })}

          {/* Radial Spokes and Axis Labels */}
          {skills.map((skill, i) => {
            const edge = getCoordinates(100, i);
            const labelCoord = getCoordinates(compact ? 116 : 118, i);
            const isHovered = hoveredSkill?.key === skill.key;

            return (
              <g key={`axis-${skill.key}`}>
                <line
                  x1={center}
                  y1={center}
                  x2={edge.x}
                  y2={edge.y}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                />
                <text
                  x={labelCoord.x}
                  y={labelCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`${compact ? 'text-[8.5px]' : 'text-[10px] sm:text-[11px]'} font-semibold transition-colors duration-150 cursor-pointer ${
                    isHovered ? 'fill-[#1a6682] font-bold' : 'fill-slate-600'
                  }`}
                  onClick={() => setHoveredSkill(skill)}
                >
                  {skill.axis}
                </text>
              </g>
            );
          })}

          {/* Target Role Benchmark Polygon (Amber/Dashed Outline) */}
          <path
            d={benchmarkPathString}
            fill="#f59e0b"
            fillOpacity={0.06}
            stroke="#f59e0b"
            strokeWidth={1.8}
            strokeDasharray="4,3"
            className="transition-all duration-300"
          />

          {/* User Current Proficiency Polygon */}
          <path
            d={currentPathString}
            fill={`url(#radar-fill-${gradientId})`}
            stroke="#1a6682"
            strokeWidth={2.2}
            filter={`url(#glow-${gradientId})`}
            className="transition-all duration-300"
          />

          {/* Target Benchmark Vertices */}
          {benchmarkCoords.map((pt, i) => (
            <circle
              key={`bm-${skills[i].key}`}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill="#ffffff"
              stroke="#f59e0b"
              strokeWidth={1.5}
            />
          ))}

          {/* User Current Vertices (Interactive Dots) */}
          {currentCoords.map((pt, i) => {
            const skill = skills[i];
            const isHovered = hoveredSkill?.key === skill.key;
            return (
              <g key={`user-dot-${skill.key}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4.5}
                  fill="#ffffff"
                  stroke="#1a6682"
                  strokeWidth={2.2}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredSkill(skill)}
                  onMouseLeave={() => setHoveredSkill(null)}
                  onClick={() => setHoveredSkill(skill)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="w-full flex items-center justify-center gap-5 mt-2 text-xs font-medium">
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="w-3 h-3 rounded-sm bg-[#1a6682]/40 border border-[#1a6682]" />
          <span>Your Profile</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-[#f59e0b]" />
          <span>Target Requirement</span>
        </div>
      </div>

      {/* Interactive Skill Gap Callout Card */}
      {hoveredSkill ? (
        <div className="w-full mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1.5 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1a6682]" />
              {hoveredSkill.axis}
            </span>
            <span className="font-mono tabular-nums text-slate-600">
              Current: <strong className="text-slate-900">{hoveredSkill.current}%</strong> · Target:{' '}
              <strong className="text-amber-700">{hoveredSkill.benchmark}%</strong>
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>
              {hoveredSkill.current >= hoveredSkill.benchmark ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Exceeds requirement (+
                  {hoveredSkill.current - hoveredSkill.benchmark}%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> Skill gap (
                  {hoveredSkill.current - hoveredSkill.benchmark}%)
                </span>
              )}
            </span>
            {hoveredSkill.current < hoveredSkill.benchmark && (
              <button
                onClick={() => onSelectCourse && onSelectCourse(hoveredSkill.courseSuggestion)}
                className="inline-flex items-center gap-1 text-[#1a6682] hover:text-[#145b77] font-semibold hover:underline"
              >
                <span>Take {hoveredSkill.courseSuggestion}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full mt-2 text-center text-[11px] text-slate-400">
          Hover or tap any skill node on the radar to inspect proficiency gap & recommended courses
        </div>
      )}
    </div>
  );
}
