import type { Fixture } from "../types/Fixture";

export const createDefaultFixture = (overrides: Partial<Fixture> = {}): Fixture => ({
  id: 0,
  fixture_code: "",
  fixture_type: "PAR",
  position_x: 0,
  position_y: 0,
  dmx_address: 1,
  channel_count: 1,
  color_mode: "RGB",
  ...overrides
});

export const createFixtureForm = createDefaultFixture;
export const createFixtureResponse = createDefaultFixture;
