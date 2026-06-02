import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useAuthStore } from "../store/authStore.js";
import { colorForUser } from "../utils/codeTemplates.js";

const PUSH_DEBOUNCE_MS = 250;

export default function CollabWhiteboard({ sessionId }) {
  const { token, user } = useAuthStore();
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [connStatus, setConnStatus] = useState("connecting");

  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const yElementsMapRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const versionsRef = useRef(new Map());
  const syncedRef = useRef(false);
  const debounceRef = useRef(null);
  const pendingElementsRef = useRef(null);

  useEffect(() => {
    if (!sessionId || !token) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsUrl = import.meta.env.VITE_API_URL.replace(/^http/, "ws") + "/yjs";
    const provider = new WebsocketProvider(wsUrl, sessionId, ydoc, {
      params: { token, ns: "whiteboard" },
    });
    providerRef.current = provider;

    const yMap = ydoc.getMap("elements");
    yElementsMapRef.current = yMap;

    provider.on("status", (event) => setConnStatus(event.status));
    provider.on("sync", (isSynced) => {
      if (isSynced) syncedRef.current = true;
    });

    provider.awareness.setLocalStateField("user", {
      name: user?.name || "anon",
      color: colorForUser(user?.id),
      userId: user?.id,
    });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      yElementsMapRef.current = null;
      versionsRef.current = new Map();
      syncedRef.current = false;
    };
  }, [sessionId, token, user?.id, user?.name]);

  useEffect(() => {
    if (!excalidrawAPI || !yElementsMapRef.current) return;
    const yMap = yElementsMapRef.current;

    function pullFromYjs() {
      const order = yMap.get("__order");
      const ids = order ? order.toArray() : [];
      const elements = ids.map((id) => yMap.get(id)).filter(Boolean);

      applyingRemoteRef.current = true;
      try {
        excalidrawAPI.updateScene({ elements });
        versionsRef.current = new Map(elements.map((el) => [el.id, el.version]));
      } finally {
        // longer delay so excalidraw's own re-render-onChange settles
        setTimeout(() => {
          applyingRemoteRef.current = false;
        }, 200);
      }
    }

    pullFromYjs();
    yMap.observeDeep(pullFromYjs);
    return () => yMap.unobserveDeep(pullFromYjs);
  }, [excalidrawAPI]);

  function pushNow() {
    const elements = pendingElementsRef.current;
    pendingElementsRef.current = null;
    if (!elements) return;

    const yMap = yElementsMapRef.current;
    const ydoc = ydocRef.current;
    if (!yMap || !ydoc) return;

    const versions = versionsRef.current;
    const changedElements = [];
    for (const el of elements) {
      const prev = versions.get(el.id);
      if (prev === undefined || prev !== el.version) {
        changedElements.push(el);
      }
    }

    const currentIds = new Set(elements.map((e) => e.id));
    let hadDeletion = false;
    for (const id of versions.keys()) {
      if (!currentIds.has(id)) {
        hadDeletion = true;
        break;
      }
    }

    if (changedElements.length === 0 && !hadDeletion) return;

    ydoc.transact(() => {
      let order = yMap.get("__order");
      if (!order) {
        order = new Y.Array();
        yMap.set("__order", order);
      }

      for (const el of changedElements) {
        yMap.set(el.id, JSON.parse(JSON.stringify(el)));
        versions.set(el.id, el.version);
      }

      const currentIdArr = elements.map((e) => e.id);
      const currentIdSet = new Set(currentIdArr);
      const orderArr = order.toArray();

      for (let i = orderArr.length - 1; i >= 0; i--) {
        if (!currentIdSet.has(orderArr[i])) {
          order.delete(i, 1);
          yMap.delete(orderArr[i]);
          versions.delete(orderArr[i]);
        }
      }

      const existingInOrder = new Set(order.toArray());
      for (const id of currentIdArr) {
        if (!existingInOrder.has(id)) {
          order.push([id]);
        }
      }
    });
  }

  const handleChange = useCallback((elements) => {
    if (applyingRemoteRef.current) return;
    if (!syncedRef.current) return;

    // empty-on-mount guard
    if (elements.length === 0 && versionsRef.current.size === 0) return;

    pendingElementsRef.current = elements;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushNow();
      debounceRef.current = null;
    }, PUSH_DEBOUNCE_MS);
  }, []);

  const initialData = useMemo(
    () => ({
      elements: [],
      appState: {
        viewBackgroundColor: "#0a0a0b",
        currentItemStrokeColor: "#e4e4e7",
        currentItemBackgroundColor: "transparent",
        gridSize: null,
        theme: "dark",
      },
    }),
    []
  );

  return (
    <div className="border border-zinc-800 rounded-md overflow-hidden bg-zinc-900 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950">
        <span className="text-xs text-zinc-400">whiteboard</span>
        <span className={`flex items-center gap-1.5 text-xs ${connStatus === "connected" ? "text-emerald-400" : "text-zinc-500"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connStatus === "connected" ? "bg-emerald-400" : "bg-zinc-500"}`} />
          {connStatus}
        </span>
      </div>
      <div className="h-[560px] excalidraw-wrapper">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialData}
          onChange={handleChange}
          theme="dark"
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveAsImage: true,
              export: false,
              clearCanvas: true,
              changeViewBackgroundColor: false,
            },
          }}
        />
      </div>
    </div>
  );
}
