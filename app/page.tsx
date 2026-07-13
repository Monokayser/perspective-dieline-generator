"use client";

import dynamic from "next/dynamic";

// The workbench is intentionally a browser-only application. Keeping the
// geometry, IndexedDB, image workers, and OpenCV dependency out of the edge
// renderer also guarantees that a first request can always return the shell.
const Workbench = dynamic(
  () => import("../src/components/Workbench").then((module) => module.Workbench),
  {
    ssr: false,
    loading: () => (
      <main className="boot-screen" aria-busy="true" aria-live="polite">
        <div>
          <strong>Perspective Dieline Generator</strong>
          <span>Preparing the local-first workbench…</span>
        </div>
      </main>
    ),
  },
);

export default function Home() {
  return <Workbench />;
}
