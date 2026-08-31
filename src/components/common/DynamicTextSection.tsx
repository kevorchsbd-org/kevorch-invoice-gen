import React from 'react';

interface DynamicTextSectionProps {
  title?: string;
  content?: string;
  placeholder?: string;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export const DynamicTextSection: React.FC<DynamicTextSectionProps> = ({
  title,
  content,
  placeholder = 'N/A',
  className = '',
  titleClassName = 'font-bold text-black text-xs mb-1 uppercase tracking-wider',
  contentClassName = 'whitespace-pre-wrap break-words leading-relaxed text-black text-[10px] [overflow-wrap:anywhere]'
}) => {
  const textToShow = content && content.trim() ? content.trim() : placeholder;

  return (
    <div className={`h-auto min-h-[3rem] ${className}`}>
      {title && <p className={titleClassName}>{title}</p>}
      <div className={contentClassName}>
        {textToShow}
      </div>
    </div>
  );
};
