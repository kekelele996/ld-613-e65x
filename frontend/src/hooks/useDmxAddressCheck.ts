import { useMemo } from "react";
import type { Fixture } from "../types/Fixture";

export interface DmxConflict {
  address: number;
  fixtures: Fixture[];
}

/**
 * DMX 地址检查：通道区间重叠即冲突。
 * 灯具占用 [dmx_address, dmx_address + channel_count - 1]。
 */
export function useDmxAddressCheck(rows: Fixture[] = []) {
  return useMemo(() => {
    const conflicts: DmxConflict[] = [];
    const byAddress = new Map<number, Fixture[]>();

    rows.forEach((fixture) => {
      for (
        let addr = fixture.dmx_address;
        addr < fixture.dmx_address + fixture.channel_count;
        addr += 1
      ) {
        const list = byAddress.get(addr) ?? [];
        list.push(fixture);
        byAddress.set(addr, list);
      }
    });

    byAddress.forEach((fixtures, address) => {
      const unique = fixtures.filter(
        (fixture, index, all) =>
          all.findIndex((row) => row.id === fixture.id) === index
      );
      if (unique.length > 1) {
        conflicts.push({ address, fixtures: unique });
      }
    });

    return {
      conflicts,
      hasConflict: conflicts.length > 0,
      /** 建议的下一个空闲起始地址。 */
      suggestedAddress:
        rows.reduce(
          (max, fixture) =>
            Math.max(max, fixture.dmx_address + fixture.channel_count),
          1
        )
    };
  }, [rows]);
}
