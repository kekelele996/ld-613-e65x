import { useEffect } from "react";
import { routes, readHashRoute, DEFAULT_ROUTE } from "../../router/routes";
import { StatusBadge } from "../common/StatusBadge";

interface AppShellProps {
  current: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export function AppShell({ current, onNavigate, children }: AppShellProps) {
  // 监听浏览器前进/后退与首次进入的 hash。
  useEffect(() => {
    const sync = () => onNavigate(readHashRoute());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [onNavigate]);

  const go = (route: string) => {
    window.location.hash = route;
    onNavigate(route);
  };

  const active = routes.find((route) => route.route === current) ?? null;

  return (
    <div className="shell">
      <aside>
        <div className="brand">舞台灯光编排模拟器</div>
        <p className="brand-sub">stage-light · 巡演排练数据保存在本机 IndexedDB</p>
        <nav>
          {routes.map((route) => (
            <button
              key={route.route}
              className={current === route.route ? "active" : ""}
              onClick={() => go(route.route)}
            >
              {route.name}
            </button>
          ))}
        </nav>
        <button
          className="reload-btn"
          onClick={() => window.location.reload()}
          title="整页刷新：模拟重新打开页面，数据应从 IndexedDB 恢复"
        >
          ↻ 重新打开页面
        </button>
      </aside>
      <main className="page">
        <section className="page-head">
          <div>
            <p className="eyebrow">stage-light</p>
            <h1>{active?.name ?? DEFAULT_ROUTE}</h1>
          </div>
          <StatusBadge value="LOCAL_DATA" />
        </section>
        {children}
      </main>
    </div>
  );
}
