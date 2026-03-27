import React, { useRef, useState, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

interface CodeEditorProps {
  onCodeChange: (code: string) => void;
  initialCode?: string;
  theme?: 'vs-dark' | 'light';
  highlightedLine?: number | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  onCodeChange, 
  initialCode = '', 
  theme = 'vs-dark',
  highlightedLine = null
}) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const [code, setCode] = useState(initialCode);

  // Sync theme
  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(theme === 'vs-dark' ? 'mips-dark' : 'mips-light');
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
    
    // Register MIPS language
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

    // Dark Theme definition
    monacoInstance.editor.defineTheme('mips-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'variable', foreground: '4FC1FF' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'tag', foreground: 'FFD700' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'string', foreground: 'CE9178' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#D4D4D4',
      },
    });

    // Light Theme definition
    monacoInstance.editor.defineTheme('mips-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000' },
        { token: 'variable', foreground: '0000FF' },
        { token: 'keyword', foreground: 'AF00DB' },
        { token: 'tag', foreground: '808000' },
        { token: 'number', foreground: '098677' },
        { token: 'string', foreground: 'A31515' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
      },
    });

    monacoInstance.editor.setTheme(theme === 'vs-dark' ? 'mips-dark' : 'mips-light');
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
        theme={theme === 'vs-dark' ? 'mips-dark' : 'mips-light'}
        value={code}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
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
