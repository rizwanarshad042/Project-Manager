# Infotech Project Management System

A React-based project management system that allows users to manage projects, team members, and resources efficiently.

## Features

- **User Authentication**
  - Secure login/signup system
  - Session management with auto-logout after 10 minutes of inactivity
  - Protected routes for authenticated users

- **Project Management**
  - View all user projects
  - Create new projects
  - Delete existing projects
  - Assign team leads and team members
  - Track project dates and descriptions

- **Resource Management**
  - View available resources
  - Assign resources to projects
  - Manage team lead assignments
  - Track resource designations

- **User Profile**
  - View user details
  - Display personal information
  - Profile management

## Tech Stack

- **Frontend**
  - React.js with Vite
  - React Router for navigation
  - Bootstrap 5 for styling
  - React Hook Form for form management
  - Yup for form validation
  - Axios for API calls

- **Dependencies**
  - bootstrap: ^5.3.7
  - react-router-dom: ^7.6.3
  - react-hook-form: ^7.60.0
  - @hookform/resolvers: ^5.1.1
  - yup: ^1.6.1
  - axios: ^1.10.0

## Getting Started

1. **Installation**
   ```bash
   npm install
   ```

2. **Development**
   ```bash
   npm run dev
   ```

3. **Build**
   ```bash
   npm run build
   ```

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## Project Structure

- `/src`
  - `/components`
    - `Login.jsx` - User authentication
    - `Signup.jsx` - New user registration
    - `Navbar.jsx` - Navigation component
    - `Profile.jsx` - User profile management
    - `UserProjects.jsx` - Project listing and management
    - `ProjectSelection.jsx` - Project creation
    - `Terms.jsx` - Terms and conditions
    - `Home.jsx` - Dashboard component

## Environment Setup

Ensure you have:
- Node.js v16 or higher
- npm v7 or higher
- A modern web browser

## Notes

- The backend API should be running on `http://localhost:3001`
- Session timeout is set to 10 minutes
- Bootstrap is used for responsive design
