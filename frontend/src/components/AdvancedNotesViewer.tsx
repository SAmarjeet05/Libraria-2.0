// AdvancedNotesViewer.tsx
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from "../hooks/useAuth";

/* NotesViewerOverlay props */
type NotesViewerOverlayProps = {
  visible: boolean;
  onClose: () => void;
  pdfUrl: string;
};

export default function NotesViewerOverlay({ visible, onClose, pdfUrl }: NotesViewerOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-2 md:p-6 flex items-center justify-center pointer-events-none">
      <div className="relative w-full max-w-[1400px] h-[90vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-xl flex pointer-events-auto">

        {/* Close button moved into the PDF container below so it appears on top of the file viewer */}

        <div className="flex w-full h-full">
          {/* Left: Chrome PDF Viewer (full width on mobile) */}
          <div className="w-full md:w-[70%] border-r border-gray-200 dark:border-gray-700 overflow-hidden p-0 relative">
            <ChromePdfViewer pdfUrl={pdfUrl} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close viewer"
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center transition-transform duration-150 hover:scale-105 ring-1 ring-gray-200 dark:ring-gray-700"
              style={{ zIndex: 2147483700 }}
            >
              <span className="text-lg">✕</span>
            </button>
          </div>

          {/* Right: Chat (hidden on small screens) */}
          <div className="hidden md:block md:w-[30%] bg-gray-50 dark:bg-gray-800 p-4">
            <ChatPanel />
          </div>
        </div>

      </div>
    </div>
  );
}


/* ------------------------------------------------------------
   CHROME NATIVE PDF VIEWER + SELECTION OVERLAY
-------------------------------------------------------------*/

