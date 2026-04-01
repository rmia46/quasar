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

  // Register Language and Token Provider
  useEffect(() => {
    if (monaco) {
      // Always register/update to ensure latest instructions are included
      if (!monaco.languages.getLanguages().some(l => l.id === 'mips')) {
        monaco.languages.register({ id: 'mips' });
      }

      monaco.languages.setMonarchTokensProvider('mips', {
        tokenizer: {
          root: [
            [/;.*$/, 'comment'],
            [/#.*$/, 'comment'],
            [/\$[svat][0-9]|\$[raesp]|\$[zero]|\$[f][0-9]{1,2}/, 'variable'],
            [/\$[0-9]{1,2}/, 'variable'],
            [/\b(add|addu|sub|subu|and|or|xor|nor|slt|sltu|sll|srl|sra|sllv|srlv|srav|mult|multu|div|divu|mfhi|mflo|mthi|mtlo|jr|jalr|syscall|break|nop|mtc1|mfc1|swc1|lwc1|exit|loop)\b/, 'keyword'],
            [/\b(add\.s|sub\.s|mul\.s|div\.s|cvt\.s\.w)\b/, 'keyword'],
            [/\b(addi|addiu|andi|ori|xori|slti|sltiu|lui|lw|sw|lb|lbu|lh|lhu|sb|sh|beq|bne|bltz|bgez|blez|bgtz|j|jal|li|la|move|bge|ble|bgt|blt|beqz|bnez)\b/, 'keyword'],
            [/^\.[a-zA-Z]+/, 'directive'],
            [/[a-zA-Z_\-][a-zA-Z0-9_\-]*:/, 'tag'],
            [/\b\d+\b/, 'number'],
            [/0x[0-9a-fA-F]+\b/, 'number'],
            [/".*?"/, 'string'],
          ],
        },
      });

      monaco.languages.setLanguageConfiguration('mips', {
        comments: { lineComment: '#' },
        brackets: [['(', ')']],
        autoClosingPairs: [{ open: '(', close: ')' }],
        surroundingPairs: [{ open: '(', close: ')' }],
      });

      // Re-apply theme whenever monaco instance is ready
      applyTheme(monaco, theme);
    }
  }, [monaco, applyTheme, theme]);

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
    applyTheme(monacoInstance, theme);
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
          background: rgba(254, 148, 66, 0.15) !important;
          border-left: 3px solid #fe9442 !important;
        }
        .current-instruction-glyph {
          background: #fe9442;
          width: 5px !important;
          margin-left: 5px;
        }
      `}} />
      <Editor
        height="100%"
        language="mips"
        theme={`dynamic-theme-${theme.name.replace(/\s+/g, '-')}`}
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
