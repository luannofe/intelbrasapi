import AxiosDigestAuth from "@mhoc/axios-digest-auth";
import { Buffer } from "buffer";
import { Readable } from "stream";
import { handleSnapshotData } from "./functions/general";
import { EventAlarmResponse } from "./types/OtherEvents";




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
   * @param {string} events - Events array in string format '[a,b,c]' for listening.
   * @returns {EventAlarmResponse} Returns a EventAlarmResponse object each time an event is received.
   * @example 
   * 
   * const cam = new Camera('1.2.3.4', 'username', 'password')
   * 
   * for await (const snapshot of cam.receiveSnaphosts()) {
   *      fs.writeFile('snapshotImage.jpeg', snapshot.image)
   * }
   */
  
  async *receiveSnapshots(
    events: string = "[All]",
    heartbeat?: number,
    channel?: number
  ) {
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

      for await (const snapshot of handleSnapshotData(reqData)) {
          yield snapshot
      }
    
  }
}


