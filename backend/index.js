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

// Rate limiting configuration - more permissive for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000, // 1000 requests per minute (much more permissive)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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
  
  console.log('Token verification debug:', {
    hasAuthHeader: !!authHeader,
    tokenLength: token ? token.length : 0,
    endpoint: req.path,
    method: req.method
  });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).send('Invalid token');
    }
    req.userId = decoded.userId;
    console.log('Token verified successfully, userId:', req.userId);
    next();
  });
}

// Helper to get user by id
async function getUserById(id) {
  const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
  return result.rows[0];
}

// Middleware to check role
function requireRole(roles) {
  return async (req, res, next) => {
    try {
      const user = await getUserById(req.userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }
      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ message: 'Role check failed' });
    }
  };
}

app.get('/', (req, res) => {
  res.send('Welcome to the Express + PostgreSQL API');
});

// Test endpoint to check database schema
app.get('/api/test-schema', async (req, res) => {
  try {
    // Check tasks table structure
    const tasksSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      ORDER BY ordinal_position
    `);
    
    // Check sprints table structure
    const sprintsSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sprints' 
      ORDER BY ordinal_position
    `);
    
    // Check projects table structure
    const projectsSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    res.json({
      tasks: tasksSchema.rows,
      sprints: sprintsSchema.rows,
      projects: projectsSchema.rows
    });
  } catch (err) {
    console.error('Schema test error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Test database connection and tasks table
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM tasks');
    res.json({ 
      message: 'Database connection working!', 
      taskCount: result.rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test task status update endpoint
app.put('/api/test-task-update/:taskId', verifyToken, async (req, res) => {
  try {
    console.log('Test endpoint called with:', {
      taskId: req.params.taskId,
      body: req.body,
      userId: req.userId,
      headers: req.headers
    });
    
    res.json({ 
      message: 'Test endpoint working!',
      taskId: req.params.taskId,
      body: req.body,
      userId: req.userId
    });
  } catch (err) {
    console.error('Test endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Simple task status update endpoint
app.put('/api/tasks/:taskId/status-simple', verifyToken, async (req, res) => {
  try {
    console.log('Simple task status update called');
    const { taskId } = req.params;
    const { status } = req.body;
    
    console.log('Request data:', { taskId, status, userId: req.userId });
    
    // Just update the status without any complex logic
    const updateQuery = status === 'completed' 
      ? 'UPDATE tasks SET status = $1, completed_at = NOW() WHERE task_id = $2 RETURNING *'
      : 'UPDATE tasks SET status = $1 WHERE task_id = $2 RETURNING *';
    
    const result = await pool.query(updateQuery, [status, taskId]);
    
    console.log('Update result:', result.rows);
    res.json({ message: 'Status updated successfully', task: result.rows[0] });
    
  } catch (err) {
    console.error('Simple task update error:', err);
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
});

// Alternative task status update endpoint with relaxed permissions
app.put('/api/tasks/:taskId/status-relaxed', verifyToken, async (req, res) => {
  try {
    console.log('Relaxed task status update called');
    const { taskId } = req.params;
    const { status } = req.body;
    
    console.log('Request data:', { taskId, status, userId: req.userId });
    
    // Check if task exists
    const taskRes = await pool.query('SELECT * FROM tasks WHERE task_id = $1', [taskId]);
    
    if (taskRes.rows.length === 0) {
      console.log('Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found.' });
    }
    
    const task = taskRes.rows[0];
    console.log('Found task:', task);
    
    // Keep the original status value (don't convert 'done' to 'completed')
    let finalStatus = status;
    
    console.log('Updating task status:', { taskId, fromStatus: status, toStatus: finalStatus });
    
    // Update the task status without permission check
    const updateQuery = finalStatus === 'done' 
      ? 'UPDATE tasks SET status = $1, completed_at = NOW() WHERE task_id = $2 RETURNING *'
      : 'UPDATE tasks SET status = $1 WHERE task_id = $2 RETURNING *';
    
    const result = await pool.query(updateQuery, [finalStatus, taskId]);
    
    console.log('Update result:', result.rows);
    res.json({ message: 'Status updated successfully', task: result.rows[0] });
    
  } catch (err) {
    console.error('Relaxed task update error:', err);
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
});

// Fix sprints table to add description column
app.post('/api/fix-sprints-description', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    // Add description column if it doesn't exist
    await pool.query('ALTER TABLE sprints ADD COLUMN IF NOT EXISTS description TEXT');
    
    // Update existing sprints to have description if they don't have one
    await pool.query(`
      UPDATE sprints 
      SET description = name 
      WHERE description IS NULL OR description = ''
    `);
    
    res.json({ message: 'Sprints table updated with description column' });
  } catch (err) {
    console.error('Error fixing sprints description:', err);
    res.status(500).json({ message: 'Failed to fix sprints description', error: err.message });
  }
});

// Get pending sprint approvals for project managers
app.get('/api/sprint-approvals', verifyToken, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    
    if (user.role !== 'project_manager') {
      return res.status(403).json({ message: 'Only project managers can view approvals.' });
    }
    
    // Get sprints that need approval from projects managed by this user
    const result = await pool.query(`
      SELECT 
        s.sprint_id,
        s.name,
        s.description,
        s.start_date,
        s.end_date,
        s.pending_approval,
        s.approval_data::text as approval_data,
        p.name as project_name,
        u.name as requested_by_name,
        u.email as requested_by_email
      FROM sprints s
      JOIN projects p ON s.project_id = p.project_id
      JOIN users u ON s.approval_data->>'requested_by' = u.user_id::text
      WHERE s.pending_approval = TRUE 
        AND p.created_by = $1
      ORDER BY s.approval_data->>'requested_at' DESC
    `, [user.user_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sprint approvals:', err);
    res.status(500).json({ message: 'Failed to fetch approvals.' });
  }
});

// Approve sprint edit request
app.put('/api/sprint-approvals/:sprintId/approve', verifyToken, async (req, res) => {
  try {
    const { sprintId } = req.params;
    const user = await getUserById(req.userId);
    
    if (user.role !== 'project_manager') {
      return res.status(403).json({ message: 'Only project managers can approve sprint edits.' });
    }
    
    // Get sprint and check if user is project manager for this project
    const sprintRes = await pool.query('SELECT * FROM sprints WHERE sprint_id = $1', [sprintId]);
    if (sprintRes.rows.length === 0) return res.status(404).json({ message: 'Sprint not found.' });
    
    const sprint = sprintRes.rows[0];
    const projectRes = await pool.query('SELECT created_by FROM projects WHERE project_id = $1', [sprint.project_id]);
    if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found.' });
    if (projectRes.rows[0].created_by !== user.user_id) {
      return res.status(403).json({ message: 'Only the project manager can approve this sprint edit.' });
    }
    
    if (!sprint.pending_approval) {
      return res.status(400).json({ message: 'No pending approval for this sprint.' });
    }
    
    // Apply the approved changes
    if (!sprint.approval_data) {
      console.log('No approval data found for sprint:', sprintId);
      return res.status(400).json({ message: 'No approval data found for this sprint.' });
    }
    
    let approvalData;
    console.log('Raw approval data type:', typeof sprint.approval_data);
    console.log('Raw approval data:', sprint.approval_data);
    
    // Check if approval_data is already an object (from JSONB) or needs parsing
    if (typeof sprint.approval_data === 'object' && sprint.approval_data !== null) {
      approvalData = sprint.approval_data;
      console.log('Approval data is already an object:', approvalData);
    } else if (typeof sprint.approval_data === 'string') {
      try {
        approvalData = JSON.parse(sprint.approval_data);
        console.log('Parsed approval data from string:', approvalData);
      } catch (parseError) {
        console.error('Error parsing approval data:', parseError);
        console.log('Raw approval data string:', sprint.approval_data);
        return res.status(400).json({ message: 'Invalid approval data format.' });
      }
    } else {
      console.error('Unexpected approval data type:', typeof sprint.approval_data);
      return res.status(400).json({ message: 'Invalid approval data format.' });
    }
    
    // Validate required fields
    if (!approvalData.proposed_name || !approvalData.proposed_description) {
      console.log('Missing required fields in approval data:', {
        proposed_name: approvalData.proposed_name,
        proposed_description: approvalData.proposed_description
      });
      return res.status(400).json({ message: 'Incomplete approval data. Missing required fields.' });
    }
    
    try {
      await pool.query(
        'UPDATE sprints SET name = $1, description = $2, start_date = $3, end_date = $4, pending_approval = FALSE, approval_data = NULL WHERE sprint_id = $5',
        [
          approvalData.proposed_name,
          approvalData.proposed_description,
          approvalData.proposed_start_date,
          approvalData.proposed_end_date,
          sprintId
        ]
      );
    } catch (updateError) {
      console.error('Error updating sprint approval:', updateError);
      return res.status(500).json({ message: 'Failed to apply sprint approval.' });
    }
    
    res.json({ message: 'Sprint edit approved and applied.' });
  } catch (err) {
    console.error('Error approving sprint edit:', err);
    res.status(500).json({ message: 'Failed to approve sprint edit.' });
  }
});

// Reject sprint edit request
app.put('/api/sprint-approvals/:sprintId/reject', verifyToken, async (req, res) => {
  try {
    const { sprintId } = req.params;
    const user = await getUserById(req.userId);
    
    if (user.role !== 'project_manager') {
      return res.status(403).json({ message: 'Only project managers can reject sprint edits.' });
    }
    
    // Get sprint and check if user is project manager for this project
    const sprintRes = await pool.query('SELECT * FROM sprints WHERE sprint_id = $1', [sprintId]);
    if (sprintRes.rows.length === 0) return res.status(404).json({ message: 'Sprint not found.' });
    
    const sprint = sprintRes.rows[0];
    const projectRes = await pool.query('SELECT created_by FROM projects WHERE project_id = $1', [sprint.project_id]);
    if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found.' });
    if (projectRes.rows[0].created_by !== user.user_id) {
      return res.status(403).json({ message: 'Only the project manager can reject this sprint edit.' });
    }
    
    if (!sprint.pending_approval) {
      return res.status(400).json({ message: 'No pending approval for this sprint.' });
    }
    
    // Clear the pending approval without applying changes
    try {
      await pool.query(
        'UPDATE sprints SET pending_approval = FALSE, approval_data = NULL WHERE sprint_id = $1',
        [sprintId]
      );
    } catch (updateError) {
      console.error('Error updating sprint rejection:', updateError);
      return res.status(500).json({ message: 'Failed to reject sprint edit.' });
    }
    
    res.json({ message: 'Sprint edit rejected.' });
  } catch (err) {
    console.error('Error rejecting sprint edit:', err);
    res.status(500).json({ message: 'Failed to reject sprint edit.' });
  }
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
    
    // First, get all team leads and developers assigned to this project
    const teamLeadsRes = await pool.query('SELECT team_lead_id FROM project_team_leads WHERE project_id = $1', [pid]);
    const teamLeadIds = teamLeadsRes.rows.map(row => row.team_lead_id);
    
    // Get all developers assigned to this project's team leads
    let developerIds = [];
    if (teamLeadIds.length > 0) {
      const developersRes = await pool.query(
        'SELECT developer_id FROM team_lead_developers WHERE team_lead_id = ANY($1)',
        [teamLeadIds]
      );
      developerIds = developersRes.rows.map(row => row.developer_id);
    }
    
    // Remove all team assignments for this project
    await pool.query('DELETE FROM team_lead_developers WHERE team_lead_id = ANY($1)', [teamLeadIds]);
    await pool.query('DELETE FROM project_team_leads WHERE project_id = $1', [pid]);
    
    // Delete the project
    const result = await pool.query('DELETE FROM projects WHERE project_id = $1 RETURNING *', [pid]);
    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Project not found' });
    }
    
    await pool.query('COMMIT');
    
    // Return information about freed up team members
    const freedTeamMembers = {
      teamLeads: teamLeadIds.length,
      developers: developerIds.length,
    };
    
    res.status(200).json(freedTeamMembers);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/users', verifyToken, async (req, res) => {
  const { name, email, password, role, specialization, projectName, projectDescription } = req.body;
  // Only admin can create project_manager, only project_manager can create team_lead/developer
  try {
    const creator = await getUserById(req.userId);
    if (!creator) return res.status(401).json({ message: 'Unauthorized' });
    if (role === 'admin') {
      return res.status(403).json({ message: 'Cannot create admin accounts via API' });
    }
    if (role === 'project_manager' && creator.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create project managers' });
    }
    if ((role === 'team_lead' || role === 'developer') && creator.role !== 'project_manager') {
      return res.status(403).json({ message: 'Only project managers can create team leads or developers' });
    }
    if (role === 'developer' && !specialization) {
      return res.status(400).json({ message: 'Developer must have specialization' });
    }
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (role === 'project_manager') {
      // Create project manager without requiring project fields
      const result = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role, created_at',
        [name, email, hashedPassword, 'project_manager']
      );
      res.status(201).json(result.rows[0]);
      return;
    }
    // Default: create user only
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, specialization) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role, specialization, created_at',
      [name, email, hashedPassword, role, specialization || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Insert failed');
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Log the login attempt
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    console.log('User found:', { id: user.user_id, role: user.role });

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log('Password match result:', passwordMatch);

      if (!passwordMatch) {
        console.log('Password mismatch for user:', email);
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
      
      const response = {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        created_at: user.created_at,
        token
      };

      console.log('Login successful for user:', email);
      res.json(response);
      
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError);
      res.status(500).json({ message: 'Authentication error' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
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
  const { pname, description, start_date, completion_date, teamLeadId, developerIds } = req.body;
  const userId = req.userId;
  if (!pname || !description || !start_date || !completion_date) {
    return res.status(400).json({ message: 'Invalid request data' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Team lead and developer assignments are now handled separately via ManageProjectTeam
    
    // 3. Create project
    const projectResult = await client.query(
      'INSERT INTO projects (name, description, created_by, created_at, start_date, completion_date) VALUES ($1, $2, $3, NOW(), $4, $5) RETURNING project_id',
      [pname, description, userId, start_date, completion_date]
    );
    const projectId = projectResult.rows[0].project_id;
    
    // Team lead and developer assignments are now handled separately via ManageProjectTeam
    
    await client.query('COMMIT');
    res.status(201).json({ project_id: projectId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message || 'Error creating project' });
  } finally {
    client.release();
  }
});

app.get('/api/projects', verifyToken, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    let projectsQuery = '';
    let params = [];
    if (user.role === 'admin') {
      projectsQuery = `SELECT * FROM projects WHERE status != 'completed' AND status != 'deleted'`;
    } else if (user.role === 'project_manager') {
      // Project managers can only see projects they created
      projectsQuery = `SELECT * FROM projects WHERE created_by = $1 AND status != 'completed' AND status != 'deleted'`;
      params = [user.user_id];
    } else if (user.role === 'team_lead') {
      projectsQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        WHERE ptl.team_lead_id = $1 AND p.status != 'completed' AND p.status != 'deleted'`;
      params = [user.user_id];
    } else if (user.role === 'developer') {
      projectsQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        JOIN team_lead_developers tld ON ptl.team_lead_id = tld.team_lead_id
        WHERE tld.developer_id = $1 AND p.status != 'completed' AND p.status != 'deleted'`;
      params = [user.user_id];
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }
    const projectsResult = await pool.query(projectsQuery, params);
    const projects = projectsResult.rows;
    // For each project, get team lead and developers
    for (const project of projects) {
      if (user.role === 'team_lead') {
        // Only include this team lead and their developers
        project.team_leads = undefined;
        // Get only this team lead
        const teamLeadRes = await pool.query(
          `SELECT u.user_id, u.name, u.email FROM project_team_leads ptl
           JOIN users u ON ptl.team_lead_id = u.user_id
           WHERE ptl.project_id = $1 AND ptl.team_lead_id = $2`,
          [project.project_id, user.user_id]
        );
        project.team_lead = teamLeadRes.rows[0] || null;
        // Get only developers assigned to this team lead
        const devsRes = await pool.query(
          `SELECT u.user_id, u.name, u.email, u.specialization, tld.team_lead_id FROM team_lead_developers tld
           JOIN users u ON tld.developer_id = u.user_id
           WHERE tld.team_lead_id = $1`,
          [user.user_id]
        );
        project.developers = devsRes.rows;
      } else if (user.role === 'developer') {
        // For developer, get their assigned team lead for this project
        const tlRes = await pool.query(
          `SELECT u.user_id, u.name, u.email FROM team_lead_developers tld
           JOIN project_team_leads ptl ON tld.team_lead_id = ptl.team_lead_id
           JOIN users u ON tld.team_lead_id = u.user_id
           WHERE tld.developer_id = $1 AND ptl.project_id = $2 LIMIT 1`,
          [user.user_id, project.project_id]
        );
        project.team_lead = tlRes.rows[0] || null;
        // Only include this developer's info
        const devRes = await pool.query(
          `SELECT u.user_id, u.name, u.email, u.specialization FROM users u WHERE u.user_id = $1`,
          [user.user_id]
        );
        project.developers = devRes.rows;
      } else {
        // Get all team leads
        const teamLeadsRes = await pool.query(
          `SELECT u.user_id, u.name, u.email FROM project_team_leads ptl
           JOIN users u ON ptl.team_lead_id = u.user_id
           WHERE ptl.project_id = $1`,
          [project.project_id]
        );
        project.team_leads = teamLeadsRes.rows;
        // Get all developers for all team leads
        const devsRes = await pool.query(
          `SELECT u.user_id, u.name, u.email, u.specialization, tld.team_lead_id FROM team_lead_developers tld
           JOIN users u ON tld.developer_id = u.user_id
           WHERE tld.team_lead_id = ANY(ARRAY(SELECT team_lead_id FROM project_team_leads WHERE project_id = $1))`,
          [project.project_id]
        );
        project.developers = devsRes.rows;
      }
    }
    res.json(projects);
  } catch (err) {
    res.status(500).send('Error fetching projects');
  }
});

app.put('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  try {
    const user = await getUserById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update project managers.' });
    }
    const target = await getUserById(id);
    if (!target || target.role !== 'project_manager') {
      return res.status(404).json({ message: 'Project manager not found.' });
    }

    // Build update query dynamically based on whether password is provided
    let query = 'UPDATE users SET name = $1, email = $2';
    let values = [name, email];

    // If password is provided, hash it and add to update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = $' + (values.length + 1);
      values.push(hashedPassword);
    }

    // Add WHERE clause
    query += ' WHERE user_id = $' + (values.length + 1);
    values.push(id);

    await pool.query(query, values);
    res.json({ message: 'Project manager updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project manager.' });
  }
});

app.delete('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await getUserById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete project managers.' });
    }
    const target = await getUserById(id);
    if (!target || target.role !== 'project_manager') {
      return res.status(404).json({ message: 'Project manager not found.' });
    }
    await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
    res.json({ message: 'Project manager deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project manager.' });
  }
});

