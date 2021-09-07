import request from "supertest";
import { join } from "path";
import { readFileSync } from "fs";
import WebSocket from "ws";
import should from "should";
import { dirname } from "path";
import { fileURLToPath } from "url";

import startApp from "../../startApp.js";
import { GetPodsAPIResult } from "../../api/podmaster/pods/getPods.js";
import { CreatePodAPIResult } from "../../api/podmaster/pods/createPod.js";
import { GetLogsAPIResult } from "../../api/pod/logs/getLogs.js";
import { AddEntriesAPIResult } from "../../api/pod/logs/addEntries.js";
import { GetEntriesAPIResult } from "../../api/pod/logs/getEntries.js";
import { AppConfig, LogEntry } from "../../types/types.js";
import { GetInfoAPIResult } from "../../api/pod/logs/getInfo.js";
import promiseSignal from "../../lib/promiseSignal.js";
import { ErrResult } from "../../types/api.js";
import { UpdatePermissionsAPIResult as UpdatePodPermissionsAPIResult } from "../../api/pod/permissions/addPermissions.js";
import { GetJwksAPIResult } from "../../api/podmaster/well-known/getJwks.js";
import { GetPermissionsAPIResult } from "../../api/pod/permissions/getPermissions.js";
import { DeletePermissionsAPIResult } from "../../api/pod/permissions/deletePermissions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function run(configDir: string, configFilePath: string) {
  const podmasterJwt = readFileSync(join(configDir, "podmaster_jwt"))
    .toString()
    .replace(/\r?\n|\r/g, "");

  const podJwt = readFileSync(join(configDir, "pod_jwt"))
    .toString()
    .replace(/\r?\n|\r/g, "");

  describe("integration tests", async () => {
    const podId = "myweblog";
    const podName = "My Blog Db";
    const podDescription = "This is a test pod.";
    const logId = "myposts";
    const logName = "Table of Posts";
    const logDescription = "This is where all the posts go.";

    const appConfig: AppConfig = ((await import(configFilePath)) as any)
      .default;
    let app: any;
    let port: number;
    let mainHostname: string = appConfig.hostname;

    let hostname: string;
    let hostnameAndPort: string;
    let uploadedPath: string;
    const entries: LogEntry[] = [];

    before(async () => {
      const service = await startApp(configFilePath);
      app = service.listen(port);
      port = app.address().port;
      mainHostname =
        port === 80 || port === 443 ? mainHostname : `${mainHostname}:${port}`;
    });

    beforeEach(() => {});

    it("creates a pod", async () => {
      const response = await request(app)
        .post("/pods")
        .send({
          id: podId,
          name: podName,
          description: podDescription,
          admin: {
            identity: {
              iss: "https://auth.local.disks.app/",
              sub: "alice",
            },
          },
        })
        .set("Host", mainHostname)
        .set("Authorization", `Bearer ${podmasterJwt}`);

      response.status.should.equal(200);
      const apiResult: CreatePodAPIResult = JSON.parse(response.text);
      should.exist(apiResult.hostname);
      hostname = apiResult.hostname;
      hostnameAndPort =
        port === 80 || port === 443 ? hostname : `${hostname}:${port}`;
    });

    it("cannot create pod with existing id", async () => {
      const response = await request(app)
        .post("/pods")
        .send({
          id: "myweblog",
          description: "This is my very own pod.",
        })
        .set("Host", mainHostname)
        .set("Authorization", `Bearer ${podmasterJwt}`);

      response.status.should.equal(403);
      const apiResult: ErrResult = JSON.parse(response.text);
      apiResult.code.should.equal("POD_EXISTS");
    });

    it("gets all pods", async () => {
      const response = await request(app)
        .get("/pods")
        .set("Host", mainHostname)
        .set("Authorization", `Bearer ${podmasterJwt}`);

      response.status.should.equal(200);
      const apiResult: GetPodsAPIResult = JSON.parse(response.text);
      should.exist(apiResult.pods);
      apiResult.pods.length.should.be.greaterThan(0);
      apiResult.pods[0].name.should.equal(podName);
      apiResult.pods[0].description.should.equal(podDescription);
    });

    it("adds permissions for a pod", async () => {
      const response = await request(app)
        .post("/permissions")
        .send({
          identity: {
            iss: appConfig.jwtIssuers[0].claims.iss,
            sub: "alice",
          },
          pod: {
            access: {
              write: true,
              read: true,
            },
          },
        })
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
    });

    it("creates a log", async () => {
      const response = await request(app)
        .post("/logs")
        .send({
          id: logId,
          name: logName,
          description: logDescription,
        })
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
    });

    it("adds a permission to a log", async () => {
      const response = await request(app)
        .post("/permissions")
        .send({
          identity: {
            iss: appConfig.jwtIssuers[0].claims.iss,
            sub: "alice",
          },
          logs: [
            {
              log: logId,
              access: {
                write: true,
                read: true,
                publish: true,
                subscribe: true,
              },
            },
          ],
        })
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);

      response.status.should.equal(200);
    });

    it("deletes a permission to a log", async () => {
      // Create a permission first.
      await request(app)
        .post("/permissions")
        .send({
          identity: {
            iss: appConfig.jwtIssuers[0].claims.iss,
            sub: "bob",
          },
          logs: [
            {
              log: logId,
              access: {
                write: true,
                read: true,
                publish: true,
                subscribe: true,
              },
            },
          ],
        })
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      const response = await request(app)
        .del("/permissions")
        .query({
          iss: appConfig.jwtIssuers[0].claims.iss,
          sub: "bob",
        })
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
    });

    it("gets all logs", async () => {
      const response = await request(app)
        .get("/logs")
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetLogsAPIResult = JSON.parse(response.text);
      should.exist(apiResult.logs);
      apiResult.logs[0].name.should.equal(logName);
      apiResult.logs[0].description.should.equal(logDescription);
    });

    it("writes log entries", async () => {
      const response = await request(app)
        .post(`/logs/${logId}/entries`)
        .send({
          entries: [
            {
              data: "hello",
            },
            {
              data: "world",
            },
            {
              data: "mask",
            },
          ],
        })
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: AddEntriesAPIResult = JSON.parse(response.text);
      should.exist(apiResult.entries);
      apiResult.entries.length.should.be.greaterThan(0);
    });

    it("writes files", async () => {
      const file1 = join(__dirname, "fixtures/hello.txt");
      const file2 = join(__dirname, "fixtures/world.txt");

      const response = await request(app)
        .post(`/logs/${logId}/entries`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`)
        .attach("hello.txt", file1)
        .attach("world.txt", file2);

      response.status.should.equal(200);
      const apiResult: AddEntriesAPIResult = JSON.parse(response.text);
      should.exist(apiResult.entries);
      apiResult.entries.length.should.be.greaterThan(0);
    });

    it("gets info about a log", async () => {
      const response = await request(app)
        .get(`/logs/${logId}/info`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetInfoAPIResult = JSON.parse(response.text);
      should.exist(apiResult.id);
      apiResult.id.should.equal(5);
    });

    it("gets entries from a log", async () => {
      const response = await request(app)
        .get(`/logs/${logId}/entries`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(5);
      entries.push(...apiResult.entries);
    });

    it("gets entries from a log after id", async () => {
      const response = await request(app)
        .get(`/logs/${logId}/entries?sinceId=1`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(4);
    });

    it("gets entries from a log after commit", async () => {
      const response = await request(app)
        .get(`/logs/${logId}/entries?sinceCommit=${entries[1].commit}`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(3);
    });

    it("gets entries with offset", async () => {
      const response = await request(app)
        .get(`/logs/${logId}/entries?offset=1&limit=1`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(1);
      apiResult.entries[0].id.should.equal(2);
    });

    it("gets last entries with offset", async () => {
      const response = await request(app)
        .get(`/logs/${logId}/entries?offset=1&order=desc&limit=1`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(1);
      apiResult.entries[0].id.should.equal(4);
    });

    it("gets entries by commits", async () => {
      const commits = entries
        .slice(1)
        .map((x) => x.commit)
        .join(",");
      const response = await request(app)
        .get(`/logs/${logId}/entries?commits=${commits}`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      uploadedPath = (
        apiResult.entries.find((x) => x.type === "file") as LogEntry
      ).data;
      apiResult.entries.length.should.equal(4);
    });

    it("downloads files", async () => {
      const response = await request(app)
        .get(uploadedPath)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);
      response.status.should.equal(200);
    });

    it("limit results by count", async () => {
      const response = await request(app)
        .get(`/logs/${logId}/entries?limit=2`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(2);
      entries.push(...apiResult.entries);
    });

    it("gets all permissions", async () => {
      const response = await request(app)
        .get(`/permissions`)
        .set("Host", hostnameAndPort)
        .set("Authorization", `Bearer ${podJwt}`);

      response.status.should.equal(200);
      const apiResult: GetPermissionsAPIResult = JSON.parse(response.text);
      apiResult.permissions.length.should.be.greaterThan(0);
    });

    it("gets jwks from well-known endpoint", async () => {
      const response = await request(app)
        .get(`/.well-known/jwks.json`)
        .set("Host", mainHostname);

      response.status.should.equal(200);
      const apiResult: GetJwksAPIResult = JSON.parse(response.text);
      apiResult.keys.length.should.be.greaterThan(0);
    });

    it("adds a web socket subscription", async () => {
      const wsSender = new WebSocket(`ws://${hostname}:${port}/channels`);
      const wsReceiver = new WebSocket(`ws://${hostname}:${port}/channels`);

      const authMessage = JSON.stringify({ token: podJwt });
      const result = await new Promise<string>((resolve, reject) => {
        wsSender.addEventListener("open", function (event) {
          wsSender.send(authMessage);
        });

        wsReceiver.addEventListener("open", function (event) {
          wsReceiver.send(authMessage);
        });

        const {
          promise: receiverSubscribe,
          resolve: receiverSubscribeResolve,
        } = promiseSignal();

        wsSender.addEventListener("message", async (message) => {
          if (message.data) {
            const data = JSON.parse(message.data);
            if (data.event === "connect") {
              // Wait for receiver to be subscribed.
              await receiverSubscribe;

              wsSender.send(
                JSON.stringify({
                  type: "message",
                  channels: [`${logId}/test-channel`],
                  message: "hello world 2021",
                })
              );
            }
          }
        });

        wsReceiver.addEventListener("message", async (message) => {
          if (message.data) {
            const data = JSON.parse(message.data);
            if (data.event === "connect") {
              wsReceiver.send(
                JSON.stringify({
                  type: "subscribe",
                  channels: [`${logId}/test-channel`],
                })
              );
            } else if (data.event === "subscribe") {
              receiverSubscribeResolve();
            } else if (data.event === "message") {
              resolve(data.data.message);
            }
          }
        });
      });

      result.should.equal("hello world 2021");
    });
  });
}
