import { EventBaseInfo } from "./basic"

export interface EventAlarmResponse extends EventBaseInfo {
    data: {
        [val:string] : Boolean | string
    }
}