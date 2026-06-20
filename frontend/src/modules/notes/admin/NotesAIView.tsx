import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CommandLineIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { queryNotesAI, notesLogEvent, notesWelcome } from '../../../services/notesAiService';
import { useAuth } from '../../../hooks/useAuth';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';

export const NotesAIView: React.FC = () => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const auth = useAuth();
  const { isSupported: micSupported, isListening: micListening, transcript: micTranscript, interimTranscript: micInterim, startListening, stopListening } = useSpeechRecognition();
  const committedBeforeListeningRef = React.useRef('');

  useEffect(() => {
    if (micTranscript && micTranscript.trim()) {
      setInput(prev => {
        const base = (prev && prev.trim()) ? prev + ' ' : prev || '';
        const next = base + micTranscript.trim();
        committedBeforeListeningRef.current = next;
        return next;
      });
    }
  }, [micTranscript]);

  useEffect(() => {
    if (micInterim !== undefined && micListening) {
      const base = committedBeforeListeningRef.current || '';
      const display = micInterim && micInterim.trim() ? (base ? base + ' ' + micInterim.trim() : micInterim.trim()) : base;
      setInput(display);
    }
  }, [micInterim, micListening]);

  useEffect(() => {
    if (!micListening) {
      const final = micTranscript && micTranscript.trim();
      const interim = micInterim && micInterim.trim();
      if (final) {
        setInput(prev => {
          if (prev && prev.includes(final)) return prev;
          const base = (prev && prev.trim()) ? prev + ' ' : prev || '';
          const next = base + final;
          committedBeforeListeningRef.current = next;
          return next;
        });
      } else if (interim) {
        setInput(prev => {
          const base = (prev && prev.trim()) ? prev + ' ' : prev || '';
          const next = base + interim;
          committedBeforeListeningRef.current = next;
          return next;
        });
      } else {
        if (committedBeforeListeningRef.current) setInput(committedBeforeListeningRef.current);
      }
    }
  }, [micListening, micTranscript, micInterim]);

  useEffect(() => {
        const loadHistory = async () => {
      try {
        // fetch notes_ai_logs (admin-only)
        // If we have an authenticated admin, request logs only for that admin's id
        const actorId = (auth && auth.isAuthenticated && auth.user && auth.user.role === 'Admin') ? auth.user.id : undefined;
        const url = actorId ? `/api/notes/ai/logs?actor_type=admin&actor_id=${actorId}` : '/api/notes/ai/logs?actor_type=admin';
        const res = await fetch(url);
        if (!res.ok) return;
        const logs = await res.json();
        if (!Array.isArray(logs)) return;

        // Map logs into the UI history shape used by this component
        const mapped = logs.map((l: any) => {
          const raw = l.raw_output_json || {};
          const exec = l.execution_result_json || null;
          // Prefer the explicit `user_input` stored in the DB; fall back to prompt/operation
          let inputText = l.user_input || raw.prompt || l.operation || '';
          let commandText = raw.model_output || raw.sanitized_sql || l.operation || '';
          let resultData: any = null;
          let resultSummary = '';
          try {
            if (exec && exec.attempts && Array.isArray(exec.attempts) && exec.attempts.length > 0) {
              // prefer the last attempt that has a result
              const lastWithResult = exec.attempts.slice().reverse().find((a: any) => a.result);
              const pick = lastWithResult || exec.attempts[exec.attempts.length - 1];
              if (pick && pick.result) {
                resultData = pick.result;
                if (Array.isArray(resultData.rows) && Array.isArray(resultData.columns)) {
                  resultSummary = `Returned ${resultData.rows.length} rows`;
                } else if (resultData.rowcount !== undefined) {
                  resultSummary = `Affected rows: ${resultData.rowcount}`;
                } else {
                  resultSummary = JSON.stringify(resultData);
                }
              }
            }
          } catch (e) {
            resultSummary = '';
          }

          return {
            id: l.id,
            input: inputText,
            command: commandText,
            status: (l.status === 'success') ? 'success' : (l.status === 'error' ? 'error' : 'success'),
            timestamp: l.created_at,
            resultData: resultData,
            result: resultSummary || l.status
          };
        });

        setHistory(mapped);
      } catch (e) {
        // ignore
      }
    };
    loadHistory();
  }, []);

  const processCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    if (micListening) stopListening();
    setIsProcessing(true);
    const commandId = Date.now().toString();
    const newCmd = { id: commandId, input: input.trim(), command: 'Processing...', status: 'pending', timestamp: new Date().toISOString(), sql: null, resultData: null };
    setHistory(prev => [newCmd, ...prev]);

    try {
      let actorType: 'user' | 'admin' | undefined = undefined;
      let actorId: string | undefined = undefined;
      if (auth && auth.isAuthenticated && auth.user && auth.user.role === 'Admin') {
        actorType = 'admin';
        actorId = auth.user.id;
      }
      const res = await queryNotesAI(input.trim(), actorType, actorId);
      const cmdText = res.sql ?? JSON.stringify(res);
      // store full result object so UI can render a table when available
      const resultData = res && res.result ? res.result : null;
      let cmdResult = '';
      if (resultData && Array.isArray(resultData.rows) && Array.isArray(resultData.columns)) {
        cmdResult = `Returned ${resultData.rows.length} rows`;
      } else if (resultData && resultData.rowcount !== undefined) {
        cmdResult = `Affected rows: ${resultData.rowcount}`;
      } else {
        cmdResult = JSON.stringify(resultData || res);
      }
      setHistory(prev => prev.map(h => h.id === commandId ? { ...h, command: cmdText, result: cmdResult, status: 'success', sql: cmdText, resultData } : h));
      await notesLogEvent('ai_query', cmdText, { success: true }, auth?.user?.role === 'Admin' ? 'admin' : 'user', auth?.user?.id);
    } catch (error: any) {
      setHistory(prev => prev.map(h => h.id === commandId ? { ...h, status: 'error', error: error?.message ?? 'Failed' } : h));
      await notesLogEvent('ai_query', input.trim(), { success: false, error: error?.message }, auth?.user?.role === 'Admin' ? 'admin' : 'user', auth?.user?.id);
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full box-border min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 dark:text-white">Notes AI Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400">Use natural language to query and analyze notes data</p>
      </div>

      <Card className="mb-8">
        <form onSubmit={processCommand} className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); if (micListening) committedBeforeListeningRef.current = e.target.value; }}
                placeholder="Ask about notes (e.g., 'Show top downloaded notes in subject Calculus')"
                className="w-full h-32 px-4 py-3 text-base text-gray-700 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                disabled={isProcessing}
              />
              <p className="mt-2 text-sm text-gray-500">Be specific. Admins can run powerful queries.</p>
            </div>
            <Button type="submit" disabled={!input.trim() || isProcessing} className="flex-shrink-0">
              {isProcessing ? (<><ArrowPathIcon className="w-5 h-5 mr-2 animate-spin"/>Processing...</>) : (<><CommandLineIcon className="w-5 h-5 mr-2"/>Execute</>)}
            </Button>
            {micSupported && (
              <button type="button" onClick={() => { if (micListening) { stopListening(); } else { committedBeforeListeningRef.current = input || ''; startListening(); } }} aria-pressed={micListening} title={micListening ? 'Stop listening' : 'Speak'} className={`ml-2 inline-flex items-center justify-center p-2 rounded-md border ${micListening ? 'bg-red-100 text-red-600 border-red-200' : 'bg-white text-gray-700 border-gray-200'} hover:opacity-90`}>
                <MicrophoneIcon className={`w-5 h-5 ${micListening ? 'animate-pulse' : ''}`} />
              </button>
            )}
          </div>
        </form>
      </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Command History</h2>

            {history.map((cmd, index) => (
              <motion.div
                key={cmd.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="mb-4">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">Input: {cmd.input}</p>
                        <div className="font-mono text-sm bg-gray-50 p-3 rounded-lg max-h-48 overflow-auto whitespace-pre-wrap dark:text-gray-600">
                          {cmd.command}
                        </div>
                      </div>
                      <div className="ml-4">
                        {cmd.status === 'pending' && <ArrowPathIcon className="w-5 h-5 text-yellow-500 animate-spin" />}
                        {cmd.status === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                        {cmd.status === 'error' && <XCircleIcon className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>

                    {cmd.status !== 'pending' && (
                      <div className={`mt-3 text-sm ${cmd.status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                        {cmd.resultData ? (() => {
                          const maxRowsBeforeScroll = 10;
                          const approxRowHeightPx = 44;
                          const numRows = cmd.resultData.rows?.length || 0;
                          const shouldLimitHeight = numRows > maxRowsBeforeScroll;
                          const maxHeight = shouldLimitHeight ? `${maxRowsBeforeScroll * approxRowHeightPx}px` : 'auto';

                          return (
                            <div className="border rounded box-border w-[calc(100%-35px)]" style={{ maxWidth: '100%' }}>
                              <div className="w-full overflow-auto" style={{ maxHeight }}>
                                <div className="w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
                                  <table className="table-auto text-sm min-w-max border-collapse" style={{ tableLayout: 'auto' }}>
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                      <tr>
                                        {cmd.resultData.columns.map((c: string) => (
                                          <th key={c} className="px-2 py-1 text-left align-top bg-gray-50 whitespace-nowrap">{c}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {cmd.resultData.rows.map((r: any, i: number) => (
                                        <tr key={i} className="border-t align-top">
                                          {r.map((cell: any, ci: number) => (
                                            <td key={ci} title={String(cell)} className="px-2 py-1 align-top whitespace-nowrap">{String(cell)}</td>
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

                    <div className="mt-3 text-xs text-gray-500">{new Date(cmd.timestamp).toLocaleString()}</div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {history.length === 0 && (
              <div className="text-center py-12">
                <CommandLineIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No commands yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Start by entering a natural language command above</p>
              </div>
            )}
          </div>
    </div>
  );
};

export default NotesAIView;