// Project manager can add/update multiple team leads and developers for their project
app.post('/api/projects/:projectId/team', verifyToken, async (req, res) => {
  const { projectId } = req.params;
  const { teamLeads, developers } = req.body;
  if (!teamLeads || !Array.isArray(teamLeads) || !developers || !Array.isArray(developers)) {
    return res.status(400).json({ message: 'Invalid team data.' });
  }
  const client = await pool.connect();
  try {
    // Check project and permissions
    const projectRes = await client.query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
    if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found.' });
    const project = projectRes.rows[0];
    const user = await getUserById(req.userId);
    if (!user || user.role !== 'project_manager' || project.created_by !== user.user_id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    await client.query('BEGIN');
    // TEAM LEADS: Remove old, add/update new
    // 1. Get current team leads for this project
    const currentTLRes = await client.query('SELECT team_lead_id FROM project_team_leads WHERE project_id = $1', [projectId]);
    const currentTLIds = currentTLRes.rows.map(r => r.team_lead_id);
    const newTLIds = [];
    for (const tl of teamLeads) {
      let tlId;
      const check = await client.query('SELECT * FROM users WHERE email = $1', [tl.email]);
      if (check.rows.length > 0) {
        // Update
        tlId = check.rows[0].user_id;
        await client.query('UPDATE users SET name = $1' + (tl.password ? ', password = $2' : '') + ' WHERE user_id = $3',
          tl.password
            ? [tl.name, await bcrypt.hash(tl.password, 10), tlId]
            : [tl.name, tlId]
        );
      } else {
        // Create
        const hashed = await bcrypt.hash(tl.password, 10);
        const ins = await client.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id',
          [tl.name, tl.email, hashed, 'team_lead']
        );
        tlId = ins.rows[0].user_id;
      }
      // Link to project if not already
      const link = await client.query('SELECT * FROM project_team_leads WHERE project_id = $1 AND team_lead_id = $2', [projectId, tlId]);
      if (link.rows.length === 0) {
        await client.query('INSERT INTO project_team_leads (project_id, team_lead_id) VALUES ($1, $2)', [projectId, tlId]);
      }
      newTLIds.push(tlId);
    }
    // 2. Remove team leads not in new list
    for (const oldId of currentTLIds) {
      if (!newTLIds.includes(oldId)) {
        await client.query('DELETE FROM project_team_leads WHERE project_id = $1 AND team_lead_id = $2', [projectId, oldId]);
      }
    }
    // DEVELOPERS: Remove old, add new (map to specific team leads)
    // 1. Build a map of teamLeadIdx to teamLeadId
    const idxToTLId = newTLIds;
    // 2. Get all current developer mappings for this project (across all team leads)
    const allTLIds = newTLIds.length > 0 ? newTLIds : [-1];
    const currentDevLinksRes = await client.query(
      'SELECT tld.team_lead_id, tld.developer_id FROM team_lead_developers tld WHERE tld.team_lead_id = ANY($1)', [allTLIds]
    );
    const currentDevLinks = currentDevLinksRes.rows.map(r => ({ team_lead_id: r.team_lead_id, developer_id: r.developer_id }));
    // 3. For each developer in form, if email exists, update; else, create
    const newDevLinks = [];
    for (const dev of developers) {
      let devId;
      const check = await client.query('SELECT * FROM users WHERE email = $1', [dev.email]);
      if (check.rows.length > 0) {
        // Update
        devId = check.rows[0].user_id;
        await client.query('UPDATE users SET name = $1, specialization = $2' + (dev.password ? ', password = $3' : '') + ' WHERE user_id = $4',
          dev.password
            ? [dev.name, dev.specialization, await bcrypt.hash(dev.password, 10), devId]
            : [dev.name, dev.specialization, devId]
        );
      } else {
        // Create
        const hashed = await bcrypt.hash(dev.password, 10);
        const ins = await client.query(
          'INSERT INTO users (name, email, password, role, specialization) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
          [dev.name, dev.email, hashed, 'developer', dev.specialization]
        );
        devId = ins.rows[0].user_id;
      }
      // Map to selected team lead
      const teamLeadIdx = dev.teamLeadIdx || 0;
      const teamLeadId = idxToTLId[teamLeadIdx];
      if (!teamLeadId) continue;
      // Link to team lead if not already
      const link = await client.query('SELECT * FROM team_lead_developers WHERE team_lead_id = $1 AND developer_id = $2', [teamLeadId, devId]);
      if (link.rows.length === 0) {
        await client.query('INSERT INTO team_lead_developers (team_lead_id, developer_id) VALUES ($1, $2)', [teamLeadId, devId]);
      }
      newDevLinks.push({ team_lead_id: teamLeadId, developer_id: devId });
    }
    // 4. Remove developer links not in new list
    for (const oldLink of currentDevLinks) {
      if (!newDevLinks.some(nl => nl.team_lead_id === oldLink.team_lead_id && nl.developer_id === oldLink.developer_id)) {
        await client.query('DELETE FROM team_lead_developers WHERE team_lead_id = $1 AND developer_id = $2', [oldLink.team_lead_id, oldLink.developer_id]);
      }
    }
    await client.query('COMMIT');
    // Return updated team
    const updatedTeamLeads = (await client.query('SELECT u.user_id, u.name, u.email FROM project_team_leads ptl JOIN users u ON ptl.team_lead_id = u.user_id WHERE ptl.project_id = $1', [projectId])).rows;
    let updatedDevs = [];
    if (newTLIds.length > 0) {
      updatedDevs = (await client.query('SELECT u.user_id, u.name, u.email, u.specialization FROM team_lead_developers tld JOIN users u ON tld.developer_id = u.user_id WHERE tld.team_lead_id = $1', [newTLIds[0]])).rows;
    }
    res.json({ team_leads: updatedTeamLeads, developers: updatedDevs });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message || 'Failed to update team.' });
  } finally {
    client.release();
  }
});

