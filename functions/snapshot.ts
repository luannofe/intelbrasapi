import { Readable } from "stream"
import { SnapshotResponseObjectUnparsed, Snapshot } from "../types/snapshot"
import { genericParseStringToObject, separateChunksByBoundary, extractHeader } from "./general"
import { writeFile } from "fs"

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
        try {
            const snapshotResponseUnparsed = await extractHeader(chunks)

            if (!snapshotResponseUnparsed.header) {
                toParse = []
                continue
            }
    
            toParse.push(snapshotResponseUnparsed)
            debug &&  console.log('pushed to toParse, it has now ', toParse.length)
            debug && console.log(toParse)
            
            if (toParse.length >= 2) {
                
                if (toParse[0].header['Content-Type'] !== 'text/plain' || toParse[1].header['Content-Type'] !== 'image/jpeg') {
                    toParse = []
                    continue
                }
    
                const snapshot =  await parseSnapshotResponse([toParse[0], toParse[1]])
                yield snapshot
                debug && console.log('sending snapshot and cleaning toParse ', toParse.length)
                toParse = []
                continue
            }
        } catch (e) {
            console.error('Parsing error: ', e)
            writeFile('/logs/errorLog_' + new Date().toString().slice(0,10) + '.txt', JSON.stringify(chunks.toString()), (err) => console.log('Erro ao tentar salvar arquivo' + err))
            toParse = []
            continue
        }
     


    }

}