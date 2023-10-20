import { EventBaseInfo, Sex } from "./basic";

interface FaceAttributes {
    Sex?: Sex;
    Age?: number;
    Attractive: number,
    Angle: [number, number, number],
    BoundingBox: [number, number ,number ,number],
    Center: [number, number],
    FaceAlignScore: number,
    FaceClarity: number,
    FaceQuality: number,
    Feature?: ('WearGlasses' | 'SunGlasses' | 'NoGlasses' | 'Smile' | 'Anger' | 'Sadness' | 'Disgust' | 'Fear' | 'Surprise' | 'Neutral' | 'Laugh' | 'Happy' | 'Confused' | 'Scream')[];
    Glass: 0 | 1 | 2,
    Eye?: 0 | 1 | 2; // 0: not detected, 1: close eye, 2: open eye
    Mouth?: 0 | 1 | 2; // 0: not detected, 1: close mouth, 2: open mouth
    Mask?: 0 | 1 | 2; // 0: not detected, 1: not wearing mask, 2: wearing mask
    Beard?: 0 | 1 | 2; // 0: not detected, 1: no beard, 2: beard
    ObjectID: number,
    ObjectType: string,
    RelativeID: number,
}

interface Person { 
    Birthday: string,
    CertificateType: string,
    Country: string,
    FeatureErrCode: number,
    GroupID: number,
    GroupName: string,
    Image: {FilePath: string, Length: number, Offset: number}[],
    Name: string,
    PersonID: number,
    PicLen: number,
    PicUrl: string,
    Sex: string,
    UID: number,
    picUrl: string,
}


interface BasicImageInfo {
    Height: number;
    Width: number;
    Length: number;
    Offset: number;
    IsDetected?: 'true' | 'false';
}

interface PersonObject extends FaceAttributes {
    Action: string;
    Confidence: number;
    Emotion: 'Neutral' | 'Happy' | 'Sadness' | 'Confused' | 'Scream' | 'Disgust' | 'Fear' | 'Smile' | 'Anger' ; // Further refine based on possible emotions
    FrameSequence: number;
    Image: Omit<BasicImageInfo, 'IsDetected'>;
    OriginalBoundingBox: [number, number ,number ,number];
    Source: number;
    Speed: number;
    SpeedTypeInternal: number;
}

export type FaceRecognition = {
    Candidates?: {Person: Person, Similarity: number}[],
    Class: 'FaceAnalysis',
    Code: 'FaceAnalysis',
    EventBaseInfo: EventBaseInfo,
    Face: FaceAttributes,
    FeatureVector: {Length: number, Offset: number},
    FeatureVersion: number,
    ImageInfo: BasicImageInfo,
    IsGlobalScene: Boolean,
    Mode: number,
    Name: 'Reconhecimento Facial',
    Object: PersonObject,
    Sequence: number,
    UTC: number,
    UTCMS: number
}