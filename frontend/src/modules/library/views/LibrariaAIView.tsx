import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CommandLineIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { queryAI, logEvent } from '../../../services/aiService';
import { useAuth } from '../../../hooks/useAuth';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';

interface CommandResult {
  id: string;
  input: string;
  command: string;
  status: 'success' | 'error' | 'pending';
  result?: string;
  error?: string;
  table?: {
    columns: string[];
    rows: any[][];
  };
  timestamp: string;
}

export const LibrariaAIView: React.FC = () => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<CommandResult[]>([]);
  const auth = useAuth();
  const {
    isSupported: micSupported,
    isListening: micListening,
    transcript: micTranscript,
    interimTranscript: micInterim,
    startListening,
    stopListening
  } = useSpeechRecognition();
  const committedBeforeListeningRef = React.useRef('');

  // append final recognized speech to the input when final transcript updates
  useEffect(() => {
    if (micTranscript && micTranscript.trim()) {
      setInput(prev => {
        const base = (prev && prev.trim()) ? prev + ' ' : prev || '';
        const next = base + micTranscript.trim();
        // update committed base so interim updates use this
        committedBeforeListeningRef.current = next;
        return next;
      });
    }
    // don't reset the transcript here; hook manages it
  }, [micTranscript]);

  // update textarea live with interim transcript while listening
  useEffect(() => {
    if (micInterim !== undefined && micListening) {
      const base = committedBeforeListeningRef.current || '';
      const display = micInterim && micInterim.trim() ? (base ? base + ' ' + micInterim.trim() : micInterim.trim()) : base;
      setInput(display);
    }
  }, [micInterim, micListening]);

  // when listening stops, make sure any remaining interim or final transcript is committed
  useEffect(() => {
    if (!micListening) {
      // prefer final transcript if available, otherwise commit the interim
      const final = micTranscript && micTranscript.trim();
      const interim = micInterim && micInterim.trim();

      if (final) {
        // ensure final is present in the input
        setInput(prev => {
          // If final already included, leave as-is
          if (prev && prev.includes(final)) return prev;
          const base = (prev && prev.trim()) ? prev + ' ' : prev || '';
          const next = base + final;
          committedBeforeListeningRef.current = next;
          return next;
        });
      } else if (interim) {
        // commit interim if no final arrived
        setInput(prev => {
          const base = (prev && prev.trim()) ? prev + ' ' : prev || '';
          const next = base + interim;
          committedBeforeListeningRef.current = next;
          return next;
        });
      } else {
        // nothing from recognizer; restore committed base
        if (committedBeforeListeningRef.current) setInput(committedBeforeListeningRef.current);
      }
    }
  }, [micListening, micTranscript, micInterim]);

  useEffect(() => {
    // load recent command history from backend logs
    const load = async () => {
      try {
        const res = await fetch('/api/ai/logs');
        if (!res.ok) return;
        const logs = await res.json();
        const data = Array.isArray(logs) ? logs : (logs.value || logs);
        const items: CommandResult[] = data.map((l: any) => {
          let table;
          let resultText;
          try {
            // Prefer the summarized execution result if available (set by backend)
            const exec = l.execution_summary ?? l.execution_result;
            if (exec && typeof exec === 'object') {
              if (Array.isArray(exec.columns) && Array.isArray(exec.rows)) {
                table = { columns: exec.columns, rows: exec.rows };
                resultText = `Returned ${exec.rows.length} rows`;
              } else if (typeof exec.rowcount !== 'undefined') {
                resultText = `${exec.rowcount} rows affected`;
              }
            }
          } catch (e) {
            // ignore
          }
          return {
            id: String(l.id),
            input: l.action || '',
            command: l.ai_response || '',
            status: l.success ? 'success' : 'error',
            result: resultText,
            table,
            timestamp: l.executed_at || new Date().toISOString()
          } as CommandResult;
        });
        setHistory(items);
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  const processCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    // stop mic when submitting
    if (micListening) stopListening();

    setIsProcessing(true);
    const commandId = Date.now().toString();

    // Add command to history as pending
    const newCommand: CommandResult = {
      id: commandId,
      input: input.trim(),
      command: 'Processing...',
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [newCommand, ...prev]);

    try {
      // Call backend AI query; attach admin actor if current user is admin
      let actorType: 'user' | 'admin' | undefined = undefined;
      let actorId: string | undefined = undefined;
      if (auth && auth.isAuthenticated && auth.user && auth.user.role === 'Admin') {
        actorType = 'admin';
        actorId = auth.user.id;
      }
      const res = await queryAI(input.trim(), actorType, actorId);

      const cmdText = res.sql ?? JSON.stringify(res);
      let cmdResult = '';
      let table: { columns: string[]; rows: any[][] } | undefined = undefined;
      if (res && res.result && typeof res.result === 'object' && Array.isArray(res.result.rows) && Array.isArray(res.result.columns)) {
        table = { columns: res.result.columns, rows: res.result.rows };
        cmdResult = `Returned ${res.result.rows.length} rows`;
      } else {
        cmdResult = Array.isArray(res.result) ? `Returned ${res.result.length} rows` : JSON.stringify(res.result);
      }

      // Update command in history as successful
      setHistory(prev => prev.map(cmd =>
        cmd.id === commandId
          ? {
            ...cmd,
            command: cmdText,
            result: cmdResult,
            table,
            status: 'success' as const
          }
          : cmd
      ));

      await logEvent('ai_query', cmdText, { success: true }, auth?.user?.role === 'Admin' ? 'admin' : 'user', auth?.user?.id);
    } catch (error: any) {
      // Update command in history as failed
      setHistory(prev => prev.map(cmd =>
        cmd.id === commandId
          ? {
            ...cmd,
            status: 'error' as const,
            error: error?.message ?? 'Failed to process command'
          }
          : cmd
      ));
      await logEvent('ai_query', input.trim(), { success: false, error: error?.message }, auth?.user?.role === 'Admin' ? 'admin' : 'user', auth?.user?.id);
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full box-border min-w-0">


      <div className="mb-6">
        <h1 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">Libraria AI Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Use natural language to perform library management tasks
        </p>
      </div>

      {/* Command Input */}
      <Card className="mb-8">
        <form onSubmit={processCommand} className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // if user types while listening, update the committed base so interim doesn't overwrite their typing
                  if (micListening) committedBeforeListeningRef.current = e.target.value;
                }}
                placeholder="Enter your command (e.g., 'Mark book The Great Gatsby as available' or 'Show all available books by Dan Brown')"
                className="w-full h-32 px-4 py-3 text-base text-gray-700 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                disabled={isProcessing}
              />
              <p className="mt-2 text-sm text-gray-500">
                Be specific about what you want to do. The AI will generate the appropriate SQL/command.
              </p>
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="flex-shrink-0"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CommandLineIcon className="w-5 h-5 mr-2" />
                  Execute
                </>
              )}
            </Button>
            {/* Microphone button: toggles speech recognition and inserts transcript into the textarea */}
            {micSupported && (
              <button
                type="button"
                onClick={() => {
                  if (micListening) {
                    stopListening();
                  } else {
                    // capture current committed input so interim updates don't clobber typed text
                    committedBeforeListeningRef.current = input || '';
                    startListening();
                  }
                }}
                aria-pressed={micListening}
                title={micListening ? 'Stop listening' : 'Speak'}
                className={`ml-2 inline-flex items-center justify-center p-2 rounded-md border ${micListening ? 'bg-red-100 text-red-600 border-red-200' : 'bg-white text-gray-700 border-gray-200'} hover:opacity-90`}
              >
                <MicrophoneIcon className={`w-5 h-5 ${micListening ? 'animate-pulse' : ''}`} />
              </button>
            )}
          </div>
        </form>
      </Card>

      {/* Command History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Command History</h2>

        {history.map((cmd, index) => (
          <motion.div
            key={cmd.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="mb-8 w-full max-w-5xl mx-auto">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Input: {cmd.input}
                    </p>
                    <div className="font-mono text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-h-48 overflow-auto whitespace-pre-wrap">
                      {cmd.command}
                    </div>
                  </div>
                  <div className="ml-4">
                    {cmd.status === 'pending' && (
                      <ArrowPathIcon className="w-5 h-5 text-yellow-500 animate-spin" />
                    )}
                    {cmd.status === 'success' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    )}
                    {cmd.status === 'error' && (
                      <XCircleIcon className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                {cmd.status !== 'pending' && (
                  <div className={`mt-3 text-sm ${cmd.status === 'error' ? 'text-red-500' : 'text-green-500'
                    }`}>
                    {cmd.table ? (() => {
                      const maxRowsBeforeScroll = 10;
                      const approxRowHeightPx = 44;
                      const numRows = cmd.table.rows?.length || 0;
                      const shouldLimitHeight = numRows > maxRowsBeforeScroll;
                      const maxHeight = shouldLimitHeight ? `${maxRowsBeforeScroll * approxRowHeightPx}px` : 'auto';

                      return (
                        <div className="border rounded box-border w-[calc(100%-35px)]" style={{ maxWidth: '100%' }}>
                          {/* Vertical scroller when rows exceed maxHeight */}
                          <div className="w-full overflow-auto " style={{ maxHeight }}>
                            {/* Horizontal scroller for wide tables */}
                            <div className="w-full overflow-x-auto " style={{ maxWidth: '100%' }}>
                              <table className="table-auto text-sm min-w-max border-collapse" style={{ tableLayout: 'auto' }}>
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                  <tr>
                                    {cmd.table.columns.map((c) => (
                                      <th key={c} className="px-2 py-1 text-left align-top bg-gray-50 whitespace-nowrap">{c}</th>
                                    ))}
                                  </tr>
                                </thead>

                                <tbody>
                                  {cmd.table.rows.map((r, i) => (
                                    <tr key={i} className="border-t align-top">
                                      {r.map((cell: any, ci: number) => (
                                        <td key={ci} title={String(cell)} className="px-2 py-1 align-top whitespace-nowrap">
                                          {String(cell)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })() : (cmd.result || cmd.error)}

                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  {new Date(cmd.timestamp).toLocaleString()}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-12">
            <CommandLineIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No commands yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start by entering a natural language command above
            </p>
          </div>
        )}
      </div>
    </div>
  );
};