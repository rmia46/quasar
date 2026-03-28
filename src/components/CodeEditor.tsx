import React, { useRef, useState, useEffect } from 'react';
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
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  onCodeChange, 
  initialCode = '', 
  theme,
  fontSize,
  tabSize,
  highlightedLine = null,
  onMount
}) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const [code, setCode] = useState(initialCode);

  // Sync Dynamic Theme
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('dynamic-theme', {
        base: theme.type === 'dark' ? 'vs-dark' : 'vs',
        inherit: true,
        rules: theme.editor.tokens.map(t => ({
          token: t.token,
          foreground: t.foreground,
          fontStyle: t.fontStyle
        })),
        colors: {
          'editor.background': theme.editor.background,
          'editor.foreground': theme.editor.foreground,
        },
      });
      monaco.editor.setTheme('dynamic-theme');
    }
  }, [theme, monaco]);

  // Sync Highlighted Line
  useEffect(() => {
    if (monaco && editorRef.current) {
      const editor = editorRef.current;
      
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
  }, [highlightedLine, monaco]);

  function handleEditorDidMount(editor: any, monacoInstance: any) {
    editorRef.current = editor;
    if (onMount) onMount(editor);
    
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

    // Apply initial theme
    monacoInstance.editor.defineTheme('dynamic-theme', {
      base: theme.type === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules: theme.editor.tokens.map(t => ({
        token: t.token,
        foreground: t.foreground,
        fontStyle: t.fontStyle
      })),
      colors: {
        'editor.background': theme.editor.background,
        'editor.foreground': theme.editor.foreground,
      },
    });
    monacoInstance.editor.setTheme('dynamic-theme');
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
          automaticLayout: true,
          padding: { top: 10 },
          glyphMargin: true,
        }}
      />
    </>
  );
};

export default CodeEditor;
