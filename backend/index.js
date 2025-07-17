import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

(async () => {
  try {
    await pool.connect();
    console.log('Connected to PostgreSQL successfully');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err);
  }
})();

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(403).send('No token provided');
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Invalid token');
    req.userId = decoded.userId;
    next();
  });
}

app.get('/', (req, res) => {
  res.send('Welcome to the Express + PostgreSQL API');
});

app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send('Failed to fetch users');
  }
});

app.get('/api/users/projects', verifyToken, async (req, res) => {
  const { id } = req.query;
  try {
    const result = await pool.query(
      `SELECT 
         p.pid,
         p.pname,
         p.description,
         p.start_date,
         p.completion_date,
         u.username AS user_name,
         lead.rname AS team_lead_name,
         lead.designation AS team_lead_designation,
         (
           SELECT json_agg(json_build_object(
             'rid', res.rid,
             'rname', res.rname,
             'designation', res.designation
           ))
           FROM resources res
           WHERE res.projectid = p.pid
         ) AS team_members
       FROM users u
       JOIN projects p ON u.id = p.userid
       LEFT JOIN projectlead pl ON p.pid = pl.projectid
       LEFT JOIN resources lead ON pl.leadid = lead.rid
       WHERE u.id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/projects/:pid', verifyToken, async (req, res) => {
  const { pid } = req.params;
  try {
    await pool.query('BEGIN');
    await pool.query('UPDATE resources SET projectid=NULL WHERE projectid = $1', [pid]);
    await pool.query('DELETE FROM projectlead WHERE projectid = $1', [pid]);
    const result = await pool.query('DELETE FROM projects WHERE pid = $1 RETURNING *', [pid]);
    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Project not found' });
    }
    await pool.query('COMMIT');
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, email, age, phone, password } = req.body;
  try {
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, age, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, age, phone, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Insert failed');
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      age: user.age,
      phone: user.phone,
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/resources/unassigned', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources WHERE projectid IS NULL');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching resources');
  }
});

app.post('/api/projects', verifyToken, async (req, res) => {
  const { pname, description, start_date, completion_date, teamLeadId, resourceIds } = req.body;
  const userId = req.userId;
  if (!pname || !userId || !teamLeadId || !Array.isArray(resourceIds)) {
    return res.status(400).json({ message: 'Invalid request data' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO projects (pname, description, start_date, completion_date, userid)
       VALUES ($1, $2, $3, $4, $5) RETURNING pid`,
      [pname, description, start_date, completion_date, userId]
    );
    const projectId = result.rows[0].pid;
    await client.query(`INSERT INTO projectlead (leadid, projectid) VALUES ($1, $2)`, [teamLeadId, projectId]);
    for (const rid of resourceIds) {
      await client.query(`UPDATE resources SET projectid = $1 WHERE rid = $2`, [projectId, rid]);
    }
    await client.query('COMMIT');
    res.status(201).json({ message: 'Project created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).send('Error creating project');
  } finally {
    client.release();
  }
});

app.get('/api/projects', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*, 
        u.username AS created_by,
        r.rname AS team_lead_name
      FROM projects p
      JOIN users u ON p.userid = u.id
      LEFT JOIN projectlead pl ON p.pid = pl.projectid
      LEFT JOIN resources r ON pl.leadid = r.rid
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching projects');
  }
});

app.use((req, res) => {
  res.status(404).send('Route not found');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
