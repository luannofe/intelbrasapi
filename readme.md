IntelbrasApi is a package created for communication with Intelbras DVRs API. It makes easier the api rest connection and parses
incoming data (which is a string stream, mostly) to an usable format.

Quickstart:
```
   const cam = new Camera('1.2.3.4', 'username', 'password')
   
   for await (const snapshot of cam.receiveSnaphosts()) {
       fs.writeFile('snapshotImage.jpeg', snapshot.image)
   }
```