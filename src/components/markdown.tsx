'use client';

import React from 'react';

// A simple regex-based markdown renderer
const renderMarkdown = (markdown: string | undefined | null) => {
    if (!markdown) {
        return null;
    }

    const lines = markdown.split('\n');
    const elements = lines.map((line, index) => {
        if (line.startsWith('### ')) {
            return (
                <h3 key={index} className="text-xl font-semibold mt-6 mb-2 text-foreground">
                    {line.substring(4)}
                </h3>
            );
        }
        if (line.startsWith('**')) {
            return (
                <p key={index} className="my-1">
                    <strong className="font-semibold text-foreground">{line.replace(/\*\*/g, '')}</strong>
                </p>
            );
        }
        if (line.startsWith('- ')) {
            return (
                <li key={index} className="list-disc ml-6 text-muted-foreground">
                    {line.substring(2)}
                </li>
            );
        }
        if (line.trim() === '') {
            return <br key={index} />;
        }
        return (
            <p key={index} className="my-1 text-muted-foreground">
                {line}
            </p>
        );
    });

    return <>{elements}</>;
};


interface MarkdownProps {
  content: string | undefined | null;
  className?: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content, className }) => {
  return (
    <div className={className}>
      {renderMarkdown(content)}
    </div>
  );
};

export default Markdown;
