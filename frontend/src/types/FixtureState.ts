/** 单台灯在某个场景中的状态：颜色（#RRGGBB）与亮度（0-100）。 */
export interface FixtureState {
  fixture_id: number;
  color: string;
  brightness: number;
}
