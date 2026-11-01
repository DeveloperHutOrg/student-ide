import React, { useState, useMemo } from 'react';
import { Eye, RefreshCw, Smartphone, Monitor, X, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface WebPreviewProps {
  htmlContent: string;
  cssContent?: string;
  onClose: () => void;
}

export const WebPreviewContent: React.FC<WebPreviewProps> = ({
  htmlContent,
  cssContent = '',
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasError, setHasError] = useState<string | null>(null);

  // Construct safe combined document using useMemo
  const combinedDocument = useMemo(() => {
    try {
      setHasError(null);
      const rawHtml = htmlContent ? htmlContent.trim() : '';

      // Default template if empty
      if (!rawHtml) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      color: #555;
      background: #fafafa;
      text-align: center;
    }
    h2 { color: #222; margin-bottom: 8px; }
    p { color: #888; font-size: 14px; }
  </style>
</head>
<body>
  <h2>Web Preview Ready</h2>
  <p>Type your HTML and CSS to see live updates instantly.</p>
</body>
</html>`;
      }

      // Check if full HTML document structure is present
      const hasHtmlTag = /<html[\s>]/i.test(rawHtml);
      const hasHeadTag = /<\/head>/i.test(rawHtml);
      const hasBodyTag = /<body[\s>]/i.test(rawHtml);

      let processed = rawHtml;

      // Inject CSS if provided
      if (cssContent && cssContent.trim()) {
        const styleTag = `\n<style id="student-ide-custom-css">\n${cssContent}\n</style>\n`;
        if (hasHeadTag) {
          processed = processed.replace(/<\/head>/i, `${styleTag}</head>`);
        } else if (hasBodyTag) {
          processed = processed.replace(/<body[\s>]/i, (match) => `${styleTag}${match}`);
        } else if (hasHtmlTag) {
          processed = processed.replace(/<html[\s>]/i, (match) => `${match}<head>${styleTag}</head>`);
        } else {
          processed = `${styleTag}${processed}`;
        }
      }

      // If document is just an HTML snippet (no doctype or html tag), wrap in standard valid boilerplate
      if (!hasHtmlTag && !hasBodyTag) {
        processed = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 16px;
      color: #111;
      background: #ffffff;
    }
    ${cssContent ? `\n${cssContent}\n` : ''}
  </style>
</head>
<body>
${rawHtml}
</body>
</html>`;
      }

      return processed;
    } catch (err: any) {
      console.error('[WebPreview] Failed to generate combined document:', err);
      setHasError(err?.message || 'Error compiling preview document');
      return `<!DOCTYPE html><html><body><p style="color:red;padding:16px;">Failed to compile preview.</p></body></html>`;
    }
  }, [htmlContent, cssContent]);

  return (
    <div className="w-1/2 bg-[#181825] border-l border-[#313244] flex flex-col h-full select-none shrink-0">
      {/* Header Toolbar */}
      <div className="h-8 bg-[#181825] px-3 flex items-center justify-between border-b border-[#313244]">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-[#89dceb]" />
          <span className="text-xs font-semibold text-[#cdd6f4]">Web Preview</span>
          <span className="text-[10px] text-[#89dceb] bg-[#89dceb]/10 px-1.5 py-0.2 rounded font-mono">
            Isolated
          </span>
        </div>

        {/* View mode & controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'desktop' ? 'mobile' : 'desktop')}
            title={viewMode === 'desktop' ? 'Switch to Mobile view (375px)' : 'Switch to Desktop view'}
            className="p-1 rounded hover:bg-[#313244] text-[#a6adc8] hover:text-white transition-colors cursor-pointer"
          >
            {viewMode === 'desktop' ? (
              <Smartphone className="w-3.5 h-3.5" />
            ) : (
              <Monitor className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Reload Preview"
            className="p-1 rounded hover:bg-[#313244] text-[#a6adc8] hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Preview"
            className="p-1 rounded hover:bg-[#313244] text-[#a6adc8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-[#11111b] flex flex-col items-center justify-center p-2 overflow-hidden relative">
        {hasError && (
          <div className="absolute top-3 left-3 right-3 z-10 bg-[#f38ba8]/20 border border-[#f38ba8]/40 text-[#f38ba8] p-2.5 rounded-lg text-xs flex items-center gap-2 shadow">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{hasError}</span>
          </div>
        )}

        <div
          className={`h-full bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 relative ${
            viewMode === 'mobile' ? 'w-[375px] border-4 border-[#313244]' : 'w-full'
          }`}
        >
          {/*
            Safe Isolated Preview:
            - Uses standard `srcDoc` attribute (declarative, native browser rendering).
            - No document.open(), document.write(), or document.close().
            - `sandbox="allow-scripts allow-modals allow-forms"`:
                * Permits student JavaScript, alerts, and forms.
                * WITHOUT `allow-same-origin`, preventing access to parent window, cookies, or Electron/Node APIs.
          */}
          <iframe
            key={`preview-frame-${refreshKey}`}
            title="Student Web Preview"
            srcDoc={combinedDocument}
            sandbox="allow-scripts allow-modals allow-forms"
            className="w-full h-full border-none bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export const WebPreview: React.FC<WebPreviewProps> = (props) => {
  return (
    <ErrorBoundary fallbackTitle="Web Preview encountered an issue">
      <WebPreviewContent {...props} />
    </ErrorBoundary>
  );
};
