
import React, { useState } from 'react';
// FIX: Imported the missing CodeBracketIcon component.
import { ClipboardIcon, CheckIcon, PythonLogoIcon, CodeBracketIcon } from './icons';

interface CodeBlockProps {
  code: string;
  onCopy: (code: string) => void;
  onRun: (code: string) => void;
  isStreaming?: boolean;
}

// Simple syntax highlighter for Python
const highlightSyntax = (code: string) => {
    // Escape HTML to prevent XSS
    let highlightedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Keywords
    highlightedCode = highlightedCode.replace(/\b(def|class|if|elif|else|for|while|in|return|import|from|as|try|except|finally|with|pass|break|continue|lambda|yield|async|await|True|False|None)\b/g, '<span class="syntax-keyword">$1</span>');
    // Strings (double and single quotes)
    highlightedCode = highlightedCode.replace(/(".*?"|'.*?')/g, '<span class="syntax-string">$1</span>');
    // Comments
    highlightedCode = highlightedCode.replace(/(#.*$)/gm, '<span class="syntax-comment">$1</span>');
    // Functions/methods (simple approximation)
    highlightedCode = highlightedCode.replace(/(\w+)\(/g, '<span class="syntax-function">$1</span>(');
    // Numbers
    highlightedCode = highlightedCode.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="syntax-number">$1</span>');
     // Operators
    highlightedCode = highlightedCode.replace(/([+\-*/%=<>!&|~^]+)/g, '<span class="syntax-operator">$1</span>');

    return highlightedCode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, onCopy, onRun, isStreaming }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    onCopy(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="flex items-center justify-between px-4 py-1.5 bg-black/30">
        <span className="text-xs font-semibold text-text-medium font-code flex items-center gap-2">
            <PythonLogoIcon className="w-4 h-4" />
            Python Code
        </span>
        <div className="flex items-center gap-2">
           <button 
                onClick={() => onRun(code)} 
                title="Run code in Py-Core"
                className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-md text-text-medium hover:bg-input hover:text-primary transition-colors"
            >
                <CodeBracketIcon className="w-4 h-4" />
                Run in Py-Core
            </button>
          <button onClick={handleCopy} title="Copy code" className="p-1 rounded-md hover:bg-input">
            {isCopied ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ClipboardIcon className="w-4 h-4 text-text-medium" />
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