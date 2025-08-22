import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TimerService } from "../src/services/timerService";
import { NullLogger } from "../src/services/logger";

const loops = 1;
const name = "testName";

describe("TimerService", () => {
  var service = null;
  const logger = new NullLogger();
  const core = {
    logger,
    sleep: async (ms) => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  beforeEach(() => {
    service = new TimerService(core);
  });

  afterEach(async () => {
  });

  it("runs a timer", async () => {
    var counter = 0;
    const callback = async () => {
      counter++;
    }
    const timer = service.createAndStart("testTimer", callback, 1);
    await core.sleep(100);
    await timer.stop();

    expect(counter).toBeGreaterThan(5);
  });

  describe("callback measuring", () => {
    it("does not throw when callback duration is within tolerance", async () => {
      var called = 0;

      const callback = async () => {
        await core.sleep(100);
        called++;
      };

      for (var i = 0; i < loops; i++) {
        const time1 = new Date().getTime();
        await service.monitorDuration(name, 200, callback);
        const time2 = new Date().getTime();
        const delta = time2 - time1;

        expect(called).toEqual(1);
        expect(delta).toBeLessThan(200);
        called = 0;
      }
    });

    it("throws when callback duration exceeds tolerance", async () => {
      var called = 0;
      const callback = async () => {
        called++;
        await core.sleep(300);
      };

      for (var i = 0; i < loops; i++) {
        const time1 = new Date().getTime();
        await expect(service.monitorDuration(name, 200, callback)).rejects.toThrow(`Timeout exceeded for ${name}`);
        const time2 = new Date().getTime();
        const delta = time2 - time1;

        expect(called).toEqual(1);
        expect(delta).toBeGreaterThanOrEqual(200);
        called = 0;
      }
    });
  });
});
