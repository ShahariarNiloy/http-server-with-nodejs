import * as net from "net";

// A promise-based API for TCP sockets.
type TCPConn = {
  socket: net.Socket;
  err: null | Error;
  ended: boolean;
  messaGeCount?: number;
  reader: null | {
    resolve: (value: Buffer) => void;
    reject: (reason: Error) => void;
  };
};

function soInit(socket: net.Socket): TCPConn {
  console.log("\n\n🛠️ Initializing connection wrapper...");

  const conn: TCPConn = {
    socket: socket,
    err: null,
    ended: false,
    messaGeCount: 0,
    reader: null,
  };

  socket.on("data", (data: Buffer) => {
    conn.messaGeCount!++;
    console.log("\n\n📩 [EVENT:data] received:", data.toString().trim());
    console.log("🔍 Checking for pending reader:", conn.reader ? "yes" : "no");

    console.assert(conn.reader, "⚠️ No pending reader found!");
    // pause the 'data' event until the next read.
    console.log("⏸️ Pausing socket data flow until next read...");
    conn.socket.pause();

    // fulfill the promise of the current read.
    console.log("✅ Resolving current reader promise with data...\n");
    conn.reader?.resolve(data);
    conn.reader = null;
  });

  socket.on("end", () => {
    console.log("📭 [EVENT:end] client has closed sending side.");
    conn.ended = true;

    if (conn.reader) {
      console.log("✅ Resolving reader with empty buffer (EOF)...");
      conn.reader.resolve(Buffer.from("")); // EOF
      conn.reader = null;
    } else {
      console.log("ℹ️ No pending reader during EOF.");
    }
  });

  socket.on("error", (err: Error) => {
    console.log("💥 [EVENT:error]", err.message);
    conn.err = err;

    if (conn.reader) {
      console.log("❌ Rejecting current reader due to error...");
      conn.reader.reject(err);
      conn.reader = null;
    } else {
      console.log("ℹ️ Error occurred but no active reader to reject.");
    }
  });

  console.log("\n✅ Connection wrapper initialized.\n");
  return conn;
}

function soWrite(conn: TCPConn, data: Buffer): Promise<void> {
  console.log("\n\n🟣 soWrite() called with data:", data.toString().trim());
  console.assert(data.length > 0, "⚠️ Empty data write attempted!");

  return new Promise((resolve, reject) => {
    if (conn.err) {
      console.log("❌ Connection already errored, rejecting write...");
      reject(conn.err);
      return;
    }

    console.log("\n\n✍️ Writing data back to socket...");
    conn.socket.write(data, (err?: Error | null) => {
      if (err) {
        console.log("💥 Write failed:", err.message);
        reject(err);
      } else {
        console.log("\n✅ Write completed successfully.\n");
        resolve();
      }
    });
  });
}

function soRead(conn: TCPConn): Promise<Buffer> {
  console.log("\n\n🟢 soRead() called...");
  console.assert(
    !conn.reader,
    "⚠️ soRead() called while another read is pending!"
  );

  return new Promise((resolve, reject) => {
    if (conn.err) {
      console.log("❌ Connection already has error, rejecting immediately...");
      reject(conn.err);
      return;
    }

    if (conn.ended) {
      console.log("📭 Connection already ended, resolving with EOF...");
      resolve(Buffer.from(""));
      return;
    }

    console.log("\n\n💾 Storing reader callbacks for future data event...");
    conn.reader = { resolve, reject };

    console.log("▶️ Resuming socket to allow data flow...");
    console.log("Current conn message count ...", conn?.messaGeCount);
    conn.socket.resume();
  });
}
// echo server logic
async function serveClient(socket: net.Socket): Promise<void> {
  console.log("\n\n🚀 Starting to serve client...\n");
  const conn: TCPConn = soInit(socket);

  while (true) {
    console.log("🕓 Waiting for client data...");
    const data = await soRead(conn);
    console.log(
      "📨 soRead() resolved with data:",
      data.toString().trim() || "<EOF>"
    );

    if (data.length === 0) {
      console.log("🛑 EOF detected — ending connection loop.");
      break;
    }

    console.log("🔁 Echoing data back to client...");
    await soWrite(conn, data);
  }

  console.log("🏁 Exiting serveClient loop — connection done.\n");
}

async function newConn(socket: net.Socket): Promise<void> {
  console.log(
    "🌐 [NEW CONNECTION]",
    socket.remoteAddress,
    socket.remotePort,
    "\n"
  );
  try {
    await serveClient(socket);
  } catch (exc) {
    console.error("💣 Exception while serving client:", exc);
  } finally {
    console.log("🧹 Cleaning up and destroying socket.\n");
    socket.destroy();
  }
}

const server = net.createServer({
  pauseOnConnect: true, // important for our async reads
});

server.on("connection", newConn);

server.on("error", (err: Error) => {
  console.error("💥 Server error:", err);
});

server.listen({ host: "127.0.0.1", port: 1235 }, () => {
  console.log("🟩 Server listening on 127.0.0.1:1235\n");
});