// Add a backlog item to a project (project manager only)
app.post('/api/projects/:projectId/backlogs', verifyToken, async (req, res) => {
  const { projectId } = req.params;
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required.' });
  try {
    const user = await getUserById(req.userId);
    
    // Check if user has access to this project
    let projectQuery = '';
    let params = [];
    
    if (user.role === 'project_manager') {
      // Project managers can only add backlog items to projects they created
      projectQuery = 'SELECT * FROM projects WHERE project_id = $1 AND created_by = $2';
      params = [projectId, user.user_id];
    } else if (user.role === 'team_lead') {
      // Check if this user is a team lead for this project
      projectQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        WHERE ptl.team_lead_id = $1 AND p.project_id = $2`;
      params = [user.user_id, projectId];
    } else {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    
    const projectRes = await pool.query(projectQuery, params);
    if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found or access denied.' });
    
    const result = await pool.query(
      'INSERT INTO backlogs (project_id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [projectId, title, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add backlog item.' });
  }
});

// Get all backlog items for a project (project manager only)
app.get('/api/projects/:projectId/backlogs', verifyToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const user = await getUserById(req.userId);
    
    // Check if user has access to this project
    let projectQuery = '';
    let params = [];
    
    if (user.role === 'project_manager') {
      // Project managers can only see backlog items from projects they created
      projectQuery = 'SELECT * FROM projects WHERE project_id = $1 AND created_by = $2';
      params = [projectId, user.user_id];
    } else if (user.role === 'team_lead') {
      // Check if this user is a team lead for this project
      projectQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        WHERE ptl.team_lead_id = $1 AND p.project_id = $2`;
      params = [user.user_id, projectId];
    } else {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    
    const projectRes = await pool.query(projectQuery, params);
    if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found or access denied.' });
    
    const result = await pool.query('SELECT * FROM backlogs WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch backlog items.' });
  }
});

