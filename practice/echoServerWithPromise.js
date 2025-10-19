"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
function soInit(socket) {
    console.log("\n\n🛠️ Initializing connection wrapper...");
    var conn = {
        socket: socket,
        err: null,
        ended: false,
        messaGeCount: 0,
        reader: null,
    };
    socket.on("data", function (data) {
        var _a;
        conn.messaGeCount++;
        console.log("\n\n📩 [EVENT:data] received:", data.toString().trim());
        console.log("🔍 Checking for pending reader:", conn.reader ? "yes" : "no");
        console.assert(conn.reader, "⚠️ No pending reader found!");
        // pause the 'data' event until the next read.
        console.log("⏸️ Pausing socket data flow until next read...");
        conn.socket.pause();
        // fulfill the promise of the current read.
        console.log("✅ Resolving current reader promise with data...\n");
        (_a = conn.reader) === null || _a === void 0 ? void 0 : _a.resolve(data);
        conn.reader = null;
    });
    socket.on("end", function () {
        console.log("📭 [EVENT:end] client has closed sending side.");
        conn.ended = true;
        if (conn.reader) {
            console.log("✅ Resolving reader with empty buffer (EOF)...");
            conn.reader.resolve(Buffer.from("")); // EOF
            conn.reader = null;
        }
        else {
            console.log("ℹ️ No pending reader during EOF.");
        }
    });
    socket.on("error", function (err) {
        console.log("💥 [EVENT:error]", err.message);
        conn.err = err;
        if (conn.reader) {
            console.log("❌ Rejecting current reader due to error...");
            conn.reader.reject(err);
            conn.reader = null;
        }
        else {
            console.log("ℹ️ Error occurred but no active reader to reject.");
        }
    });
    console.log("\n✅ Connection wrapper initialized.\n");
    return conn;
}
function soWrite(conn, data) {
    console.log("\n\n🟣 soWrite() called with data:", data.toString().trim());
    console.assert(data.length > 0, "⚠️ Empty data write attempted!");
    return new Promise(function (resolve, reject) {
        if (conn.err) {
            console.log("❌ Connection already errored, rejecting write...");
            reject(conn.err);
            return;
        }
        console.log("\n\n✍️ Writing data back to socket...");
        conn.socket.write(data, function (err) {
            if (err) {
                console.log("💥 Write failed:", err.message);
                reject(err);
            }
            else {
                console.log("\n✅ Write completed successfully.\n");
                resolve();
            }
        });
    });
}
function soRead(conn) {
    console.log("\n\n🟢 soRead() called...");
    console.assert(!conn.reader, "⚠️ soRead() called while another read is pending!");
    return new Promise(function (resolve, reject) {
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
        conn.reader = { resolve: resolve, reject: reject };
        console.log("▶️ Resuming socket to allow data flow...");
        console.log("Current conn message count ...", conn === null || conn === void 0 ? void 0 : conn.messaGeCount);
        conn.socket.resume();
    });
}
// echo server logic
function serveClient(socket) {
    return __awaiter(this, void 0, void 0, function () {
        var conn, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n\n🚀 Starting to serve client...\n");
                    conn = soInit(socket);
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 4];
                    console.log("🕓 Waiting for client data...");
                    return [4 /*yield*/, soRead(conn)];
                case 2:
                    data = _a.sent();
                    console.log("📨 soRead() resolved with data:", data.toString().trim() || "<EOF>");
                    if (data.length === 0) {
                        console.log("🛑 EOF detected — ending connection loop.");
                        return [3 /*break*/, 4];
                    }
                    console.log("🔁 Echoing data back to client...");
                    return [4 /*yield*/, soWrite(conn, data)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 4:
                    console.log("🏁 Exiting serveClient loop — connection done.\n");
                    return [2 /*return*/];
            }
        });
    });
}
function newConn(socket) {
    return __awaiter(this, void 0, void 0, function () {
        var exc_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🌐 [NEW CONNECTION]", socket.remoteAddress, socket.remotePort, "\n");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, serveClient(socket)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    exc_1 = _a.sent();
                    console.error("💣 Exception while serving client:", exc_1);
                    return [3 /*break*/, 5];
                case 4:
                    console.log("🧹 Cleaning up and destroying socket.\n");
                    socket.destroy();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
var server = net.createServer({
    pauseOnConnect: true, // important for our async reads
});
server.on("connection", newConn);
server.on("error", function (err) {
    console.error("💥 Server error:", err);
});
server.listen({ host: "127.0.0.1", port: 1235 }, function () {
    console.log("🟩 Server listening on 127.0.0.1:1235\n");
});
