import { EventAlarmResponse } from "../interfaces/OtherEvents";


export function eventResponseParse(req: string): EventAlarmResponse {
    const stringsArr = `Code${req.split("Code")[1]}`.split(";");
    let parsed: { [v: string]: string | {} } = {};
  
    for (const string of stringsArr) {
      const [index, value] = string.split("=") as [string, string];
  
      if (index == "data") {
        parsed[index] = JSON.parse(value);
        break;
      }
  
      if (index == "index") {
        parsed[index] = Number(value);
        break;
      }
  
      parsed[index] = value;
    }
  
    return parsed as unknown as EventAlarmResponse;
  }