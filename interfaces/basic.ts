export type EventType  = 'VideoMotion' | 'SmartMotionHuman' | 'FaceRecognition'
export type EventAction = 'Stop' | 'Start' | 'Pause'

export type EventBaseInfo = {
    Action: EventAction,
    Code: EventType,
    Index: number
}



export type Sex =  'Man' | 'Woman' | 'Unknown'
