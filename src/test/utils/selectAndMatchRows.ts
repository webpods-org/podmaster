// import { IDbConfig } from "psychopiggy";
// import pg = require("pg");

// export default async function selectAndMatchRows(
//   table: string,
//   count: number,
//   rowToMatch: number,
//   props: any,
//   dbConfig: IDbConfig
// ) {
//   const pool = new pg.Pool(dbConfig);
//   const { rows } = await pool.query(`SELECT * FROM "${table}"`);
//   rows.length.should.equal(count);
//   Object.keys(props).forEach((k) => {
//     props[k].should.equal(rows[rowToMatch][k]);
//   });
// }