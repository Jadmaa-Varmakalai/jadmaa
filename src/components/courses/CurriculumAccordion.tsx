import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, Lock } from 'lucide-react';
import type { Module } from '../../types';

interface CurriculumAccordionProps {
  modules: Module[];
  onSelectLesson?: (lessonId: string) => void;
  activeLessonId?: string;
}

export const CurriculumAccordion: React.FC<CurriculumAccordionProps> = ({ 
  modules,
  onSelectLesson,
  activeLessonId
}) => {
  // First module open by default
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    [modules[0]?.id || '']: true
  });

  const toggleModule = (id: string) => {
    setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      {modules.map((module, index) => {
        const isOpen = !!openModules[module.id];
        return (
          <div 
            key={module.id} 
            className="border border-jadmaa-border rounded-xl bg-white overflow-hidden shadow-sm transition-all"
          >
            {/* Module Header Toggle */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center justify-between p-4 bg-jadmaa-cream/60 hover:bg-jadmaa-cream text-left transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="w-7 h-7 rounded-full bg-jadmaa-red text-white flex items-center justify-center font-bold text-xs">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-heading font-bold text-base sm:text-lg text-jadmaa-charcoal">
                    {module.title}
                  </h4>
                  {module.description && (
                    <p className="text-xs sm:text-sm text-jadmaa-textMuted mt-0.5">{module.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs font-semibold text-jadmaa-textMuted shrink-0">
                <span>{module.lessons.length} {module.lessons.length === 1 ? 'Lesson' : 'Lessons'}</span>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Lessons List (Sub-dropdown items) */}
            {isOpen && (
              <div className="divide-y divide-gray-100 bg-white">
                {module.lessons.map((lesson) => {
                  const isActive = activeLessonId === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => onSelectLesson && onSelectLesson(lesson.id)}
                      className={`flex items-center justify-between p-3.5 pl-6 text-xs transition-colors ${
                        onSelectLesson ? 'cursor-pointer hover:bg-jadmaa-cream/50' : ''
                      } ${isActive ? 'bg-jadmaa-red/10 border-l-4 border-jadmaa-red font-bold text-jadmaa-red' : 'text-jadmaa-charcoal'}`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        {lesson.isFreePreview ? (
                          <PlayCircle className="w-4 h-4 text-jadmaa-red shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        {lesson.isFreePreview && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            FREE PREVIEW
                          </span>
                        )}
                        <span className="text-gray-400 font-mono text-[11px]">{lesson.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
