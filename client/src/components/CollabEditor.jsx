import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { LANGUAGES, STARTER_CODE, colorForUser } from "../utils/codeTemplates.js";
import { useAuthStore } from "../store/authStore.js";

export default function CollabEditor({ sessionId, onQuestionSlugChange, onPickQuestion }) {
  const { token, user } = useAuthStore();
  const [language, setLanguage] = useState("python");
  const [connStatus, setConnStatus] = useState("connecting");
  const [peerCount, setPeerCount] = useState(0);
  const [questionSlug, setQuestionSlug] = useState(null);

  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ytextRef = useRef(null);
  const ymetaRef = useRef(null);
  const styleElRef = useRef(null);

  useEffect(() => {
    if (!sessionId || !token) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsUrl = import.meta.env.VITE_API_URL.replace(/^http/, "ws") + "/yjs";
    const provider = new WebsocketProvider(wsUrl, sessionId, ydoc, {
      params: { token },
    });
    providerRef.current = provider;

    const ytext = ydoc.getText("code");
    ytextRef.current = ytext;

    const ymeta = ydoc.getMap("meta");
    ymetaRef.current = ymeta;

    provider.on("status", (event) => setConnStatus(event.status));

    provider.on("sync", (isSynced) => {
      if (isSynced && ytext.length === 0) {
        ydoc.transact(() => {
          ytext.insert(0, STARTER_CODE.python);
          if (!ymeta.get("language")) ymeta.set("language", "python");
        });
      }
      const lang = ymeta.get("language");
      if (lang) setLanguage(lang);
      const slug = ymeta.get("questionSlug");
      setQuestionSlug(slug || null);
      onQuestionSlugChange?.(slug || null);
    });

    ymeta.observe(() => {
      const lang = ymeta.get("language");
      if (lang) setLanguage(lang);
      const slug = ymeta.get("questionSlug");
      setQuestionSlug(slug || null);
      onQuestionSlugChange?.(slug || null);
    });

    provider.awareness.setLocalStateField("user", {
      name: user?.name || "anon",
      color: colorForUser(user?.id),
      userId: user?.id,
    });

    function updatePeerCount() {
      setPeerCount(provider.awareness.getStates().size);
    }
    provider.awareness.on("change", updatePeerCount);
    updatePeerCount();

    return () => {
      provider.awareness.off("change", updatePeerCount);
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      ytextRef.current = null;
      ymetaRef.current = null;
      if (styleElRef.current) {
        styleElRef.current.remove();
        styleElRef.current = null;
      }
    };
  }, [sessionId, token, user?.id, user?.name, onQuestionSlugChange]);

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const ytext = ytextRef.current;
    const provider = providerRef.current;
    if (!ytext || !provider) return;

    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );

    const style = document.createElement("style");
    styleElRef.current = style;
    document.head.appendChild(style);

    function refreshCursorStyles() {
      const states = Array.from(provider.awareness.getStates().entries());
      const css = states
        .map(([clientId, state]) => {
          const u = state.user;
          if (!u) return "";
          return `
            .yRemoteSelection-${clientId} { background-color: ${u.color}55; }
            .yRemoteSelectionHead-${clientId} { border-color: ${u.color}; }
            .yRemoteSelectionHead-${clientId}::after { content: "${u.name}"; background-color: ${u.color}; color: #fff; padding: 0 4px; border-radius: 2px; font-size: 10px; }
          `;
        })
        .join("\n");
      style.textContent = css;
    }
    refreshCursorStyles();
    provider.awareness.on("change", refreshCursorStyles);
  }

  function handleLanguageChange(e) {
    const newLang = e.target.value;
    const ydoc = ydocRef.current;
    const ytext = ytextRef.current;
    const ymeta = ymetaRef.current;
    if (!ydoc || !ytext || !ymeta) return;

    const replaceTemplate =
      ytext.toString().trim() === (STARTER_CODE[language] || "").trim();

    ydoc.transact(() => {
      ymeta.set("language", newLang);
      if (replaceTemplate) {
        ytext.delete(0, ytext.length);
        ytext.insert(0, STARTER_CODE[newLang] || "");
      }
    });
  }

  function handleResetTemplate() {
    if (!confirm("replace all code with the starter template?")) return;
    const ydoc = ydocRef.current;
    const ytext = ytextRef.current;
    if (!ydoc || !ytext) return;
    ydoc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, STARTER_CODE[language] || "");
    });
  }

  // expose a way for parent to set the question slug
  // we do this by listening to a prop change, see Session.jsx
  useEffect(() => {
    if (typeof onPickQuestion !== "function") return;
    onPickQuestion(({ slug }) => {
      const ymeta = ymetaRef.current;
      const ydoc = ydocRef.current;
      if (!ymeta || !ydoc) return;
      ydoc.transact(() => {
        ymeta.set("questionSlug", slug);
      });
    });
  }, [onPickQuestion]);

  const monacoLang =
    LANGUAGES.find((l) => l.value === language)?.monaco || "plaintext";

  return (
    <div className="border border-zinc-800 rounded overflow-hidden bg-zinc-900">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="px-2 py-1 text-sm bg-zinc-900 border border-zinc-800 rounded text-zinc-200"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <button
            onClick={handleResetTemplate}
            className="text-xs text-zinc-400 hover:text-zinc-100 px-2 py-1 border border-zinc-800 rounded"
          >
            reset to template
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className={`flex items-center gap-1.5 ${connStatus === "connected" ? "text-green-400" : "text-zinc-500"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connStatus === "connected" ? "bg-green-400" : "bg-zinc-500"}`} />
            {connStatus}
          </span>
          <span className="text-zinc-500">{peerCount} in editor</span>
        </div>
      </div>
      <Editor
        height="500px"
        language={monacoLang}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          padding: { top: 12 },
          tabSize: 4,
          insertSpaces: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
