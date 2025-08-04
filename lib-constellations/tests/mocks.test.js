import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockCodexService } from "./mockCodex.js";
import { MockWaku } from "./mockWaku";

const timeoutMilliseconds = 1000 * 60;
const loops = 30;

describe(
  "MocksTest",
  {
    timeout: timeoutMilliseconds,
  },
  () => {
    var codexService = null;
    var mockWaku = null;
    var service = null;

    beforeEach(() => {
      mockWaku = new MockWaku();
      codexService = new MockCodexService();

      service = mockWaku.createMockWakuServiceForAddress("address");
    });

    afterEach(async () => {
      await mockWaku.stopAll();
    });

    function td(t1, t2, msg) {
      const time1 = t1.getTime();
      const time2 = t2.getTime();

      var delta = 0;
      if (time1 > time2) delta = time1 - time2;
      else delta = time2 - time1;

      if (delta > 50) console.log(`[${msg}] = ${delta} ms`);
      expect(delta).toBeLessThan(50);
    }

    for (var run = 0; run < loops; run++) {
      it(`waku mock ${run}`, async () => {
        const topic = "testtopic";

        async function openChannel(handler) {
          const t1 = new Date();
          const result = await service.openChannel(topic, handler);
          const t2 = new Date();
          td(t1, t2, "open channel");
          return result;
        }

        async function start(channel) {
          const t1 = new Date();
          await channel.start();
          const t2 = new Date();
          td(t1, t2, "channel start");
        }

        async function send(channel, msg) {
          const t1 = new Date();
          await channel.send(msg);
          const t2 = new Date();
          td(t1, t2, "channel send");
        }

        async function close(channel) {
          const t1 = new Date();
          await channel.close();
          const t2 = new Date();
          td(t1, t2, "channel close");
        }

        var alwaysRcv = [];
        const alwaysHandler = {
          onMessage: (signer, timestamp, msg) => {
            alwaysRcv.push(msg);
          }
        };

        const alwaysChannel = await openChannel( alwaysHandler);
        await start(alwaysChannel);

        var tempRcv = [];
        const tempHandler = {
          onMessage: (signer, timestamp, msg) => {
            tempRcv.push(msg);
          }
        };

        for (var count = 0; count < 10; count++) {
          const msg1 = `msg1-${run}-${count}`;
          const msg2 = `msg2-${run}-${count}`;
          const msg3 = `msg3-${run}-${count}`;

          // open channelA, send msg 1
          const tempChannelA = await openChannel(tempHandler);
          await start(tempChannelA);
          await send(tempChannelA, msg1);

          expect(alwaysRcv.includes(msg1));
          expect(tempRcv.includes(msg1));

          // open channelB, send msg 3
          const tempChannelB = await openChannel(tempHandler);
          await start(tempChannelB);
          await send(tempChannelB, msg3);

          expect(alwaysRcv.includes(msg3));
          expect(tempRcv.includes(msg3));

          // close A
          await close(tempChannelA);

          // send msg2 back
          await send(alwaysChannel, msg2);

          expect(alwaysRcv.includes(msg2));
          expect(tempRcv.includes(msg2));

          // close
          await close(tempChannelB);
          alwaysRcv = [];
          tempRcv = [];
        }
      });
    }

    for (var run = 0; run < loops; run++) {
      it(`codex mock ${run}`, async () => {
        const data = `data-${run}`;

        const cid = await codexService.upload(data);
        const manifest = await codexService.getManifest(cid);
        const rcv = await codexService.downloadData(cid);

        expect(manifest.datasetSize).toEqual(data.length);
        expect(rcv).toEqual(data);
      });
    }
  },
);
