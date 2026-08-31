import React, { useEffect, useRef } from 'react';

interface AutoGrowTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  minHeight?: number;
}

export const AutoGrowTextarea: React.FC<AutoGrowTextareaProps> = ({
  value,
  minHeight = 96,
  className = '',
  onChange,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        if (onChange) onChange(e);
        autoResize();
      }}
      className={`overflow-hidden resize-none leading-relaxed transition-all duration-75 ${className}`}
      {...props}
    />
  );
};
