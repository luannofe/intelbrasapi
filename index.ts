import AxiosDigestAuth from "@mhoc/axios-digest-auth";
import { Readable } from "stream";
import { handleSnapshotData } from "./functions/snapshot";
import { randomUUID } from "crypto";
import * as dayjs from 'dayjs'
import { writeFile } from "fs";
import { Snapshot } from "./types/snapshot";



export class Camera {
  private ip: string;
  private username: string;
  private password: string;
  private axios: AxiosDigestAuth;

  constructor(ip: string, pass: string, username: string) {
    this.ip = ip;
    this.username = username;
    this.password = pass;

    this.axios = new AxiosDigestAuth({
      username: this.username,
      password: this.password,
    });
  }

  /**
   * Creates a permanent connection to the device and listen for events.
   * @param {string} events - Events array in string format '[a,b,c]' for listening.
   * @returns {EventAlarmResponse} Returns a EventAlarmResponse object each time an event is received.

   */
  // async *receiveAlarms(
  //   events: string = "[All]"
  // ): AsyncGenerator<EventAlarmResponse> {
  //   const req = await this.axios.request({
  //     method: "GET",
  //     url: `http://${this.ip}/cgi-bin/eventManager.cgi?action=attach&codes=${events}`,
  //     responseType: "stream",
  //   });

  //   const reqData = Readable.from(req.data);

  //   for await (const chunk of reqData) {
  //     console.log(chalk.bgBlue('new chunk'), chalk.reset())
  //     console.log(Buffer.from(chunk).toString())

  //   }
  // }



  /**
   * Creates a permanent connection to the device and listen for snapshots.
   * @param {string?} events - Events array in string format '[a,b,c]' for listening.
   * @param {number?} heartbeat - Delay in which the device should send a heartbeat to keep connection alive.
   * @param {channel?} channel not implemented yet.
   * @param {revive?} revive should the connection be restarted on error or end. Defaults to true.
   * @returns {Snapshot} Returns a snapshot each time an event is received.
   * @example 
   * 
   * const cam = new Camera('1.2.3.4', 'username', 'password')
   * 
   * for await (const snapshot of cam.receiveSnapshots()) {
   *      fs.writeFile('snapshotImage.jpeg', snapshot.image, (err) => console.error(err))
   * }
   */

  async *receiveSnapshots(
    events: string = "[All]",
    heartbeat?: number,
    channel?: number,
    revive: Boolean = true
  ) {
    try {
      const url = `http://${this.ip
        }/cgi-bin/snapManager.cgi?action=attachFileProc${channel ? `&channel=${channel}` : ""
        }${heartbeat ? `&heartbeat=${heartbeat}` : ""
        }&Flags[0]=Event&Events=${events}`;

      const req = await this.axios.request({
        method: "GET",
        url,
        responseType: "stream",
      });

      const reqData = Readable.from(req.data);

      reqData.on('end', () => {
        console.log('ended')
        if (revive) {
          this.receiveSnapshots(events, heartbeat, channel, revive)
        }
      })

      for await (const snapshot of handleSnapshotData(reqData)) {
        yield snapshot
      }

    } catch (e) {
      if (revive) {
        this.receiveSnapshots(events, heartbeat, channel, revive)
        console.error(e)
      } else throw (e)
    }

  }
}

