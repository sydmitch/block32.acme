require('dotenv').config();
const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL);
const app = express()

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/api/flavors', async (req, res, next) => {
  try {
    const SQL = /*sql*/`
    SELECT * FROM flavors
    `;
    const response = await client.query(SQL);
    console.log('response is =', response.rows);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.post('api/flavors', async (req, res, next) => {
  try {
    console.log('req.body => ', req.body);
    const SQL = /*sql*/ `
      INSERT INTO flavors(txt) VALUES($1) RETURNING *;
    `
    const response = await client.query(SQL, [req.body.txt]);
    console.log('response rows', response.rows);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put('api/flavors', async (req, res, next) => {
  try{
    console.log('req.body => ', req.body);
    const SQL = /*sql*/ `
      UPDATE flavors
      SET txt=$1, is_favorite=$2, updated_at=now()
      WHERE id=$3
      RETURNING *
    `
    console.log('req.params => ', req.params);
    const response = await client.query(SQL, [req.body.txt, req.body.is_favorite, req.params.id]);
    console.log('response => ', response.rows);
    res.send(response.rows[0]);
  } catch (error) {
    next(error)
  }
});

const init = async () => {
  await client.connect();
  console.log('connected to database');
  let SQL = /*sql*/`
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      txt VARCHAR(255) NOT NULL,
      is_favorite BOOLEAN DEFAULT FALSE
    );
    INSERT INTO flavors(txt, is_favorite) VALUES('vanilla', true);
    INSERT INTO flavors(txt, is_favorite) VALUES('chocolate', false);
  `;
  await client.query(SQL);
  console.log('data seeded');
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
};

init();