import React, { useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { ExecutionOutput, ExecutionResult } from '@/common/types';

interface TerminalProps {
  outputs: ExecutionOutput[];
  lastResult: ExecutionResult | null;
  isRunning: boolean;
  onClear: () => void;
  onClose?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  outputs,
  lastResult,
  isRunning,
  onClear,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [outputs]);

  const copyToClipboard = () => {
    const fullText = outputs.map((o) => o.text).join('');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOutputColor = (type: ExecutionOutput['type']) => {
    switch (type) {
      case 'stdout': return 'text-[#cdd6f4]';
      case 'stderr': return 'text-[#f38ba8]';
      case 'error': return 'text-[#f38ba8] font-medium';
      case 'success': return 'text-[#a6e3a1] font-medium';
      case 'info': return 'text-[#89dceb]';
      default: return 'text-[#cdd6f4]';
    }
  };

  return (
    <div className="h-48 bg-[#11111b] border-t border-[#313244] flex flex-col select-none shrink-0">
      {/* Terminal Header */}
      <div className="h-8 bg-[#181825] px-3 flex items-center justify-between border-b border-[#313244]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-[#89b4fa]" />
          <span className="text-xs font-semibold text-[#cdd6f4]">Output Terminal</span>

          {/* Status Badge */}
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#f9e2af] bg-[#f9e2af]/10 px-2 py-0.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f9e2af]" />
              Running...
            </span>
          )}

          {!isRunning && lastResult && (
            <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              lastResult.status === 'completed'
                ? 'text-[#a6e3a1] bg-[#a6e3a1]/10'
                : lastResult.status === 'stopped'
                ? 'text-[#fab387] bg-[#fab387]/10'
                : 'text-[#f38ba8] bg-[#f38ba8]/10'
            }`}>
              {lastResult.status === 'completed' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {lastResult.status === 'completed' ? 'Exit Code 0' : `Status: ${lastResult.status}`}
              <span className="text-[#6c7086] ml-1">({lastResult.durationMs}ms)</span>
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={copyToClipboard}
            title="Copy Output"
            className="p-1 rounded hover:bg-[#313244] text-[#a6adc8] hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#a6e3a1]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            title="Clear Terminal"
            className="p-1 rounded hover:bg-[#313244] text-[#a6adc8] hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div
        ref={containerRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-xs select-text whitespace-pre-wrap leading-relaxed"
      >
        {outputs.length === 0 ? (
          <div className="text-[#585b70] italic">
            Program output and compiler messages will appear here. Press Run (F5) to execute code.
          </div>
        ) : (
          outputs.map((item, idx) => (
            <span key={idx} className={getOutputColor(item.type)}>
              {item.text}
            </span>
          ))
        )}
      </div>
    </div>
  );
};
