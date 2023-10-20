import { FaceRecognition } from "./FaceAnalysis"
import { EventAlarmResponse } from "./OtherEvents"

export type Snapshot = {
    events: {Events: Event[]},
    image: Buffer
}

export type Event = FaceRecognition | EventAlarmResponse

export type SnapshotResponseHeader = {
    'Content-Type' : 'text/plain' | 'image/jpeg', 
    'Content-Length': number
}

export type SnapshotResponseObjectUnparsed = {
    header: SnapshotResponseHeader,
    data: Buffer
}
