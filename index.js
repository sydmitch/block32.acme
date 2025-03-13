require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.get('/api/flavors', async (req, res, next) => {
  try {
    const SQL = /*sql*/`
    SELECT * FROM flavors
    `;
    const response = await client.query(SQL);
    console.log('response is = ', response.rows);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = /*sql*/`
      SELECT * FROM flavors WHERE id = $1;
    `;
    const response = await client.query(SQL, [req.params.id]);
    if (response.rows.length === 0) {
      return res.status(404).send({ error: "Flavor not found" });
    }
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/flavors', async (req, res, next) => {
  try {
    console.log('req.body => ', req.body);
    const SQL = /*sql*/ `
      INSERT INTO flavors(flavorName, is_favorite) VALUES($1, $2) RETURNING *;
    `
    const response = await client.query(SQL, [req.body.flavorName, req.body.is_favorite]);
    console.log('response rows', response.rows);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put('/api/flavors/:id', async (req, res, next) => {
  try {
    console.log('req.body => ', req.body);
    const SQL = /*sql*/ `
      UPDATE flavors
      SET flavorName=$1, is_favorite=$2, updated_at=now()
      WHERE id=$3
      RETURNING *
    `
    console.log('req.params => ', req.params);
    const response = await client.query(SQL, [req.body.flavorName, req.body.is_favorite, req.params.id]);
    console.log('response => ', response.rows);
    res.send(response.rows[0]);
  } catch (error) {
    next(error)
  }
});

app.delete('/api/flavors/:id', async (req, res, next)=> {
  try {
    const SQL = /*sql*/`
      DELETE from flavors
      WHERE id = $1
    `
    const response = await client.query(SQL, [req.params.id])
    res.sendStatus(204)
  } catch (ex) {
    next(ex)
  }
});



async function init() {
  await client.connect();
  console.log('Connected to database');
  const SQL = /*sql*/`
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      flavorName VARCHAR(255) NOT NULL,
      is_favorite BOOLEAN DEFAULT FALSE
    );
    INSERT INTO flavors(flavorName, is_favorite) VALUES('vanilla', TRUE);
    INSERT INTO flavors(flavorName, is_favorite) VALUES('chocolate', FALSE);
    INSERT INTO flavors(flavorName, is_favorite) VALUES('cookies and cream', FALSE);
    INSERT INTO flavors(flavorName, is_favorite) VALUES('peanut butter cup', TRUE);
    INSERT INTO flavors(flavorName, is_favorite) VALUES('strawberry', TRUE);
    INSERT INTO flavors(flavorName, is_favorite) VALUES('mint chocolate chip', FALSE);
  `;
  await client.query(SQL);
  console.log("Table created successfully");
  const PORT = process.env.PORT || 3000;
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

init();