// Delete a backlog item by ID (team lead or project manager)
app.delete('/api/backlogs/:backlogId', verifyToken, async (req, res) => {
  const { backlogId } = req.params;
  try {
    // Optionally: Check if user is allowed to delete this backlog (team lead or project manager)
    const backlogRes = await pool.query('SELECT * FROM backlogs WHERE backlog_id = $1', [backlogId]);
    if (backlogRes.rows.length === 0) return res.status(404).json({ message: 'Backlog not found.' });

    // You can add more permission checks here if needed

    await pool.query('DELETE FROM backlogs WHERE backlog_id = $1', [backlogId]);
    res.json({ message: 'Backlog item deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete backlog item.' });
  }
});

// Move a backlog item to a sprint (project manager only)
app.post('/api/projects/:projectId/backlogs/:backlogId/add-to-sprint', verifyToken, async (req, res) => {
  const { projectId, backlogId } = req.params;
  const { sprintDescription, startDate, endDate } = req.body;
  try {
    const user = await getUserById(req.userId);
    
    // Check if user has access to this project
    let projectQuery = '';
    let params = [];
    
    if (user.role === 'project_manager') {
      // Project managers can only move backlog items from projects they created
      projectQuery = 'SELECT * FROM projects WHERE project_id = $1 AND created_by = $2';
      params = [projectId, user.user_id];
    } else if (user.role === 'team_lead') {
      // Check if this user is a team lead for this project
      projectQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        WHERE ptl.team_lead_id = $1 AND p.project_id = $2`;
      params = [user.user_id, projectId];
    } else {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    
    const projectRes = await pool.query(projectQuery, params);
    if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found or access denied.' });
    
    // First, try to add description column if it doesn't exist
    try {
      await pool.query('ALTER TABLE sprints ADD COLUMN IF NOT EXISTS description TEXT');
    } catch (err) {
      console.log('Description column already exists or error adding it:', err.message);
    }
    
    // Create a new sprint (or you can link to an existing sprint logic)
    const sprintRes = await pool.query(
      'INSERT INTO sprints (project_id, name, description, start_date, end_date, created_by, is_latest) VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING sprint_id',
      [
        projectId,
        sprintDescription || 'Sprint',
        sprintDescription || '', // Use the same value as description
        startDate ? startDate : new Date(),
        endDate ? endDate : new Date(),
        user.user_id
      ]
    );
    const sprintId = sprintRes.rows[0].sprint_id;
    // Move backlog item to sprint (could be by updating a field or just for tracking)
    await pool.query('UPDATE backlogs SET sprint_id = $1 WHERE backlog_id = $2', [sprintId, backlogId]);
    // Delete the backlog item after moving to sprint
    await pool.query('DELETE FROM backlogs WHERE backlog_id = $1', [backlogId]);
    res.json({ message: 'Backlog item added to sprint and removed from backlog.', sprint_id: sprintId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add backlog item to sprint.' });
  }
});

// Edit a sprint (project manager or team lead)
app.put('/api/sprints/:sprintId', verifyToken, async (req, res) => {
  const { sprintId } = req.params;
  const { name, description, start_date, end_date } = req.body;
  
  console.log('Sprint edit request:', { sprintId, name, description, start_date, end_date, userId: req.userId });
  
  try {
    const user = await getUserById(req.userId);
    console.log('User found:', user);
    
    // Get sprint and project
    const sprintRes = await pool.query('SELECT * FROM sprints WHERE sprint_id = $1', [sprintId]);
    if (sprintRes.rows.length === 0) return res.status(404).json({ message: 'Sprint not found.' });
    const sprint = sprintRes.rows[0];
    console.log('Sprint found:', sprint);
    
    // Check if user is project manager for this project
    if (user.role === 'project_manager') {
      const projectRes = await pool.query('SELECT created_by FROM projects WHERE project_id = $1', [sprint.project_id]);
      if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found.' });
      if (projectRes.rows[0].created_by !== user.user_id) {
        return res.status(403).json({ message: 'Only the project manager can edit this sprint.' });
      }
      
      // Project manager can edit directly
      console.log('Project manager editing sprint directly...');
      
      // First, try to add description column if it doesn't exist
      try {
        await pool.query('ALTER TABLE sprints ADD COLUMN IF NOT EXISTS description TEXT');
        console.log('Description column added/verified');
      } catch (err) {
        console.log('Description column already exists or error adding it:', err.message);
      }
      
      // Update sprint with description
      await pool.query(
        'UPDATE sprints SET name = $1, description = $2, start_date = $3, end_date = $4 WHERE sprint_id = $5',
        [name, description, start_date, end_date, sprintId]
      );
      
      console.log('Sprint updated successfully');
      res.json({ message: 'Sprint updated.' });
      
    } else if (user.role === 'team_lead') {
      // Check if user is one of the team leads for this project
      const teamLeadRes = await pool.query('SELECT team_lead_id FROM project_team_leads WHERE project_id = $1', [sprint.project_id]);
      if (teamLeadRes.rows.length === 0) return res.status(403).json({ message: 'No team lead for this project.' });
      
      // Check if current user is one of the team leads
      const isTeamLead = teamLeadRes.rows.some(row => row.team_lead_id === user.user_id);
      if (!isTeamLead) return res.status(403).json({ message: 'Only team leads can edit this sprint.' });
      
      // Team lead needs approval - create approval request
      console.log('Team lead editing sprint - creating approval request...');
      
      // First, try to add approval columns if they don't exist
      try {
        await pool.query('ALTER TABLE sprints ADD COLUMN IF NOT EXISTS description TEXT');
        await pool.query('ALTER TABLE sprints ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT FALSE');
        await pool.query('ALTER TABLE sprints ADD COLUMN IF NOT EXISTS approval_data JSONB');
        console.log('Approval columns added/verified');
      } catch (err) {
        console.log('Approval columns already exist or error adding them:', err.message);
      }
      
      // Store the proposed changes as approval data
      const approvalData = {
        proposed_name: name,
        proposed_description: description,
        proposed_start_date: start_date,
        proposed_end_date: end_date,
        requested_by: user.user_id,
        requested_at: new Date().toISOString(),
        current_name: sprint.name,
        current_description: sprint.description,
        current_start_date: sprint.start_date,
        current_end_date: sprint.end_date
      };
      
      // Update sprint with pending approval status
      await pool.query(
        'UPDATE sprints SET pending_approval = TRUE, approval_data = $1 WHERE sprint_id = $2',
        [JSON.stringify(approvalData), sprintId]
      );
      
      console.log('Approval request created successfully');
      res.json({ message: 'Sprint edit request submitted for approval.' });
      
    } else {
      return res.status(403).json({ message: 'Only project managers and team leads can edit sprints.' });
    }
  } catch (err) {
    console.error('Error updating sprint:', err);
    res.status(500).json({ message: 'Failed to update sprint.' });
  }
});

// Delete a sprint (project manager or team lead)
app.delete('/api/sprints/:sprintId', verifyToken, async (req, res) => {
  const { sprintId } = req.params;
  try {
    const user = await getUserById(req.userId);
    
    // Get sprint and project
    const sprintRes = await pool.query('SELECT * FROM sprints WHERE sprint_id = $1', [sprintId]);
    if (sprintRes.rows.length === 0) return res.status(404).json({ message: 'Sprint not found.' });
    const sprint = sprintRes.rows[0];
    
    // Check if user is project manager for this project
    if (user.role === 'project_manager') {
      const projectRes = await pool.query('SELECT created_by FROM projects WHERE project_id = $1', [sprint.project_id]);
      if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found.' });
      if (projectRes.rows[0].created_by !== user.user_id) {
        return res.status(403).json({ message: 'Only the project manager can delete this sprint.' });
      }
    } else if (user.role === 'team_lead') {
      // Check if user is one of the team leads for this project
      const teamLeadRes = await pool.query('SELECT team_lead_id FROM project_team_leads WHERE project_id = $1', [sprint.project_id]);
      if (teamLeadRes.rows.length === 0) return res.status(403).json({ message: 'No team lead for this project.' });
      
      // Check if current user is one of the team leads
      const isTeamLead = teamLeadRes.rows.some(row => row.team_lead_id === user.user_id);
      if (!isTeamLead) return res.status(403).json({ message: 'Only team leads can delete this sprint.' });
    } else {
      return res.status(403).json({ message: 'Only project managers and team leads can delete sprints.' });
    }
    
    await pool.query('DELETE FROM sprints WHERE sprint_id = $1', [sprintId]);
    res.json({ message: 'Sprint deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete sprint.' });
  }
});

// Project manager assigns a task to a developer for a sprint
app.post('/api/sprints/:sprintId/tasks', verifyToken, async (req, res) => {
  const { sprintId } = req.params;
  const { title, description, assigned_to } = req.body;
  if (!title || !assigned_to) return res.status(400).json({ message: 'Title and assigned_to are required.' });
  try {
    const user = await getUserById(req.userId);
    
    // Get sprint and project
    const sprintRes = await pool.query('SELECT * FROM sprints WHERE sprint_id = $1', [sprintId]);
    if (sprintRes.rows.length === 0) return res.status(404).json({ message: 'Sprint not found.' });
    const sprint = sprintRes.rows[0];
    
    // Check if user is project manager for this project
    if (user.role !== 'project_manager') {
      return res.status(403).json({ message: 'Only project managers can assign tasks.' });
    }
    
    const projectRes = await pool.query('SELECT created_by FROM projects WHERE project_id = $1', [sprint.project_id]);
    if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found.' });
    if (projectRes.rows[0].created_by !== user.user_id) {
      return res.status(403).json({ message: 'Only the project manager can assign tasks for this project.' });
    }
    
    // Create task
    const result = await pool.query(
      'INSERT INTO tasks (sprint_id, assigned_to, created_by, title, description, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [sprintId, assigned_to, req.userId, title, description || '', 'todo']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign task.' });
  }
});

// Get all tasks for a sprint (filtered by role)
app.get('/api/sprints/:sprintId/tasks', verifyToken, async (req, res) => {
  const { sprintId } = req.params;
  try {
    const user = await getUserById(req.userId);
    let query = '';
    let params = [];
    
    if (user.role === 'project_manager') {
      // Project managers can only see tasks for sprints in projects they created
      query = `
        SELECT t.* FROM tasks t
        JOIN sprints s ON t.sprint_id = s.sprint_id
        JOIN projects p ON s.project_id = p.project_id
        WHERE t.sprint_id = $1 AND p.created_by = $2
      `;
      params = [sprintId, user.user_id];
    } else if (user.role === 'team_lead') {
      // Team leads can see all tasks for sprints in projects they lead
      query = `
        SELECT t.* FROM tasks t
        JOIN sprints s ON t.sprint_id = s.sprint_id
        JOIN project_team_leads ptl ON s.project_id = ptl.project_id
        WHERE t.sprint_id = $1 AND ptl.team_lead_id = $2
      `;
      params = [sprintId, user.user_id];
    } else if (user.role === 'developer') {
      // Developers can see tasks assigned to them
      query = 'SELECT * FROM tasks WHERE sprint_id = $1 AND assigned_to = $2';
      params = [sprintId, user.user_id];
    } else {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
});

// Developer updates the status of a task
app.put('/api/tasks/:taskId/status', verifyToken, async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  
  console.log('Task status update request:', { taskId, status, userId: req.userId });
  
  if (!['todo', 'in_progress', 'done'].includes(status)) {
    console.log('Invalid status provided:', status);
    return res.status(400).json({ message: 'Invalid status.' });
  }
  
  try {
    // Check if task exists
    const taskRes = await pool.query('SELECT * FROM tasks WHERE task_id = $1', [taskId]);
    
    if (taskRes.rows.length === 0) {
      console.log('Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found.' });
    }
    
    const task = taskRes.rows[0];
    console.log('Found task:', task);
    console.log('Task assigned_to:', task.assigned_to, 'User ID:', req.userId);
    console.log('Type comparison - assigned_to:', typeof task.assigned_to, 'userId:', typeof req.userId);
    
    // Check if user is assigned to this task
    if (String(task.assigned_to) !== String(req.userId)) {
      console.log('Permission denied - user not assigned to task');
      console.log('Task assigned_to:', task.assigned_to, 'Request userId:', req.userId);
      return res.status(403).json({ message: 'Only the assigned developer can update status.' });
    }
    
    // Keep the original status value (don't convert 'done' to 'completed')
    let finalStatus = status;
    
    console.log('Updating task status:', { taskId, fromStatus: status, toStatus: finalStatus });
    
    // Update the task status
    const updateQuery = finalStatus === 'done' 
      ? 'UPDATE tasks SET status = $1, completed_at = NOW() WHERE task_id = $2'
      : 'UPDATE tasks SET status = $1 WHERE task_id = $2';
    
    const updateResult = await pool.query(updateQuery, [finalStatus, taskId]);
    console.log('Update result:', updateResult);
    
    console.log('Task status updated successfully');
    res.json({ message: 'Status updated.' });
    
  } catch (err) {
    console.error('Task status update error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      taskId,
      status,
      userId: req.userId
    });
    res.status(500).json({ message: 'Failed to update status.', error: err.message });
  }
});

// Get all sprints for a project, with is_latest flag (excluding completed sprints)
app.get('/api/projects/:projectId/sprints', verifyToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const user = await getUserById(req.userId);
    
    // Check if user has access to this project
    let projectQuery = '';
    let params = [];
    
    if (user.role === 'admin') {
      projectQuery = 'SELECT * FROM projects WHERE project_id = $1';
      params = [projectId];
    } else if (user.role === 'project_manager') {
      // Project managers can only see sprints from projects they created
      projectQuery = 'SELECT * FROM projects WHERE project_id = $1 AND created_by = $2';
      params = [projectId, user.user_id];
    } else if (user.role === 'team_lead') {
      projectQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        WHERE ptl.team_lead_id = $1 AND p.status != 'completed' AND p.status != 'deleted'`;
      params = [user.user_id];
    } else if (user.role === 'developer') {
      projectQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        JOIN team_lead_developers tld ON ptl.team_lead_id = tld.team_lead_id
        WHERE tld.developer_id = $1 AND p.status != 'completed' AND p.status != 'deleted'`;
      params = [user.user_id];
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }
    
    const projectResult = await pool.query(projectQuery, params);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    const sprintsRes = await pool.query('SELECT *, (CASE WHEN is_latest THEN TRUE ELSE FALSE END) AS is_latest FROM sprints WHERE project_id = $1 AND status != \'completed\' AND status != \'deleted\' ORDER BY start_date DESC, created_at DESC', [projectId]);
    res.json(sprintsRes.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sprints.' });
  }
});

// Get all developers for a project
app.get('/api/projects/:projectId/developers', verifyToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const user = await getUserById(req.userId);
    
    // Check if user has access to this project
    let projectQuery = '';
    let params = [];
    
    if (user.role === 'admin') {
      projectQuery = 'SELECT * FROM projects WHERE project_id = $1';
      params = [projectId];
    } else if (user.role === 'project_manager') {
      // Project managers can only see developers from projects they created
      projectQuery = 'SELECT * FROM projects WHERE project_id = $1 AND created_by = $2';
      params = [projectId, user.user_id];
    } else if (user.role === 'team_lead') {
      projectQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        WHERE ptl.team_lead_id = $1 AND p.project_id = $2`;
      params = [user.user_id, projectId];
    } else if (user.role === 'developer') {
      projectQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        JOIN team_lead_developers tld ON ptl.team_lead_id = tld.team_lead_id
        WHERE tld.developer_id = $1 AND p.project_id = $2`;
      params = [user.user_id, projectId];
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }
    
    const projectResult = await pool.query(projectQuery, params);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    // Get all team leads for the project
    const teamLeadsRes = await pool.query('SELECT team_lead_id FROM project_team_leads WHERE project_id = $1', [projectId]);
    const teamLeadIds = teamLeadsRes.rows.map(row => row.team_lead_id);
    if (teamLeadIds.length === 0) return res.json([]);
    // Get all developers linked to these team leads
    const devsRes = await pool.query(
      'SELECT DISTINCT u.user_id, u.name, u.email, u.specialization FROM team_lead_developers tld JOIN users u ON tld.developer_id = u.user_id WHERE tld.team_lead_id = ANY($1)',
      [teamLeadIds]
    );
    res.json(devsRes.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch developers for project.' });
  }
});

// Get available team leads (not assigned to any active project)
app.get('/api/team-leads/available', verifyToken, requireRole(['project_manager']), async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    
    // For project managers, only show team leads not assigned to their active projects
    const result = await pool.query(`
      SELECT u.user_id, u.name, u.email 
      FROM users u 
      WHERE u.role = 'team_lead' 
      AND u.user_id NOT IN (
        SELECT DISTINCT ptl.team_lead_id 
        FROM project_team_leads ptl
        JOIN projects p ON ptl.project_id = p.project_id
        WHERE p.status != 'completed' AND p.created_by = $1
      )
    `, [user.user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch available team leads.' });
  }
});

// Get available developers (not assigned to any active project)
app.get('/api/developers/available', verifyToken, requireRole(['project_manager']), async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    
    // For project managers, only show developers not assigned to their active projects
    const result = await pool.query(`
      SELECT u.user_id, u.name, u.email, u.specialization 
      FROM users u 
      WHERE u.role = 'developer' 
      AND u.user_id NOT IN (
        SELECT DISTINCT tld.developer_id 
        FROM team_lead_developers tld
        JOIN project_team_leads ptl ON tld.team_lead_id = ptl.team_lead_id
        JOIN projects p ON ptl.project_id = p.project_id
        WHERE p.status != 'completed' AND p.created_by = $1
      )
    `, [user.user_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch available developers.' });
  }
});

// Get single project details
app.get('/api/projects/:projectId', verifyToken, async (req, res) => {
  const { projectId } = req.params;
  try {
    const user = await getUserById(req.userId);
    let projectQuery = '';
    let params = [];
    
    if (user.role === 'admin') {
      projectQuery = 'SELECT * FROM projects WHERE project_id = $1';
      params = [projectId];
    } else if (user.role === 'project_manager') {
      // Project managers can only see projects they created
      projectQuery = 'SELECT * FROM projects WHERE project_id = $1 AND created_by = $2';
      params = [projectId, user.user_id];
    } else if (user.role === 'team_lead') {
      projectQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        WHERE ptl.team_lead_id = $1 AND p.project_id = $2`;
      params = [user.user_id, projectId];
    } else if (user.role === 'developer') {
      projectQuery = `SELECT p.* FROM projects p
        JOIN project_team_leads ptl ON p.project_id = ptl.project_id
        JOIN team_lead_developers tld ON ptl.team_lead_id = tld.team_lead_id
        WHERE tld.developer_id = $1 AND p.project_id = $2`;
      params = [user.user_id, projectId];
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }
    
    const projectResult = await pool.query(projectQuery, params);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const project = projectResult.rows[0];
    
    // Get team leads for this project
    const teamLeadsRes = await pool.query(
      `SELECT u.user_id, u.name, u.email FROM project_team_leads ptl
       JOIN users u ON ptl.team_lead_id = u.user_id
       WHERE ptl.project_id = $1`,
      [projectId]
    );
    project.team_leads = teamLeadsRes.rows;
    
    // Get developers for this project with their team lead information
    const devsRes = await pool.query(
      `SELECT DISTINCT u.user_id, u.name, u.email, u.specialization, 
              tl.name as team_lead_name, tl.email as team_lead_email
       FROM team_lead_developers tld
       JOIN users u ON tld.developer_id = u.user_id
       JOIN project_team_leads ptl ON tld.team_lead_id = ptl.team_lead_id
       JOIN users tl ON ptl.team_lead_id = tl.user_id
       WHERE ptl.project_id = $1`,
      [projectId]
    );
    project.developers = devsRes.rows;
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project details.' });
  }
});

