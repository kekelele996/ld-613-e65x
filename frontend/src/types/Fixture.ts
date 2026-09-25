import type { FixtureType } from "./FixtureType";
import type { ChannelMode } from "./ChannelMode";

export interface Fixture {
  id: number;
  fixture_code: string;
  fixture_type: FixtureType;
  position_x: number;
  position_y: number;
  dmx_address: number;
  channel_count: number;
  color_mode: ChannelMode;
}
