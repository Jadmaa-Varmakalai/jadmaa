import React, { useRef, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Edit3 } from 'lucide-react';

interface EditableTextProps {
  settingKey: string;
  defaultText: string;
  className?: string;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({ settingKey, defaultText, className = '', multiline = false }) => {
  const { settings, isEditing, stageSetting } = useSettings();
  const text = settings[settingKey] || defaultText;
  const contentEditableRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // If the external settings updated, sync to the ref to keep contentEditable in sync
    if (contentEditableRef.current && contentEditableRef.current.innerText !== text) {
      if (!multiline && contentEditableRef.current.innerHTML !== text) {
        contentEditableRef.current.innerHTML = text; // for HTML like <br />
      } else if (multiline) {
        contentEditableRef.current.innerText = text;
      }
    }
  }, [text, multiline]);

  const handleBlur = () => {
    if (!contentEditableRef.current) return;
    const newText = multiline ? contentEditableRef.current.innerText : contentEditableRef.current.innerHTML;
    
    // Stage the change locally in draftSettings instead of auto-saving to API
    if (newText !== text) {
      stageSetting(settingKey, newText);
    }
  };

  if (!isEditing) {
    if (multiline) {
      return <span className={className} style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;
    }
    return <span className={className} dangerouslySetInnerHTML={{ __html: text }} />;
  }

  // Editing Mode Wrapper
  const Tag = multiline ? 'div' : 'span';
  return (
    <div className={`relative group inline-block ${className}`}>
      <Tag
        ref={contentEditableRef as any}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        className={`outline-none border-b-2 border-transparent focus:border-jadmaa-red hover:bg-jadmaa-red/10 hover:shadow-sm transition-colors cursor-text rounded-sm px-1 -mx-1`}
        style={multiline ? { whiteSpace: 'pre-wrap', display: 'block' } : {}}
      >
        {/* We use dangerouslySetInnerHTML for non-multiline to preserve <br> tags in titles */}
        {multiline ? text : <span dangerouslySetInnerHTML={{ __html: text }} />}
      </Tag>
      <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-jadmaa-red text-white p-1 rounded-full pointer-events-none shadow-md z-10">
        <Edit3 className="w-3 h-3" />
      </div>
    </div>
  );
};
