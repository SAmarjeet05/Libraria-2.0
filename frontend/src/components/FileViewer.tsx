import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
// Use the full AdvancedNotesViewer implementation
import NotesViewerOverlay from "./AdvancedNotesViewer";

interface FileViewerProps {
  url: string;
  type?: string;
  role: "admin" | "user";
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ url, type, role, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("id", "libraria-fileviewer-portal");

    Object.assign(el.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: String(2147483647),
      pointerEvents: "auto",
    });

    document.body.appendChild(el);
    containerRef.current = el;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setMounted(true);

    return () => {
      try {
        if (containerRef.current && containerRef.current.parentNode) {
          containerRef.current.parentNode.removeChild(containerRef.current);
        }
      } catch {}
      containerRef.current = null;
      document.body.style.overflow = prevOverflow || "auto";
      setMounted(false);
    };
  }, []);

  if (!url || !mounted || !containerRef.current) return null;

  const viewerType = (type || "").toLowerCase();

  // --------------------------------------------------
  // USER VIEW → load the advanced 70:30 viewer
  // --------------------------------------------------
  if (role === "user") {
    return createPortal(
      <NotesViewerOverlay visible={true} onClose={onClose} pdfUrl={url} />,
      containerRef.current
    );
  }

  // --------------------------------------------------
  // ADMIN VIEW → load your simple viewer
  // --------------------------------------------------
  const basicViewer = (
    <div
      className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
          style={{ zIndex: 2147483647 }}
        >
          ✕
        </button>

        {/* BASIC VIEWER CONTENT */}
        {viewerType === "pdf" ? (
          <iframe src={url} className="w-full h-full" title="PDF Viewer" />
        ) : viewerType.startsWith("image") ? (
          <img src={url} alt="preview" className="w-full h-full object-contain" />
        ) : (
          <iframe
            className="w-full h-full"
            title="Document Viewer"
            src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
              url
            )}`}
          ></iframe>
        )}
      </div>
    </div>
  );

  return createPortal(basicViewer, containerRef.current);
};

export default FileViewer;
