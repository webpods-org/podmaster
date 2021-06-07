import { startApp } from "../..";
import request = require("supertest");
import { join } from "path";
import { readFileSync } from "fs";
import should = require("should");
import { GetPodsAPIResult } from "../../api/pods/getPods";
import { CreatePodAPIResult } from "../../api/pods/createPod";
import { GetLogsAPIResult } from "../../api/logs/getLogs";
import { UpdatePermissionsAPIResult } from "../../api/logs/updatePermissions";
import { CreateLogAPIResult } from "../../api/logs/createLog";
import { AddEntriesAPIResult } from "../../api/logs/addEntries";
import { GetPermissionsAPIResult } from "../../api/logs/getPermissions";
import { GetEntriesAPIResult } from "../../api/logs/getEntries";
import { LogEntry } from "../../types/types";

let app: any;

export default function run(
  port: number,
  configDir: string,
  configFilePath: string,
  dbConfig: { path: string }
) {
  const jwt = readFileSync(join(configDir, "jwt"))
    .toString()
    .replace(/\r?\n|\r/g, "");

  describe("integration tests", async () => {
    let app: any;
    let port: number;

    before(async () => {
      const service = await startApp(port, configFilePath);
      app = service.listen();
      port = app.address().port;
    });

    beforeEach(() => {});

    let hostname: string;
    let pod: string;
    let log: string;
    let entries: LogEntry[] = [];

    it("creates a pod", async () => {
      const response = await request(app)
        .post("/pods")
        .set("Host", process.env.WEBPODS_TEST_HOSTNAME as string)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: CreatePodAPIResult = JSON.parse(response.text);
      should.exist(apiResult.pod);
      should.exist(apiResult.hostname);
      hostname = apiResult.hostname;
      pod = apiResult.pod;
    });

    it("gets all pods", async () => {
      const response = await request(app)
        .get("/pods")
        .set("Host", process.env.WEBPODS_TEST_HOSTNAME as string)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: GetPodsAPIResult = JSON.parse(response.text);
      should.exist(apiResult.pods);
      apiResult.pods.length.should.be.greaterThan(0);
    });

    it("creates a log", async () => {
      const response = await request(app)
        .post("/logs")
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: CreateLogAPIResult = JSON.parse(response.text);
      should.exist(apiResult.log);
      log = apiResult.log;
    });

    it("gets all logs", async () => {
      const response = await request(app)
        .get("/logs")
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: GetLogsAPIResult = JSON.parse(response.text);
      should.exist(apiResult.logs);
    });

    it("writes log entries", async () => {
      const response = await request(app)
        .post(`/logs/${log}/entries`)
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
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: AddEntriesAPIResult = JSON.parse(response.text);
      should.exist(apiResult.entries);
      apiResult.entries.length.should.be.greaterThan(0);
    });

    it("writes files", async () => {
      const file1 = join(__dirname, "fixtures/hello.txt");
      const file2 = join(__dirname, "fixtures/world.txt");

      const response = await request(app)
        .post(`/logs/${log}/entries`)
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`)
        .attach("hello.txt", file1)
        .attach("world.txt", file2);

      response.status.should.equal(200);
      const apiResult: AddEntriesAPIResult = JSON.parse(response.text);
      should.exist(apiResult.entries);
      apiResult.entries.length.should.be.greaterThan(0);
    });

    it("gets entries from a log", async () => {
      const response = await request(app)
        .get(`/logs/${log}/entries`)
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(5);
      entries.push(...apiResult.entries);
    });

    it("gets entries from a log after id", async () => {
      const response = await request(app)
        .get(`/logs/${log}/entries?sinceId=1`)
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(4);
    });

    it("gets entries from a log after commit", async () => {
      const response = await request(app)
        .get(`/logs/${log}/entries?sinceCommit=${entries[1].commit}`)
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(3);
    });

    it("gets entries by commits", async () => {
      const commits = entries
        .slice(1)
        .map((x) => x.commit)
        .join(",");
      const response = await request(app)
        .get(`/logs/${log}/entries?commits=${commits}`)
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(4);
    });

    it("limit results by count", async () => {
      const response = await request(app)
        .get(`/logs/${log}/entries?limit=2`)
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: GetEntriesAPIResult = JSON.parse(response.text);
      apiResult.entries.length.should.equal(2);
      entries.push(...apiResult.entries);
    });

    it("adds a permission to a log", async () => {
      const response = await request(app)
        .post(`/logs/${log}/permissions/updates`)
        .send({
          add: [
            {
              claims: {
                iss: "https://example.com",
                sub: "alice",
              },
              access: {
                read: true,
                write: false,
                admin: false,
                metadata: false,
              },
            },
          ],
        })
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: UpdatePermissionsAPIResult = JSON.parse(response.text);
      apiResult.added.should.equal(1);
    });

    it("gets all permissions for a log", async () => {
      const response = await request(app)
        .get(`/logs/${log}/permissions`)
        .set("Host", hostname)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: GetPermissionsAPIResult = JSON.parse(response.text);
      apiResult.permissions.length.should.be.greaterThan(0);
    });

    // it("says missing userid is missing", async () => {
    //   const response = await request(app).get("/user-ids/alice");
    //   response.status.should.equal(200);
    //   JSON.parse(response.text).should.deepEqual({
    //     exists: false,
    //   });
    // });

    // it("redirects to connect", async () => {
    //   const response = await request(app).get(
    //     "/authenticate/github?success=http://test.example.com/success&newuser=http://test.example.com/newuser"
    //   );
    //   response.header["set-cookie"].should.containEql(
    //     "border-patrol-success-redirect=http://test.example.com/success; path=/; domain=test.example.com"
    //   );
    //   response.header["set-cookie"].should.containEql(
    //     "border-patrol-newuser-redirect=http://test.example.com/newuser; path=/; domain=test.example.com"
    //   );
    //   response.text.should.equal(
    //     `Redirecting to <a href="/connect/github">/connect/github</a>.`
    //   );
    // });

    // it("creates a user", async () => {
    //   const response = await request(app)
    //     .post("/users")
    //     .send({ userId: "jeswin" })
    //     .set("border-patrol-jwt", "some_jwt");

    //   const cookies = (response.header["set-cookie"] as Array<
    //     string
    //   >).flatMap((x) => x.split(";"));
    //   cookies.should.containEql("border-patrol-jwt=some_other_jwt");
    //   cookies.should.containEql("border-patrol-domain=test.example.com");
    //   response.text.should.equal(
    //     `{"border-patrol-jwt":"some_other_jwt","border-patrol-user-id":"jeswin","border-patrol-domain":"test.example.com"}`
    //   );
    // });
  });
}
