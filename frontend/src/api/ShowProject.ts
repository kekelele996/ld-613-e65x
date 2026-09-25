import type { ShowProject } from "../types/ShowProject";
import { createProject, listProjects, touchProject } from "../services/showProjectService";
import { StageLightError } from "../errors/StageLightError";
import { ERROR_CODES } from "../constants/errorCodes";

function toControllerError(error: unknown): StageLightError {
  if (error instanceof StageLightError) return error;
  return new StageLightError(ERROR_CODES.VALIDATION_FAILED, {});
}

export async function listShowProject(): Promise<ShowProject[]> {
  return listProjects().catch((error) => {
    throw toControllerError(error);
  });
}

export async function saveShowProject(payload: ShowProject): Promise<ShowProject> {
  try {
    if (payload.id > 0) return await touchProject(payload);
    return await createProject(payload);
  } catch (error) {
    throw toControllerError(error);
  }
}
