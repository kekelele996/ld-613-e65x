import type { Fixture } from "../types/Fixture";
import {
  createFixture as createFixtureService,
  deleteFixture as deleteFixtureService,
  listFixtures,
  updateFixture as updateFixtureService
} from "../services/fixtureService";
import { StageLightError } from "../errors/StageLightError";
import { ERROR_CODES } from "../constants/errorCodes";

/** controller 层统一包装 service 抛出的异常，页面只消费 message。 */
function toControllerError(error: unknown): StageLightError {
  if (error instanceof StageLightError) return error;
  return new StageLightError(ERROR_CODES.VALIDATION_FAILED, {});
}

export async function listFixture(): Promise<Fixture[]> {
  return listFixtures().catch((error) => {
    throw toControllerError(error);
  });
}

export async function saveFixture(payload: Fixture): Promise<Fixture> {
  try {
    if (payload.id > 0) return await updateFixtureService(payload);
    return await createFixtureService(payload);
  } catch (error) {
    throw toControllerError(error);
  }
}

export async function removeFixture(id: number): Promise<void> {
  try {
    await deleteFixtureService(id);
  } catch (error) {
    throw toControllerError(error);
  }
}