// Add team lead to project
app.post('/api/projects/:projectId/team-leads', verifyToken, requireRole(['project_manager']), async (req, res) => {
  const { projectId } = req.params;
  const { teamLeadId } = req.body;
  
  if (!teamLeadId) {
    return res.status(400).json({ message: 'Team lead ID is required' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Verify project exists and user has access
    const projectCheck = await client.query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
    if (projectCheck.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    // Verify team lead exists and is available
    const teamLeadCheck = await client.query('SELECT * FROM users WHERE user_id = $1 AND role = $2', [teamLeadId, 'team_lead']);
    if (teamLeadCheck.rows.length === 0) {
      throw new Error('Team lead not found');
    }
    
    // Check if team lead is already assigned to this project
    const existingAssignment = await client.query(
      'SELECT * FROM project_team_leads WHERE project_id = $1 AND team_lead_id = $2',
      [projectId, teamLeadId]
    );
    if (existingAssignment.rows.length > 0) {
      throw new Error('Team lead is already assigned to this project');
    }
    
    // Add team lead to project
    await client.query(
      'INSERT INTO project_team_leads (project_id, team_lead_id) VALUES ($1, $2)',
      [projectId, teamLeadId]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Team lead added to project successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message || 'Error adding team lead to project' });
  } finally {
    client.release();
  }
});

// Remove team lead from project
app.delete('/api/projects/:projectId/team-leads/:teamLeadId', verifyToken, requireRole(['project_manager']), async (req, res) => {
  const { projectId, teamLeadId } = req.params;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if team lead is assigned to this project
    const assignmentCheck = await client.query(
      'SELECT * FROM project_team_leads WHERE project_id = $1 AND team_lead_id = $2',
      [projectId, teamLeadId]
    );
    if (assignmentCheck.rows.length === 0) {
      throw new Error('Team lead is not assigned to this project');
    }
    
    // Remove all developers linked to this team lead in this project
    await client.query(
      'DELETE FROM team_lead_developers WHERE team_lead_id = $1 AND developer_id IN (SELECT developer_id FROM team_lead_developers tld JOIN project_team_leads ptl ON tld.team_lead_id = ptl.team_lead_id WHERE ptl.project_id = $2)',
      [teamLeadId, projectId]
    );
    
    // Remove team lead from project
    await client.query(
      'DELETE FROM project_team_leads WHERE project_id = $1 AND team_lead_id = $2',
      [projectId, teamLeadId]
    );
    
    await client.query('COMMIT');
    res.json({ message: 'Team lead removed from project successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message || 'Error removing team lead from project' });
  } finally {
    client.release();
  }
});

// Add developers to project (via team lead)
app.post('/api/projects/:projectId/developers', verifyToken, requireRole(['project_manager']), async (req, res) => {
  const { projectId } = req.params;
  const { teamLeadId, developerIds } = req.body;
  
  if (!teamLeadId || !developerIds || !Array.isArray(developerIds) || developerIds.length === 0) {
    return res.status(400).json({ message: 'Team lead ID and developer IDs are required' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Verify project exists
    const projectCheck = await client.query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
    if (projectCheck.rows.length === 0) {
      throw new Error('Project not found');
    }
    
    // Verify team lead is assigned to this project
    const teamLeadCheck = await client.query(
      'SELECT * FROM project_team_leads WHERE project_id = $1 AND team_lead_id = $2',
      [projectId, teamLeadId]
    );
    if (teamLeadCheck.rows.length === 0) {
      throw new Error('Team lead is not assigned to this project');
    }
    
    // Verify developers exist and are available
    for (const devId of developerIds) {
      const devCheck = await client.query('SELECT * FROM users WHERE user_id = $1 AND role = $2', [devId, 'developer']);
      if (devCheck.rows.length === 0) {
        throw new Error(`Developer with ID ${devId} not found`);
      }
      
      // Check if developer is already assigned to a team lead
      const devAssignmentCheck = await client.query('SELECT * FROM team_lead_developers WHERE developer_id = $1', [devId]);
      if (devAssignmentCheck.rows.length > 0) {
        throw new Error(`Developer with ID ${devId} is already assigned to a team lead`);
      }
    }
    
    // Add developers to team lead
    for (const devId of developerIds) {
      await client.query(
        'INSERT INTO team_lead_developers (team_lead_id, developer_id) VALUES ($1, $2)',
        [teamLeadId, devId]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Developers added to project successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message || 'Error adding developers to project' });
  } finally {
    client.release();
  }
});

// Remove developer from project
app.delete('/api/projects/:projectId/developers/:developerId', verifyToken, requireRole(['project_manager']), async (req, res) => {
  const { projectId, developerId } = req.params;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Find the team lead for this project
    const teamLeadRes = await client.query('SELECT team_lead_id FROM project_team_leads WHERE project_id = $1', [projectId]);
    if (teamLeadRes.rows.length === 0) {
      throw new Error('No team lead found for this project');
    }
    
    const teamLeadIds = teamLeadRes.rows.map(row => row.team_lead_id);
    
    // Check if developer is assigned to any of the team leads in this project
    const assignmentCheck = await client.query(
      'SELECT * FROM team_lead_developers WHERE team_lead_id = ANY($1) AND developer_id = $2',
      [teamLeadIds, developerId]
    );
    if (assignmentCheck.rows.length === 0) {
      throw new Error('Developer is not assigned to this project');
    }
    
    // Remove developer from all team leads in this project
    await client.query(
      'DELETE FROM team_lead_developers WHERE team_lead_id = ANY($1) AND developer_id = $2',
      [teamLeadIds, developerId]
    );
    
    await client.query('COMMIT');
    res.json({ message: 'Developer removed from project successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message || 'Error removing developer from project' });
  } finally {
    client.release();
  }
});

// History endpoints
app.get('/api/history/tasks', verifyToken, requireRole(['project_manager']), async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    
    // First check if the tables exist and have the expected structure
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tasks'
      ) as tasks_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sprints'
      ) as sprints_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      ) as projects_exist
    `);
    
    const { tasks_exist, sprints_exist, projects_exist } = tableCheck.rows[0];
    
    if (!tasks_exist || !sprints_exist || !projects_exist) {
      console.log('Tables missing:', { tasks_exist, sprints_exist, projects_exist });
      return res.json([]);
    }
    
    // Filter tasks by projects created by the project manager
    const result = await pool.query(`
      SELECT 
        t.task_id,
        t.title,
        t.description,
        t.assigned_to,
        u.name as assigned_to_name,
        t.status,
        s.name as sprint_name,
        p.name as project_name,
        t.completed_at
      FROM tasks t
      LEFT JOIN sprints s ON t.sprint_id = s.sprint_id
      LEFT JOIN projects p ON s.project_id = p.project_id
      LEFT JOIN users u ON t.assigned_to = u.user_id
      WHERE t.status IN ('completed', 'done')
        AND p.created_by = $1
      ORDER BY t.task_id DESC
    `, [user.user_id]);
    
    console.log('Tasks history query result:', {
      totalTasks: result.rows.length,
      tasks: result.rows.map(t => ({ id: t.task_id, title: t.title, status: t.status }))
    });
    
    res.json(result.rows);
  } catch (err) {
    console.error('History tasks error:', err);
    res.status(500).json({ message: 'Failed to fetch completed tasks' });
  }
});

app.get('/api/history/sprints', verifyToken, requireRole(['project_manager']), async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    
    // First check if the tables exist
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sprints'
      ) as sprints_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      ) as projects_exist
    `);
    
    const { sprints_exist, projects_exist } = tableCheck.rows[0];
    
    if (!sprints_exist || !projects_exist) {
      console.log('Tables missing:', { sprints_exist, projects_exist });
      return res.json([]);
    }
    
    // Filter sprints by projects created by the project manager
    const result = await pool.query(`
      SELECT 
        s.sprint_id,
        s.name as sprint_name,
        s.status,
        s.start_date,
        s.end_date,
        s.completed_at,
        p.name as project_name
      FROM sprints s
      LEFT JOIN projects p ON s.project_id = p.project_id
      WHERE s.status = 'completed'
        AND p.created_by = $1
      ORDER BY s.sprint_id DESC
    `, [user.user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('History sprints error:', err);
    res.status(500).json({ message: 'Failed to fetch completed sprints' });
  }
});

app.get('/api/history/projects', verifyToken, requireRole(['project_manager']), async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    
    // First check if the tables exist
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      ) as projects_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      ) as users_exist
    `);
    
    const { projects_exist, users_exist } = tableCheck.rows[0];
    
    if (!projects_exist || !users_exist) {
      console.log('Tables missing:', { projects_exist, users_exist });
      return res.json([]);
    }
    
    // Filter projects by those created by the project manager
    const result = await pool.query(`
      SELECT 
        p.project_id,
        p.name as pname,
        p.description,
        p.status,
        p.completed_at,
        STRING_AGG(u.name, ', ') as team_lead_name
      FROM projects p
      LEFT JOIN project_team_leads ptl ON p.project_id = ptl.project_id
      LEFT JOIN users u ON ptl.team_lead_id = u.user_id
      WHERE p.status = 'completed'
        AND p.created_by = $1
      GROUP BY p.project_id, p.name, p.description, p.status, p.completed_at
      ORDER BY p.project_id DESC
    `, [user.user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('History projects error:', err);
    res.status(500).json({ message: 'Failed to fetch completed projects' });
  }
});

// Mark task as completed and move to history
app.put('/api/tasks/:taskId/complete', verifyToken, requireRole(['developer', 'team_lead']), async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const user = await getUserById(req.userId);
    
    // Check if task exists and user has access to it
    let taskQuery = '';
    let params = [];
    
    if (user.role === 'team_lead') {
      // Team leads can complete tasks assigned to their team members
      taskQuery = `
        SELECT t.* FROM tasks t
        JOIN sprints s ON t.sprint_id = s.sprint_id
        JOIN project_team_leads ptl ON s.project_id = ptl.project_id
        WHERE t.task_id = $1 AND ptl.team_lead_id = $2
      `;
      params = [taskId, user.user_id];
    } else if (user.role === 'developer') {
      // Developers can only complete their own tasks
      taskQuery = 'SELECT * FROM tasks WHERE task_id = $1 AND assigned_to = $2';
      params = [taskId, user.user_id];
    } else {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    
    const taskCheck = await pool.query(taskQuery, params);
    
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }
    
    if (taskCheck.rows[0].status === 'completed') {
      return res.status(400).json({ message: 'Task is already completed' });
    }
    
    // Update task to completed
    const result = await pool.query(`
      UPDATE tasks 
      SET status = 'completed', completed_at = NOW()
      WHERE task_id = $1
      RETURNING *
    `, [taskId]);
    
    res.json({ message: 'Task marked as completed', task: result.rows[0] });
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ message: 'Failed to complete task' });
  }
});

// Mark sprint as completed and move to history
app.put('/api/sprints/:sprintId/complete', verifyToken, requireRole(['project_manager']), async (req, res) => {
  const { sprintId } = req.params;
  
  try {
    const user = await getUserById(req.userId);
    
    // Check if sprint exists and user has access to it
    const sprintCheck = await pool.query(`
      SELECT s.* FROM sprints s
      JOIN projects p ON s.project_id = p.project_id
      WHERE s.sprint_id = $1 AND p.created_by = $2
    `, [sprintId, user.user_id]);
    
    if (sprintCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Sprint not found or access denied' });
    }
    
    if (sprintCheck.rows[0].status === 'completed') {
      return res.status(400).json({ message: 'Sprint is already completed' });
    }
    
    // Check if all tasks in the sprint are completed
    const tasksResult = await pool.query(`
      SELECT COUNT(*) as total_tasks, 
             COUNT(CASE WHEN status IN ('completed', 'done') THEN 1 END) as completed_tasks
      FROM tasks 
      WHERE sprint_id = $1
    `, [sprintId]);
    
    const { total_tasks, completed_tasks } = tasksResult.rows[0];
    
    console.log('Sprint completion check:', { sprintId, total_tasks, completed_tasks });
    
    if (total_tasks > 0 && completed_tasks < total_tasks) {
      // Get list of incomplete tasks for better error message
      const incompleteTasks = await pool.query(`
        SELECT title, status FROM tasks 
        WHERE sprint_id = $1 AND status NOT IN ('completed', 'done')
      `, [sprintId]);
      
      const taskList = incompleteTasks.rows.map(task => `• ${task.title} (${task.status})`).join('\n');
      
      return res.status(400).json({ 
        message: `Cannot complete sprint: not all tasks are completed\n\nIncomplete tasks:\n${taskList}` 
      });
    }
    
    // Update sprint to completed
    const result = await pool.query(`
      UPDATE sprints 
      SET status = 'completed', completed_at = NOW()
      WHERE sprint_id = $1
      RETURNING *
    `, [sprintId]);
    
    res.json({ message: 'Sprint marked as completed', sprint: result.rows[0] });
  } catch (err) {
    console.error('Complete sprint error:', err);
    res.status(500).json({ message: 'Failed to complete sprint' });
  }
});

// Get all tasks for the current user (excluding completed tasks)
app.get('/api/tasks', verifyToken, requireRole(['developer', 'team_lead']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.task_id,
        t.title,
        t.description,
        t.assigned_to,
        t.status,
        s.sprint_name,
        p.pname as project_name
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      JOIN projects p ON s.project_id = p.project_id
      WHERE t.assigned_to = $1 AND t.status != 'completed'
      ORDER BY t.task_id DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Get all tasks for search (accessible to all authenticated users)
app.get('/api/search/tasks', verifyToken, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    console.log('Search tasks request from user:', user);
    
    // Start with a simpler query and build up
    let query = `
      SELECT 
        t.task_id,
        t.title,
        t.description,
        t.assigned_to,
        t.status,
        t.created_at,
        COALESCE(s.name, 'No Sprint') as sprint_name,
        t.sprint_id,
        COALESCE(p.name, 'No Project') as project_name,
        COALESCE(p.project_id, 0) as project_id,
        COALESCE(u.name, 'Unassigned') as assigned_to_name
      FROM tasks t
      LEFT JOIN sprints s ON t.sprint_id = s.sprint_id
      LEFT JOIN projects p ON s.project_id = p.project_id
      LEFT JOIN users u ON t.assigned_to = u.user_id
    `;
    
    const params = [];
    
    // Filter based on user role and exclude completed/deleted tasks
    let whereConditions = [];
    
    // Always exclude completed and deleted tasks
    whereConditions.push(`(t.status != 'completed' AND t.status != 'deleted')`);
    
    if (user.role === 'project_manager') {
      // Project managers can only see tasks from projects they created
      whereConditions.push(`p.created_by = $${params.length + 1}`);
      params.push(req.userId);
    } else if (user.role === 'team_lead') {
      // Team leads can see tasks assigned to their team members
      whereConditions.push(`(t.assigned_to IN (
        SELECT developer_id FROM team_lead_developers 
        WHERE team_lead_id = $${params.length + 1}
      ) OR t.assigned_to = $${params.length + 1} OR t.assigned_to IS NULL)`);
      params.push(req.userId);
    } else if (user.role === 'developer') {
      // Developers can only see their own tasks
      whereConditions.push(`t.assigned_to = $${params.length + 1}`);
      params.push(req.userId);
    }
    // Admin can see all non-completed/non-deleted tasks
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY t.task_id DESC`;
    
    console.log('Executing query:', query);
    console.log('Query parameters:', params);
    
    const result = await pool.query(query, params);
    console.log('Tasks found:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('Search tasks error:', err);
    res.status(500).json({ message: 'Failed to fetch tasks for search', error: err.message });
  }
});

