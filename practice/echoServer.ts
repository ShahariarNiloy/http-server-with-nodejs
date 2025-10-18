import * as net from "net";

type TCPConn = {
  // the JS socket object
  socket: net.Socket;
  // the callbacks of the promise of the current read
  reader: null | {
    resolve: (value: Buffer) => void;
    reject: (reason: Error) => void;
  };
};

function newConn(socket: net.Socket): void {
  console.log("new connection", socket.remoteAddress, socket.remotePort);

  socket.on("end", () => {
    console.log("EOF.");
  });

  socket.on("data", (data: Buffer) => {
    console.log("data:", data.toString());
    socket.write(data);

    if (data.includes("q")) {
      console.log("closing.");
      socket.end();
    }
  });
}

let server = net.createServer({ allowHalfOpen: true });
server.on("error", (err: Error) => {
  throw err;
});
server.on("connection", newConn);
server.listen({ host: "127.0.0.1", port: 1234 });
