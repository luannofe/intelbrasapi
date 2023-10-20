import { Readable } from "stream"
import { SnapshotResponseObjectUnparsed, Snapshot, SnapshotResponseHeader } from "../types/snapshot"


async function* separateChunksByBoundary(
  dataStream: Readable
): AsyncGenerator<Buffer> {


  const boundary = '--myboundary'
  let thisChunkTemporaryData: Buffer = Buffer.alloc(0)

  for await (const chunk of dataStream) {

    thisChunkTemporaryData = Buffer.concat([thisChunkTemporaryData, chunk])

    let boundaryIndex = thisChunkTemporaryData.indexOf(boundary)

    while (boundaryIndex !== -1) {

      const partData = thisChunkTemporaryData.subarray(0, boundaryIndex)

      yield Buffer.from(partData)

      thisChunkTemporaryData = Buffer.from(thisChunkTemporaryData.subarray(boundaryIndex + boundary.length))

      boundaryIndex = thisChunkTemporaryData.indexOf(boundary)

    }

  }



}

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

  let responseCount = 0

  let toParse: SnapshotResponseObjectUnparsed[] = []

  for await (const chunks of separateChunksByBoundary(dataStream)) {


    if (responseCount == 0 && chunks.byteLength < 8) {
      continue
    }

    const snapshotResponseUnparsed = await extractHeader(chunks)

    toParse.push(snapshotResponseUnparsed)

    if (toParse.length >= 2) {
      yield await parseSnapshotResponse([toParse[0], toParse[1]])
      toParse = []
      continue
    }


    responseCount++
  }

}

async function extractHeader(buffer: Buffer) {

  const string = buffer.toString();
  const headerEndIndex = string.indexOf('\r\n\r\n') + 4; // Find the first occurrence of \r\r

  const header = string.substring(0, headerEndIndex);
  const headerLines = header.split('\n');

  let headerObject: Partial<SnapshotResponseHeader> = {};


  for (const line of headerLines) {
    const [key, value] = line.split(':');
    if (key && value) {
      headerObject[key.trim()] = key === 'Content-Length' ? Number(value.trim()) : value.trim();
    }
  }

  const result: SnapshotResponseObjectUnparsed = {
    header: headerObject as SnapshotResponseHeader,
    data: Buffer.from(buffer.subarray(headerEndIndex))
  };

  return result;
}

function genericParseStringToObject(data: string) {
  const lines = data.split('\n');
  const result = {};

  for (const line of lines) {
    let [path, value] = line.replace("\r", '').split('=');

    if (!value) continue

    const parts = path.split('.');

    if (!isNaN(Number(value))) {
      value = Number(value) as any
    }

    let obj = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const match = part.match(/(\w+)\[(\d+)\]/);

      if (match) {
        const [_, key, index] = match;
        if (!obj[key]) {
          obj[key] = [];
        }
        if (!obj[key][index]) {
          obj[key][index] = {};
        }
        if (i === parts.length - 1) {
          obj[key][index] = value;
        } else {
          obj = obj[key][index];
        }
      } else {
        if (!obj[part]) {
          obj[part] = {};
        }
        if (i === parts.length - 1) {
          obj[part] = value;
        } else {
          obj = obj[part];
        }
      }
    }
  }

  return result;
}