// Test endpoint to get all tasks (for debugging)
app.get('/api/debug/tasks', verifyToken, async (req, res) => {
  try {
    console.log('Debug: Getting all tasks');
    
    // First check if tasks table exists and has data
    const tasksCheck = await pool.query('SELECT COUNT(*) FROM tasks');
    console.log('Total tasks in database:', tasksCheck.rows[0].count);
    
    // Simple query without complex JOINs
    const result = await pool.query(`
      SELECT 
        task_id,
        title,
        description,
        assigned_to,
        status,
        created_at,
        sprint_id
      FROM tasks 
      ORDER BY task_id DESC
    `);
    console.log('Debug: Found', result.rows.length, 'tasks');
    res.json(result.rows);
  } catch (err) {
    console.error('Debug tasks error:', err);
    res.status(500).json({ message: 'Failed to fetch debug tasks', error: err.message });
  }
});

// Delete a task (only project managers can delete tasks)
app.delete('/api/tasks/:taskId', verifyToken, requireRole(['project_manager']), async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const user = await getUserById(req.userId);
    
    // First check if the task exists and user has access to it
    const taskCheck = await pool.query(`
      SELECT t.*, p.created_by as project_creator
      FROM tasks t
      JOIN sprints s ON t.sprint_id = s.sprint_id
      JOIN projects p ON s.project_id = p.project_id
      WHERE t.task_id = $1 AND p.created_by = $2
    `, [taskId, user.user_id]);
    
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }
    
    const task = taskCheck.rows[0];
    
    // Delete the task
    const result = await pool.query(`
      DELETE FROM tasks 
      WHERE task_id = $1
      RETURNING *
    `, [taskId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully', deletedTask: result.rows[0] });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// Mark project as completed and move to history
app.put('/api/projects/:projectId/complete', verifyToken, requireRole(['project_manager']), async (req, res) => {
  const { projectId } = req.params;
  
  try {
    const user = await getUserById(req.userId);
    
    await pool.query('BEGIN');
    
    // Check if project exists, is not already completed, and user has access to it
    const projectCheck = await pool.query(`
      SELECT * FROM projects WHERE project_id = $1 AND created_by = $2
    `, [projectId, user.user_id]);
    
    if (projectCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    if (projectCheck.rows[0].status === 'completed') {
      await pool.query('ROLLBACK');
      return res.status(400).json({ message: 'Project is already completed' });
    }
    
    // Check if all sprints in the project are completed
    const sprintsResult = await pool.query(`
      SELECT COUNT(*) as total_sprints, 
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sprints
      FROM sprints 
      WHERE project_id = $1
    `, [projectId]);
    
    const { total_sprints, completed_sprints } = sprintsResult.rows[0];
    
    if (total_sprints > 0 && completed_sprints < total_sprints) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Cannot complete project: not all sprints are completed' 
      });
    }
    
    // Get all team leads and developers assigned to this project before freeing them
    const teamLeadsRes = await pool.query('SELECT team_lead_id FROM project_team_leads WHERE project_id = $1', [projectId]);
    const teamLeadIds = teamLeadsRes.rows.map(row => row.team_lead_id);
    
    // Get all developers assigned to this project's team leads
    let developerIds = [];
    if (teamLeadIds.length > 0) {
      const developersRes = await pool.query(
        'SELECT developer_id FROM team_lead_developers WHERE team_lead_id = ANY($1)',
        [teamLeadIds]
      );
      developerIds = developersRes.rows.map(row => row.developer_id);
    }
    
    // Free up team members by removing their assignments
    if (teamLeadIds.length > 0) {
      await pool.query('DELETE FROM team_lead_developers WHERE team_lead_id = ANY($1)', [teamLeadIds]);
      await pool.query('DELETE FROM project_team_leads WHERE project_id = $1', [projectId]);
    }
    
    // Update project to completed
    const result = await pool.query(`
      UPDATE projects 
      SET status = 'completed', completed_at = NOW()
      WHERE project_id = $1
      RETURNING *
    `, [projectId]);
    
    await pool.query('COMMIT');
    
    // Return information about freed up team members
    const freedTeamMembers = {
      teamLeads: teamLeadIds.length,
      developers: developerIds.length,
      project: result.rows[0]
    };
    
    res.json(freedTeamMembers);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Complete project error:', err);
    res.status(500).json({ message: 'Failed to complete project' });
  }
});

