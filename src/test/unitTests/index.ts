import { join } from "path";
import { readFileSync } from "fs";
import jwtVerification from "./jwtVerification";

export default function run(dbConfig: { database: string }, configDir: string) {
  async function selectAndMatchRows(
    table: string,
    count: number,
    rowToMatch: number,
    props: any
  ) {
    // const pool = new pg.Pool(dbConfig);
    // const { rows } = await pool.query(`SELECT * FROM "${table}"`);
    // rows.length.should.equal(count);
    // Object.keys(props).forEach((k) => {
    //   props[k].should.equal(rows[rowToMatch][k]);
    // });
  }

  describe("unit tests", async () => {
    async function writeSampleData() {
      // const pool = new pg.Pool(dbConfig);
      // const sampleDataSQL = readFileSync(
      //   join(__dirname, "./sample-data.sql")
      // ).toString();
      // await pool.query(sampleDataSQL);
    }

    jwtVerification();

    // it("localAccount.createLocalUser() creates a local user", async () => {
    //   const result = await localAccountModule.createLocalUser(
    //     "jeswin",
    //     "secret"
    //   );
    //   (result as any).jwt = "something";
    //   result.should.deepEqual({
    //     created: true,
    //     jwt: "something",
    //     tokens: {
    //       userId: "jeswin",
    //       providerUserId: "jeswin",
    //       provider: "local",
    //     },
    //   });
    //   await selectAndMatchRows("user", 1, 0, { id: "jeswin" });
    //   await selectAndMatchRows("local_user_auth", 1, 0, { user_id: "jeswin" });
    // });
  });
}
