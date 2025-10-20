import React, { useMemo } from 'react';
import CodeBlock from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
  onCopyCode: (code: string) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onCopyCode }) => {
  const renderedContent = useMemo(() => {
    // Regex to find code blocks with language hints
    const codeBlockRegex = /(```(\w*)\n)([\s\S]*?)(```)/g;
    const parts = content.split(codeBlockRegex);

    const renderText = (text: string) => {
      // This function will handle inline markdown like bold, italic, and links.
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const italicRegex = /\*([^*]+)\*/g;
      const listRegex = /^\s*[-*]\s(.+)/gm; // Match list items line by line
      
      // Handle lists first as they are block-level
      if (listRegex.test(text)) {
          const listItems = text.trim().split('\n').map(item => item.replace(/^\s*[-*]\s/, ''));
          return (
              <ul>
                  {listItems.map((item, index) => <li key={index}>{renderText(item)}</li>)}
              </ul>
          );
      }
      
      // Then handle inline elements
      let elements: (string | React.JSX.Element)[] = [text];

      const processRegex = (regex: RegExp, wrapper: (match: string, content: string, href?: string) => React.JSX.Element) => {
          let newElements: (string | React.JSX.Element)[] = [];
          elements.forEach(el => {
              if (typeof el === 'string') {
                  const matches = [...el.matchAll(regex)];
                  if (matches.length > 0) {
                      let lastIndex = 0;
                      matches.forEach(match => {
                          if (match.index! > lastIndex) {
                              newElements.push(el.substring(lastIndex, match.index));
                          }
                          newElements.push(wrapper(match[0], match[1], match[2]));
                          lastIndex = match.index! + match[0].length;
                      });
                      if (lastIndex < el.length) {
                          newElements.push(el.substring(lastIndex));
                      }
                  } else {
                      newElements.push(el);
                  }
              } else {
                  newElements.push(el);
              }
          });
          elements = newElements;
      };
      
      processRegex(linkRegex, (_, content, href) => <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>);
      processRegex(boldRegex, (_, content) => <strong>{content}</strong>);
      processRegex(italicRegex, (_, content) => <em>{content}</em>);

      return <>{elements.map((el, i) => <React.Fragment key={i}>{el}</React.Fragment>)}</>;
    };

    return parts.map((part, index) => {
      // The structure of the 'parts' array after split is:
      // [text, opening_tag, language, code, closing_tag, text, ...]
      // So, the code is at index 3, 8, 13, ... which is (index - 3) % 5 === 0.
      if ((index - 3) % 5 === 0) {
        const language = parts[index - 1]; // Language is the part before the code
        return (
          <CodeBlock 
            key={index} 
            code={part} 
            language={language} 
            onCopy={onCopyCode} 
          />
        );
      }
      // Render text parts, which are at indices 0, 5, 10, etc. (index % 5 === 0)
      else if (index % 5 === 0) {
        return <span key={index}>{renderText(part)}</span>;
      }
      // The other parts (tags, language) are consumed by the code block, so we return null for them.
      return null;
    });
  }, [content, onCopyCode]);

  return (
    <div className="markdown-content whitespace-pre-wrap">
      {renderedContent}
    </div>
  );
};

export default React.memo(MarkdownRenderer);