function ChromePdfViewer({ pdfUrl }: { pdfUrl: string }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;

    function handleMouseUp(e: MouseEvent) {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";
      if (!text) return;

      window.dispatchEvent(
        new CustomEvent("note-text-selected", {
          detail: {
            selectedText: text,
            x: e.clientX,
            y: e.clientY,
          },
        })
      );
    }

    overlay?.addEventListener("mouseup", handleMouseUp);
    return () => overlay?.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="relative w-full h-full">

      {/* Chrome built-in viewer */}
      <iframe
        src={`/api/notes/proxy-mega?url=${encodeURIComponent(pdfUrl)}`}
        className="w-full h-full border-0"
        style={{ zIndex: 1 }}
      />

      {/* Transparent overlay kept non-interactive so iframe controls and scroll work */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-transparent"
        style={{
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />

      {/* (No extra canvas/text-layer here — Chrome iframe handles rendering) */}
    </div>
  );
}


/* ------------------------------------------------------------
   CHAT PANEL + POPUP (unchanged)
-------------------------------------------------------------*/

function ChatPanel() {
  type Flashcard = { question: string; answer: string };
  type Message = { role: "user" | "assistant"; text: string; flashcards?: Flashcard[] };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [selectionPopup, setSelectionPopup] =
    useState<{ text: string; x: number; y: number } | null>(null);
  const [streaming, setStreaming] = useState<boolean>(false);
  // true once we receive the first non-empty chunk from the stream
  const [receivedFirstChunk, setReceivedFirstChunk] = useState<boolean>(false);
  // track the action type currently being streamed (e.g., "flashcards")
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<{
        selectedText: string;
        x: number;
        y: number;
      }>;

      const { selectedText, x, y } = ce.detail;
      setSelectionPopup({ text: selectedText, x, y });
    }

    window.addEventListener("note-text-selected", handler as EventListener);
    return () =>
      window.removeEventListener("note-text-selected", handler as EventListener);
  }, []);

  const { token: authToken } = useAuth() as any;

  async function sendLLMAction(type: string, customText?: string) {
    const textToSend = customText ?? input;
    // prevent starting a new prompt while one is already running
    if (streaming) return;
    if (!textToSend.trim()) return;

    // append user's message
    setMessages((m) => [...m, { role: "user", text: textToSend }]);
    // append empty assistant placeholder that we'll stream into
    setMessages((m) => [...m, { role: "assistant", text: "" }]);
    setInput("");
    setSelectionPopup(null);

    setStreaming(true);
    setReceivedFirstChunk(false);
    setCurrentAction(type);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // prefer token from hook, fallback to localStorage saved auth
      let usedToken = authToken;
      if (!usedToken) {
        try {
          const saved = localStorage.getItem('libraria_auth');
          if (saved) {
            const parsed = JSON.parse(saved);
            usedToken = parsed?.token || parsed?.access_token || null;
          }
        } catch (e) { /* ignore */ }
      }
      if (usedToken) headers['Authorization'] = `Bearer ${usedToken}`;

      // Prepare response reference. For flashcards we'll call the non-streaming endpoint
      // and return early; otherwise we'll set `res` to the streaming chat response below.
      let res: Response | undefined = undefined;
      // If requesting flashcards, call the dedicated non-streaming endpoint
      if (type === 'flashcards' || type === 'flashcard') {
        const res = await fetch('/api/notes/flashcard', {
          method: 'POST',
          headers,
          body: JSON.stringify({ text: textToSend }),
        });

        if (!res.ok) {
          const errText = await res.text();
          setMessages((m) => [...m, { role: 'assistant', text: `Error: ${errText}` }]);
          setStreaming(false);
          setCurrentAction(null);
          return;
        }

        const json = await res.json();
        // If backend returned structured cards
        if (json && Array.isArray(json.cards)) {
          setMessages((m) => {
            const copy = [...m];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === 'assistant') {
                copy[i] = { ...copy[i], text: '', flashcards: json.cards };
                break;
              }
            }
            return copy;
          });
        } else if (json && Array.isArray(json)) {
          // Some endpoints may return the array directly
          setMessages((m) => {
            const copy = [...m];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === 'assistant') {
                copy[i] = { ...copy[i], text: '', flashcards: json };
                break;
              }
            }
            return copy;
          });
        } else if (json && json.cards) {
          setMessages((m) => [...m, { role: 'assistant', text: String(json.cards) }]);
        } else if (json && json.text) {
          setMessages((m) => {
            const copy = [...m];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === 'assistant') {
                copy[i] = { ...copy[i], text: String(json.text) };
                break;
              }
            }
            return copy;
          });
        } else {
          // Fallback: show raw JSON
          setMessages((m) => {
            const copy = [...m];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === 'assistant') {
                copy[i] = { ...copy[i], text: JSON.stringify(json, null, 2) };
                break;
              }
            }
            return copy;
          });
        }

        setStreaming(false);
        setCurrentAction(null);
        return;
      }

      // Non-flashcard path: call streaming chat endpoint
      res = await fetch('/api/notes/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: textToSend, action: type }),
      });

      if (!res.ok) {
        const errText = await res.text();
        setMessages((m) => [...m, { role: "assistant", text: `Error: ${errText}` }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        const full = await res.text();
        setMessages((m) => [...m, { role: "assistant", text: full }]);
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (value) {
          let chunk = decoder.decode(value);
          // Strip common braille spinner glyphs aggressively before further processing.
          // This removes sequences like: ⠙ ⠹ ⠼ ... which sometimes appear in streamed output.
          const spinnerChars = /[⠋⠙⠚⠞⠖⠦⠴⠲⠳⠓⠏⠹⠸⠼]/g;
          chunk = chunk.replace(spinnerChars, '');
          // Skip backend pull logs or notices that are prefixed or relate to pulling models
          const lowChunk = chunk.toLowerCase();
          if (lowChunk.startsWith('[pull]') || lowChunk.includes('attempting') && lowChunk.includes('pull')) {
            continue;
          }
          // If the chunk is empty after removing spinner chars, skip it.
          if (!chunk || !chunk.trim()) continue;

          // When the first useful chunk arrives mark receivedFirstChunk so any loader hides
          if (!receivedFirstChunk && chunk.trim().length > 0) {
            setReceivedFirstChunk(true);
          }

          setMessages((m) => {
            const copy = [...m];
            // update the last assistant message
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === 'assistant') {
                copy[i] = { role: 'assistant', text: (copy[i].text || '') + chunk };
                break;
              }
            }
            return copy;
          });
        }
        done = d;
      }

    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: "Error receiving response" }]);
    } finally {
      // After streaming finishes, if this was a flashcards action, attempt to parse JSON
      if (currentAction === 'flashcards') {
        setMessages((m) => {
          const copy = [...m];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === 'assistant') {
              const text = copy[i].text || '';
              // Try to extract JSON array from the assistant text
              let parsed: any = null;
              try {
                const start = text.indexOf('[');
                const end = text.lastIndexOf(']');
                const candidate = (start >= 0 && end > start) ? text.slice(start, end + 1) : text;
                parsed = JSON.parse(candidate);
              } catch (e) {
                parsed = null;
              }

              if (Array.isArray(parsed) && parsed.length > 0) {
                // normalize items to { question, answer }
                const cards: Flashcard[] = parsed.map((it: any) => {
                  const q = it.question || it.front || it.q || it.prompt || it.term || it.name || '';
                  const a = it.answer || it.back || it.a || it.ans || it.definition || it.definition_text || '';
                  return { question: String(q), answer: String(a) };
                });
                copy[i] = { ...copy[i], text: '', flashcards: cards };
              }
              break;
            }
          }
          return copy;
        });
      }

      setStreaming(false);
      setReceivedFirstChunk(false);
      setCurrentAction(null);
    }
  }

  function FlashcardsView({ cards }: { cards: { question: string; answer: string }[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const palettes = [
      'from-pink-500 to-indigo-500',
      'from-emerald-400 to-teal-500',
      'from-yellow-400 to-orange-500',
      'from-sky-400 to-indigo-400',
      'from-violet-400 to-pink-400',
    ];

    return (
      <div className="space-y-3">
        {cards.map((c, idx) => {
          const pal = palettes[idx % palettes.length];
          return (
            <div key={idx} className="rounded-lg overflow-hidden shadow-md">
              <div className={`p-3 bg-gradient-to-r ${pal} flex items-center justify-between`}>
                <div className="text-white font-semibold text-sm md:text-base">{c.question}</div>
                <button
                  aria-expanded={openIndex === idx}
                  onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                  className="text-xs md:text-sm bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full border border-white/30 hover:scale-105 transition-transform"
                >
                  {openIndex === idx ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="p-3 bg-white dark:bg-gray-700">
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  {openIndex === idx ? (
                    <div className="prose prose-sm dark:prose-invert">{c.answer}</div>
                  ) : (
                    <div className="text-sm text-gray-600 dark:text-gray-300">Tap <span className="font-medium">Show</span> to reveal the answer</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">

      {/* Messages */}
      <div className="flex-1 overflow-auto space-y-3 mb-3 p-2">
        {/* Welcome card shown only when there are no messages yet */}
        {messages.length === 0 && !streaming && (
          <div className="w-full h-full flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
              <div className="bg-gradient-to-r from-pink-500 via-indigo-500 to-yellow-400 bg-clip-text text-transparent text-2xl md:text-3xl font-extrabold">
                Welcome to Notes Assistant
              </div>
              <div className="mt-3 text-sm md:text-base text-gray-600 dark:text-gray-300">
                Select text in the PDF, then use the <span className="font-semibold">Summarize</span>, <span className="font-semibold">Explain</span>, <span className="font-semibold">Ask</span> or <span className="font-semibold">Flashcards</span> buttons to get instant help — responses stream in as they are generated.
              </div>
              <div className="mt-4">
                <div className="inline-block px-3 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-xs font-medium">
                  Tip: try selecting a paragraph
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              m.role === "user"
                ? "bg-blue-100 dark:bg-blue-900"
                : "bg-white dark:bg-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 break-words whitespace-pre-wrap">
                {m.role === 'assistant' ? (
                  // render flashcards UI when present, otherwise render assistant text as markdown
                  m.flashcards && m.flashcards.length > 0 ? (
                    <FlashcardsView cards={m.flashcards} />
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text || ''}</ReactMarkdown>
                  )
                ) : (
                  // justify the user's question text for better readability
                  <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{m.text}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* (No pre-response global loader — we wait until the assistant begins streaming) */}

      {/* Feature buttons (appear only when input has content) */}
      <div
        className={
          `mb-2 px-2 flex gap-2 items-center transition-all duration-200 ease-out transform ` +
          (input.trim().length > 0
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none")
        }
        aria-hidden={input.trim().length === 0}
      >
        <button
          disabled={streaming}
          className={`px-4 py-2 rounded-full text-sm font-medium text-white shadow-md transform transition-transform duration-150 hover:scale-105 ${streaming ? 'opacity-60 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
          onClick={() => {
            sendLLMAction("summarize", input);
            setInput("");
          }}
          title="Summarize selected text"
        >
          Summarize
        </button>

        <button
          disabled={streaming}
          className={`px-4 py-2 rounded-full text-sm font-medium text-white shadow-md transform transition-transform duration-150 hover:scale-105 ${streaming ? 'opacity-60 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-400 to-yellow-600'}`}
          onClick={() => {
            sendLLMAction("explain", input);
            setInput("");
          }}
          title="Explain selected text"
        >
          Explain
        </button>

        <button
          disabled={streaming}
          className={`px-4 py-2 rounded-full text-sm font-medium text-white shadow-md transform transition-transform duration-150 hover:scale-105 ${streaming ? 'opacity-60 cursor-not-allowed' : 'bg-gradient-to-r from-sky-400 to-sky-600'}`}
          onClick={() => {
            sendLLMAction("ask", input);
            setInput("");
          }}
          title="Ask a question about the text"
        >
          Ask
        </button>

        <button
          disabled={streaming}
          className={`px-4 py-2 rounded-full text-sm font-medium text-white shadow-md transform transition-transform duration-150 hover:scale-105 ${streaming ? 'opacity-60 cursor-not-allowed' : 'bg-gradient-to-r from-violet-400 to-violet-600'}`}
          onClick={() => {
            sendLLMAction("flashcards", input);
            setInput("");
          }}
          title="Generate flashcards"
        >
          Flashcards
        </button>
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendLLMAction("ask");
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 rounded bg-white dark:bg-gray-700"
          placeholder="Ask something..."
          disabled={streaming}
        />
        <button
          type="submit"
          disabled={streaming}
          className={`px-3 text-white rounded ${streaming ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600'}`}>
          Send
        </button>
      </form>

      {/* Floating popup */}
      {selectionPopup && (
        <div
          className="bg-white dark:bg-gray-700 shadow rounded p-2 flex gap-2 z-50"
          style={{
            position: "absolute",
            top: selectionPopup.y,
            left: selectionPopup.x,
            transform: "translateY(-40px)",
          }}
        >
          <button
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded"
            onClick={() => sendLLMAction("summarize", selectionPopup.text)}
          >
            Summarize
          </button>

          <button
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded"
            onClick={() => sendLLMAction("explain", selectionPopup.text)}
          >
            Explain
          </button>

          <button
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded"
            onClick={() => sendLLMAction("ask", selectionPopup.text)}
          >
            Ask
          </button>
        </div>
      )}
    </div>
  );
}

