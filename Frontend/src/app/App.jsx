import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function App() {
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [users, setUsers] = useState([]);

  const [userName, setUserName] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || "";
  });

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  useEffect(() => {
    if (!userName || !editor) {
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    bindingRef.current?.destroy();
    providerRef.current?.destroy();

    const provider = new SocketIOProvider("/", "monaco-room", ydoc, {
      autoConnect: true,
    });

    provider.awareness.setLocalStateField("user", { name: userName });

    const states = Array.from(provider.awareness.getStates().values());
    setUsers(
      states.filter((state) => state?.user?.name).map((state) => state.user),
    );

    const handleAwarenessChange = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(
        states.filter((state) => state?.user?.name).map((state) => state.user),
      );
    };

    provider.awareness.on("change", handleAwarenessChange);

    bindingRef.current = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      provider.awareness,
    );
    providerRef.current = provider;
    handleAwarenessChange();

    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
      provider.awareness.off("change", handleAwarenessChange);
      provider.awareness.setLocalStateField("user", null);
      provider.destroy();
      providerRef.current = null;
    };
  }, [editor, userName, ydoc, yText]);

  const handleMount = (mountedEditor) => {
    setEditor(mountedEditor);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmedName = e.currentTarget.userName.value.trim();
    if (!trimmedName) {
      return;
    }

    setUserName(trimmedName);
    const nextUrl = `?username=${encodeURIComponent(trimmedName)}`;
    window.history.pushState({}, "", nextUrl);
  };

  if (!userName) {
    return (
      <main className="h-screen w-full bg-gray-950 flex items-center justify-center">
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your name"
            className="p-2 rounded-lg bg-gray-500 text-white"
            name="userName"
            required
          />
          <button
            className="bg-blue-500 text-white p-2 rounded-lg"
            type="submit"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
      <aside className="h-full w-1/4 bg-white rounded-lg">
        <h2 className="text-lg font-bold p-4 border-b">Users</h2>
        <ul className="p-4">
          {users.map((user, index) => (
            <li
              key={`${user.name}-${index}`}
              className="p-2 border-b text-white bg-gray-800"
            >
              {user.name}
            </li>
          ))}
        </ul>
      </aside>
      <section className="w-3/4 rounded-lg bg-neutral-800 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// some comment"
          theme="vs-dark"
          onMount={handleMount}
        />
      </section>
    </main>
  );
}

export default App;
