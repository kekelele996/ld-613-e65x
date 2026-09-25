export interface AppRoute {
  name: string;
  route: string;
}

/** 采用 hash 路由，Nginx try_files 与静态预览都可直接工作。 */
export const routes = [
  { name: "灯具布置", route: "/fixtures" },
  { name: "场景编辑", route: "/cues" },
  { name: "时间轴编排", route: "/timeline" },
  { name: "舞台预览", route: "/preview" }
] as const;

export const DEFAULT_ROUTE = routes[0].route;

export function readHashRoute(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || DEFAULT_ROUTE;
}
