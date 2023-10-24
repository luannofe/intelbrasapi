import { Readable } from "stream"
import { SnapshotResponseObjectUnparsed, Snapshot, SnapshotResponseHeader } from "../types/snapshot"
import { writeFile } from "fs"
import { randomUUID } from "crypto"

const debug = false

export async function* separateChunksByBoundary(
  dataStream: Readable
): AsyncGenerator<Buffer> {


  const boundary = '--myboundary'
  let thisChunkTemporaryData: Buffer = Buffer.alloc(0)
  let index = 0

  for await (const chunk of dataStream) {

    debug && console.log('starting chunk loop')
    debug && console.log('chunk:', Buffer.from(chunk).toString().slice(0,150))
    
    let header : SnapshotResponseObjectUnparsed | undefined 
    
    thisChunkTemporaryData = Buffer.concat([thisChunkTemporaryData, chunk])
    debug && console.log('temporary data:', thisChunkTemporaryData.toString().slice(0,150))

    let boundaryIndex = thisChunkTemporaryData.indexOf(boundary)
    debug && writeFile('logs/log_' + index + '_'   + randomUUID() + '.txt', thisChunkTemporaryData.toString(), (err) => {})



    while (boundaryIndex !== -1) {


      debug && console.log('inside while') 
      
      const partData = thisChunkTemporaryData.subarray(0, boundaryIndex)

      if (partData.byteLength > 4) {

        yield Buffer.from(partData)
        debug &&  writeFile('logs/log_' + index  + '_yielded_' + randomUUID() + '.txt', partData.toString(), (err) => {})
      } 



      thisChunkTemporaryData = Buffer.from(thisChunkTemporaryData.subarray(boundaryIndex + boundary.length))

      debug &&  index != 0 && writeFile('logs/log_' + index +'_remained_' + randomUUID() + '.txt', thisChunkTemporaryData.toString(), (err) => {})

      boundaryIndex = thisChunkTemporaryData.indexOf(boundary)
      debug && console.log(boundaryIndex)

    }

    if (boundaryIndex == -1 && !header) {
      header = await extractHeader(thisChunkTemporaryData)
    }
    
    if (boundaryIndex == -1 && header) {
      debug &&  console.log('needed:', header.header["Content-Length"])
      debug &&  console.log('has:' , thisChunkTemporaryData.byteLength)
      if (thisChunkTemporaryData.byteLength >= header.header["Content-Length"]) {
        yield thisChunkTemporaryData
        thisChunkTemporaryData = null
        thisChunkTemporaryData = Buffer.alloc(0)
        header = undefined
        continue
      }
    }
    
    index ++
    
  }



}


export async function extractHeader(buffer: Buffer) {
  try {
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
    
    if (!result.header["Content-Length"] || !result.header["Content-Type"]) return undefined
  
    return result;
  } catch (e) {
    console.error(e)
    return undefined
  }

}

export function genericParseStringToObject(data: string) {
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

