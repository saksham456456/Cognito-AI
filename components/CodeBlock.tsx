import React, { useState } from 'react';
import { ClipboardIcon, CheckIcon, PythonLogoIcon, CodeBracketIcon } from './icons';

interface CodeBlockProps {
  code: string;
  language?: string;
  onCopy: (code: string) => void;
  isStreaming?: boolean;
}

// Simple syntax highlighter
const highlightSyntax = (code: string) => {
    // Escape HTML to prevent XSS
    let highlightedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Keywords
    highlightedCode = highlightedCode.replace(/\b(def|class|if|elif|else|for|while|in|return|import|from|as|try|except|finally|with|pass|break|continue|lambda|yield|async|await|True|False|None|const|let|var|function|new|async|await|public|private|protected|static|void|int|string|boolean)\b/g, '<span class="syntax-keyword">$1</span>');
    // Strings (double, single, and template literals)
    highlightedCode = highlightedCode.replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="syntax-string">$1</span>');
    // Comments
    highlightedCode = highlightedCode.replace(/(#.*$|\/\/.*$)/gm, '<span class="syntax-comment">$1</span>');
    // Functions/methods (simple approximation)
    highlightedCode = highlightedCode.replace(/(\w+)\(/g, '<span class="syntax-function">$1</span>(');
    // Numbers
    highlightedCode = highlightedCode.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="syntax-number">$1</span>');
     // Operators
    highlightedCode = highlightedCode.replace(/([+\-*/%=<>!&|~^]+)/g, '<span class="syntax-operator">$1</span>');

    return highlightedCode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, onCopy, isStreaming }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    onCopy(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getLanguageIcon = () => {
      // Simple logic to return an icon based on language string
      if (language?.toLowerCase().includes('python')) {
          return <PythonLogoIcon className="w-4 h-4" />;
      }
      return <CodeBracketIcon className="w-4 h-4" />;
  }

  return (
    <div className="code-block">
      <div className="flex items-center justify-between px-4 py-1.5 bg-black/30">
        <span className="text-xs font-semibold text-text-medium font-code flex items-center gap-2 capitalize">
            {getLanguageIcon()}
            {language || 'Code'}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} title="Copy code" className="p-1.5 rounded-md hover:bg-input text-text-medium hover:text-text-light flex items-center gap-1.5 text-xs">
            {isCopied ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <ClipboardIcon className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlightSyntax(code) }} />
        {/* Blinking cursor appears if the block is currently being streamed */}
        {isStreaming && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-cursor-blink" />}
      </pre>
    </div>
  );
};

export default CodeBlock;
