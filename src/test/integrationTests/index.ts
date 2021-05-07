import { startApp } from "../..";
import request = require("supertest");

let app: any;

export default function run(
  port: number,
  configDir: string,
  dbConfig: { path: string }
) {
  describe("integration tests", async () => {
    let app: any;

    before(async () => {
      const service = await startApp(port, configDir);
      app = service.listen();
    });

    it("creates a pod", async () => {
      const token =
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImp0aSI6IjFlMThmYWE0LWMyNTItNGQ3Yy1hNzU0LTJiYWVjNzM4NDgxZSIsImlhdCI6MTYyMDM3ODQyOSwiZXhwIjoxNjIwMzgyMDI5fQ.whjZQpOsQtvax9JmWh3XrRtvEMTHjFlLJNEROW6h3iE";
      const response = await request(app)
        .post("/pods")
        .set("Authorization", `Bearer ${token}`);
      response.status.should.equal(200);
      console.log(response.text);
      JSON.parse(response.text).should.deepEqual({
        exists: true,
      });
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
