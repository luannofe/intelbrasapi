import { Readable } from "stream"
import { SnapshotResponseObjectUnparsed, Snapshot } from "../types/snapshot"
import { genericParseStringToObject, separateChunksByBoundary, extractHeader } from "./general"

const debug = false

async function parseSnapshotResponse(response: [SnapshotResponseObjectUnparsed, SnapshotResponseObjectUnparsed]): Promise<Snapshot> {

    const data = response.map((res) => {
        if (res.header["Content-Type"] == 'text/plain') {
            return genericParseStringToObject(res.data.toString())
        }

        if (res.header['Content-Type'] == 'image/jpeg') {
            return res.data
        }
    }) as [Event[], Buffer]

    return { events: data[0], image: data[1] } as unknown as Snapshot
}

export async function* handleSnapshotData(dataStream: Readable) {

    let toParse: SnapshotResponseObjectUnparsed[] = []

    for await (const chunks of separateChunksByBoundary(dataStream)) {

        const snapshotResponseUnparsed = await extractHeader(chunks)

        toParse.push(snapshotResponseUnparsed)
        debug &&  console.log('pushed to toParse, it has now ', toParse.length)
        debug && console.log(toParse)
        if (toParse.length >= 2) {
            yield await parseSnapshotResponse([toParse[0], toParse[1]])
            debug && console.log('sending snapshot and cleaning toParse ', toParse.length)
            toParse = []
            continue
        }


    }

}