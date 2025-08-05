# TaskMaster - Project Management System

TaskMaster is a comprehensive project management system built with React and Node.js that enables organizations to manage projects, teams, tasks, and sprints efficiently.

## Features

### User Roles & Permissions
- **Admin**: Manage project managers and system-wide settings
- **Project Manager**: Create and manage projects, assign team leads
- **Team Lead**: Manage team members, create sprints and backlogs
- **Developer**: Work on assigned tasks and update their status

### Project Management
- Create and manage multiple projects
- Track project status and completion
- Assign team leads and developers
- View project history and analytics

### Team Management
- Add/remove team members
- Assign developers to team leads
- Track team member availability
- Manage role-based permissions

### Sprint Management
- Create and manage sprints
- Move items from backlog to sprints
- Track sprint progress
- Complete sprints with task verification

### Task Management
- Create and assign tasks
- Update task status (todo/in-progress/done)
- Track task history
- Filter and search tasks

### Other Features
- Dark/Light theme support
- Real-time search functionality
- Responsive design
- Toast notifications
- Form validations

## Tech Stack

### Frontend
- React (v19)
- Redux Toolkit for state management
- React Router for navigation
- Bootstrap for styling
- React Hot Toast for notifications
- Yup for form validation
- Axios for API calls

### Backend
- Node.js with Express
- PostgreSQL database
- JWT for authentication
- CORS enabled
- RESTful API architecture

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd TaskMaster
```

2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

3. Install Backend Dependencies
```bash
cd backend
npm install
```

4. Set up environment variables
Create .env file in backend directory with:
```
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskmaster
JWT_SECRET=your_secret_key
```

5. Start the Development Servers

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run dev
```

## Project Structure

```
TaskMaster/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- React team for the amazing framework
- Bootstrap team for the UI components
