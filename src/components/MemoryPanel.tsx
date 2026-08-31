import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DecisionDNA, ContextMemory } from '../types';
import {
  Dna,
  Brain,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Shield,
  Compass,
  Sliders,
  Check,
} from 'lucide-react';

interface MemoryPanelProps {
  decisionDNA: DecisionDNA;
  contextMemories: ContextMemory[];
  onAddDecisionRule: (rule: string) => void;
  onAddContextMemory: (key: string, summary: string, details: string, category: ContextMemory['category']) => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  decisionDNA,
  contextMemories,
  onAddDecisionRule,
  onAddContextMemory,
}) => {
  const [activeTab, setActiveTab] = useState<'dna' | 'context'>('dna');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);

  // New Rule Modal state
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');

  // New Memory Modal state
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemSummary, setNewMemSummary] = useState('');
  const [newMemDetails, setNewMemDetails] = useState('');
  const [newMemCategory, setNewMemCategory] = useState<ContextMemory['category']>('BUSINESS');

  const filteredMemories = contextMemories.filter(
    m =>
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.details && m.details.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSaveRule = () => {
    if (!newRuleText.trim()) return;
    onAddDecisionRule(newRuleText);
    setNewRuleText('');
    setIsAddingRule(false);
  };

  const handleSaveMemory = () => {
    if (!newMemKey.trim() || !newMemSummary.trim()) return;
    onAddContextMemory(newMemKey, newMemSummary, newMemDetails, newMemCategory);
    setNewMemKey('');
    setNewMemSummary('');
    setNewMemDetails('');
    setIsAddingMemory(false);
  };

  return (
    <div id="sylvia-memory-panel" className="p-4 space-y-4 text-xs select-none">
      {/* Tab Switcher */}
      <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800">
        <button
          onClick={() => setActiveTab('dna')}
          className={`flex-1 py-1.5 rounded-lg font-mono-code text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'dna'
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dna className="w-3.5 h-3.5" />
          <span>Decision DNA</span>
        </button>

        <button
          onClick={() => setActiveTab('context')}
          className={`flex-1 py-1.5 rounded-lg font-mono-code text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'context'
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Context Memory</span>
        </button>
      </div>

      {/* DECISION DNA VIEW */}
      {activeTab === 'dna' && (
        <div className="space-y-4">
          {/* Core Goals */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[10px] font-mono-code text-indigo-400 font-bold uppercase mb-2">
              <Compass className="w-3.5 h-3.5" />
              Strategic Goals
            </div>
            <ul className="space-y-1.5 text-slate-300 font-sans">
              {decisionDNA.goals.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-mono-code">›</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Constraints & Governance */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[10px] font-mono-code text-amber-400 font-bold uppercase mb-2">
              <Shield className="w-3.5 h-3.5" />
              Autonomy Constraints
            </div>
            <ul className="space-y-1.5 text-slate-300 font-sans">
              {decisionDNA.constraints.map((constraint, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono-code">!</span>
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Working Style & Preferences */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[10px] font-mono-code text-cyan-400 font-bold uppercase mb-2">
              <Sliders className="w-3.5 h-3.5" />
              Working Style Preferences
            </div>
            <ul className="space-y-1.5 text-slate-300 font-sans">
              {decisionDNA.workingStyle.map((style, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono-code">•</span>
                  <span>{style}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Active Decision Rules */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono-code text-purple-400 font-bold uppercase">
                <Dna className="w-3.5 h-3.5" />
                Active Decision Rules ({decisionDNA.decisionRules.length})
              </div>
              <button
                onClick={() => setIsAddingRule(true)}
                className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Rule
              </button>
            </div>

            <div className="space-y-1.5 font-mono-code text-[11px] text-slate-300">
              {decisionDNA.decisionRules.map((rule, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900/80 border border-slate-800/60">
                  {rule}
                </div>
              ))}
            </div>

            {/* Inline Add Rule Form */}
            {isAddingRule && (
              <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-purple-500/40 space-y-2">
                <input
                  type="text"
                  placeholder="e.g. Rule 04: If invoice > $10,000 notify CEO."
                  value={newRuleText}
                  onChange={e => setNewRuleText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 text-xs outline-none focus:border-purple-400 font-sans"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => setIsAddingRule(false)}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRule}
                    className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[10px]"
                  >
                    Save Rule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTEXT MEMORY VIEW */}
      {activeTab === 'context' && (
        <div className="space-y-3">
          {/* Search bar & Add Memory Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search persistent memories..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-slate-200 placeholder:text-slate-400 text-xs outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <button
              onClick={() => setIsAddingMemory(true)}
              className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs transition-colors"
              title="Add Context Memory"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Memory Modal */}
          {isAddingMemory && (
            <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-2">
              <div className="text-[10px] font-mono-code text-indigo-300 font-bold uppercase">
                Save Persistent Memory
              </div>
              <input
                type="text"
                placeholder="Key identifier (e.g. TAX_RECORDS_PATH)"
                value={newMemKey}
                onChange={e => setNewMemKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 text-xs outline-none focus:border-indigo-400 font-mono-code"
              />
              <textarea
                rows={2}
                placeholder="Summary description..."
                value={newMemSummary}
                onChange={e => setNewMemSummary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 text-xs outline-none focus:border-indigo-400 font-sans"
              />
              <div className="flex items-center justify-between">
                <select
                  value={newMemCategory}
                  onChange={e => setNewMemCategory(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-[10px] font-mono-code"
                >
                  <option value="BUSINESS">BUSINESS</option>
                  <option value="CONTACT">CONTACT</option>
                  <option value="DECISION">DECISION</option>
                  <option value="PREFERENCE">PREFERENCE</option>
                </select>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setIsAddingMemory(false)}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMemory}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[10px]"
                  >
                    Store Memory
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Memory Items List */}
          <div className="space-y-2">
            {filteredMemories.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-mono-code text-xs">
                No persistent memory found.
              </div>
            ) : (
              filteredMemories.map(mem => {
                const isExpanded = expandedMemoryId === mem.id;
                return (
                  <div
                    key={mem.id}
                    className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/80 transition-all"
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedMemoryId(isExpanded ? null : mem.id)}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono-code font-bold text-indigo-400">
                            {mem.key}
                          </span>
                          <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {mem.category}
                          </span>
                        </div>
                        <p className="text-slate-200 font-sans text-xs">{mem.summary}</p>
                      </div>

                      <button className="text-slate-400 p-1">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {isExpanded && mem.details && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-sans leading-relaxed">
                        {mem.details}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