// Get available team members (not assigned to any active project)
app.get('/api/available-team-members', verifyToken, requireRole(['project_manager', 'admin']), async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    
    // For project managers, only show team members not assigned to their active projects
    let projectFilter = '';
    let params = [];
    
    if (user.role === 'project_manager') {
      projectFilter = `AND p.created_by = $1`;
      params = [user.user_id];
    }
    
    // Get all team leads who are not assigned to any active project
    const availableTeamLeads = await pool.query(`
      SELECT u.user_id, u.name, u.email, u.role
      FROM users u
      WHERE u.role = 'team_lead'
      AND u.user_id NOT IN (
        SELECT DISTINCT ptl.team_lead_id 
        FROM project_team_leads ptl
        JOIN projects p ON ptl.project_id = p.project_id
        WHERE p.status != 'completed' ${projectFilter}
      )
      ORDER BY u.name
    `, params);
    
    // Get all developers who are not assigned to any active project
    const availableDevelopers = await pool.query(`
      SELECT DISTINCT u.user_id, u.name, u.email, u.role, u.specialization
      FROM users u
      WHERE u.role = 'developer'
      AND u.user_id NOT IN (
        SELECT DISTINCT tld.developer_id
        FROM team_lead_developers tld
        JOIN project_team_leads ptl ON tld.team_lead_id = ptl.team_lead_id
        JOIN projects p ON ptl.project_id = p.project_id
        WHERE p.status != 'completed' ${projectFilter}
      )
      ORDER BY u.name
    `, params);
    
    res.json({
      availableTeamLeads: availableTeamLeads.rows,
      availableDevelopers: availableDevelopers.rows,
      totalAvailable: availableTeamLeads.rows.length + availableDevelopers.rows.length
    });
  } catch (err) {
    console.error('Get available team members error:', err);
    res.status(500).json({ message: 'Failed to get available team members' });
  }
});

app.use((req, res) => {
  res.status(404).send('Route not found');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


