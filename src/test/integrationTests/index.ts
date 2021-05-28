import { startApp } from "../..";
import request = require("supertest");
import { join } from "path";
import { readFileSync } from "fs";
import should = require("should");
import { PodInfo } from "../../domain/pod/getPods";
import { GetPodsAPIResult } from "../../api/pods/getPods";
import { CreatePodAPIResult } from "../../api/pods/createPod";

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

    before(async () => {
      const service = await startApp(port, configFilePath);
      app = service.listen();
    });

    it("creates a pod", async () => {
      const response = await request(app)
        .post("/pods")
        .set("Host", process.env.WEBPODS_TEST_HOSTNAME as string)
        .set("Authorization", `Bearer ${jwt}`);

      response.status.should.equal(200);
      const apiResult: CreatePodAPIResult = JSON.parse(response.text);
      should.exist(apiResult.hostname);
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
