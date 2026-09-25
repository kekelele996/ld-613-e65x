import type { ShowProject } from "../types/ShowProject";
import type { StoreName } from "../db/schema";
import { idb } from "../db/indexedDb";
import { createDefaultShowProject } from "../constructors/ShowProjectConstructor";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { writeLog } from "../utils/logger";
import { nextId } from "../utils/ids";

const STORE: StoreName = "showProject";

export async function listProjects(): Promise<ShowProject[]> {
  return idb.getAll<ShowProject>(STORE);
}

export async function createProject(input: Partial<ShowProject>): Promise<ShowProject> {
  const rows = await listProjects();
  const project = createDefaultShowProject({
    ...input,
    id: nextId(rows),
    updated_at: new Date().toISOString()
  });
  await idb.put(STORE, project);
  writeLog("ShowProject", "create", LOG_TEMPLATES.ShowProject.create, {
    title: project.title,
    venue: project.venue_name
  });
  return project;
}

export async function touchProject(project: ShowProject): Promise<ShowProject> {
  const updated = { ...project, updated_at: new Date().toISOString() };
  await idb.put(STORE, updated);
  writeLog("ShowProject", "update", LOG_TEMPLATES.ShowProject.update, {
    title: updated.title
  });
  return updated;
}
