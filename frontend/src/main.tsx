import { useState } from "react";
import { createRoot } from "react-dom/client";
import { readHashRoute } from "./router/routes";
import { AppShell } from "./components/layout/AppShell";
import { FixturesPage } from "./pages/FixturesPage";
import { CuesPage } from "./pages/CuesPage";
import { TimelinePage } from "./pages/TimelinePage";
import { PreviewPage } from "./pages/PreviewPage";
import "./styles.css";

function App() {
  const [route, setRoute] = useState<string>(() => readHashRoute());

  return (
    <AppShell current={route} onNavigate={setRoute}>
      {route === "/fixtures" ? <FixturesPage /> : null}
      {route === "/cues" ? <CuesPage /> : null}
      {route === "/timeline" ? <TimelinePage /> : null}
      {route === "/preview" ? <PreviewPage /> : null}
      {!["/fixtures", "/cues", "/timeline", "/preview"].includes(route) ? (
        <FixturesPage />
      ) : null}
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
