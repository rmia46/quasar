import React, { useRef, useState, useEffect, useCallback } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { AppTheme } from '../theme/defaults';

interface CodeEditorProps {
  onCodeChange: (code: string) => void;
  initialCode?: string;
  theme: AppTheme;
  fontSize: number;
  tabSize: number;
  highlightedLine?: number | null;
  onMount?: (editor: any) => void;
  activeFileId: string;
}

const CodeEditor: React.FC<CodeEditorProps> = React.memo(({ 
  onCodeChange, 
  initialCode = '', 
  theme,
  fontSize,
  tabSize,
  highlightedLine = null,
  onMount,
  activeFileId
}) => {
  const monaco = useMonaco();
  const [editor, setEditor] = useState<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const [code, setCode] = useState(initialCode);

  // Sync content when active file changes
  useEffect(() => {
    setCode(initialCode);
  }, [activeFileId]);

  // Apply Theme
  const applyTheme = useCallback((monacoInstance: any, themeObj: AppTheme) => {
    const themeName = `dynamic-theme-${themeObj.name.replace(/\s+/g, '-')}`;
    monacoInstance.editor.defineTheme(themeName, {
      base: themeObj.type === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules: themeObj.editor.tokens.map(t => ({
        token: t.token,
        foreground: t.foreground,
        fontStyle: t.fontStyle
      })),
      colors: {
        'editor.background': themeObj.editor.background,
        'editor.foreground': themeObj.editor.foreground,
      },
    });
    monacoInstance.editor.setTheme(themeName);
  }, []);

  // Sync Dynamic Theme when theme changes
  useEffect(() => {
    if (monaco && theme) {
      applyTheme(monaco, theme);
    }
  }, [theme, monaco, applyTheme]);

  // Handle resizing manually for better performance
  useEffect(() => {
    if (editor) {
      const resizeObserver = new ResizeObserver(() => {
        editor.layout();
      });
      
      const editorElement = document.querySelector('.monaco-editor');
      if (editorElement?.parentElement) {
        resizeObserver.observe(editorElement.parentElement);
      }
      
      // Initial layout call to prevent blank editor
      setTimeout(() => editor.layout(), 50);
      
      return () => resizeObserver.disconnect();
    }
  }, [editor]);

  // Sync Highlighted Line
  useEffect(() => {
    if (monaco && editor) {
      // Clear old decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

      if (highlightedLine !== null && highlightedLine > 0) {
        // Add new decoration
        decorationsRef.current = editor.deltaDecorations([], [
          {
            range: new monaco.Range(highlightedLine, 1, highlightedLine, 1),
            options: {
              isWholeLine: true,
              className: 'current-instruction-highlight',
              glyphMarginClassName: 'current-instruction-glyph',
            }
          }
        ]);

        // Reveal line if it's out of view
        editor.revealLineInCenterIfOutsideViewport(highlightedLine);
      }
    }
  }, [highlightedLine, monaco, editor]);

  function handleEditorDidMount(editorInstance: any, monacoInstance: any) {
    setEditor(editorInstance);
    if (onMount) onMount(editorInstance);
    
    // Apply theme immediately on mount
    applyTheme(monacoInstance, theme);
    
    // Register MIPS language if not already registered
    if (!monacoInstance.languages.getLanguages().some((l: any) => l.id === 'mips')) {
      monacoInstance.languages.register({ id: 'mips' });

      monacoInstance.languages.setMonarchTokensProvider('mips', {
        tokenizer: {
          root: [
            [/;.*$/, 'comment'],
            [/#.*$/, 'comment'],
            [/\$[svat][0-9]|\$[raesp]|\$[zero]/, 'variable'],
            [/\$[0-9]{1,2}/, 'variable'],
            [/\b(add|addu|sub|subu|and|or|xor|nor|slt|sltu|sll|srl|sra|jr|jal|j|beq|bne|lw|sw|lb|sb|lh|sh|li|syscall|move|nop|break|lui|xori)\b/, 'keyword'],
            [/^[a-zA-Z_\-][a-zA-Z0-9_\-]*:/, 'tag'],
            [/\b\d+\b/, 'number'],
            [/0x[0-9a-fA-F]+\b/, 'number'],
            [/".*?"/, 'string'],
          ],
        },
      });

      monacoInstance.languages.setLanguageConfiguration('mips', {
        comments: { lineComment: '#' },
        brackets: [['(', ')']],
        autoClosingPairs: [{ open: '(', close: ')' }],
        surroundingPairs: [{ open: '(', close: ')' }],
      });
    }
  }

  function handleEditorChange(value: string | undefined) {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange(newCode);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .current-instruction-highlight {
          background: rgba(30, 144, 255, 0.2) !important;
          border-left: 3px solid #1e90ff !important;
        }
        .current-instruction-glyph {
          background: #1e90ff;
          width: 5px !important;
          margin-left: 5px;
        }
      `}} />
      <Editor
        height="100%"
        language="mips"
        theme="dynamic-theme"
        value={code}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: fontSize,
          tabSize: tabSize,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: false,
          padding: { top: 10, bottom: 10 },
          glyphMargin: false,
          lineNumbersMinChars: 3,
          lineDecorationsWidth: 20,
          folding: false,
          renderLineHighlight: 'all',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'auto',
            useShadows: false,
            verticalScrollbarSize: 10,
          }
        }}
      />
    </>
  );
});

export default CodeEditor;
