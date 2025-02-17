# GraphQL reboot01 Profile Dashboard

A modern profile viewing application that displays student information and statistics from the Reboot01 GraphQL API. Built with vanilla JavaScript and SVG-based visualizations, this application allows students to view their progress, skills, and achievements through an intuitive dashboard interface.

This project was created as part of the GraphQL curriculum to demonstrate understanding of GraphQL queries, authentication, and data visualization.

## Live Demo

The application is hosted at [https://hasanali117.github.io/graphql/]. You can access it using your Reboot01 credentials.

![Application Demo](./assets/graphql.gif)

## Features

- **Secure Authentication**

  - JWT-based authentication
  - Support for both username and email login
  - Automatic redirect for unauthenticated users
  - Secure token storage using localStorage

- **User Information Display**

  - Basic user identification (name, login, cohort)
  - Campus information and enrollment date
  - Current level and rank
  - Total XP and audit ratio

- **Interactive Data Visualization**

  1. **XP Progress Graph**

     - Visual representation of XP accumulation over time
     - Interactive hover tooltips showing project details
     - Smooth gradients and animations
     - Built with D3.js and custom SVG paths

  2. **Audit Ratio Chart**
     - Visual comparison of audits done vs. received
     - Clear percentage representations
     - Custom SVG-based visualization
     - Real-time updates with data changes

- **Skill Tracking**

  - Visual display of acquired skills
  - Animated skill badges
  - Categorized by technology/domain

- **Project History**

  - Scrollable project timeline
  - Detailed project information on click
  - Project completion dates and XP earned
  - Group project information where applicable

- **Multiple Program Views**
  - Switch between different programs (Module, GO, JS)
  - Independent progress tracking for each program
  - Preserved view state during navigation

## Technologies Used

- Vanilla JavaScript (ES6+)
- GraphQL for data fetching
- D3.js for data visualization
- SVG for custom animations
- TailwindCSS for styling
- KUTE.js for shape morphing animations

## Getting Started

1. Clone the repository
2. Open index.html in your browser
3. Login with your credentials:
   - Username/Email
   - Password

The application uses the Reboot01 GraphQL API endpoint (`https://learn.reboot01.com/api/graphql-engine/v1/graphql`). The API provides access to various data points including:

- User information (id, login, email, etc.)
- XP transactions and progress
- Project results and grades
- Audit information
- Skills and achievements

### GraphQL Query Examples

```graphql
# Basic user info query
{
  user {
    id
    login
    firstName
    lastName
    email
  }
}

# Nested query for XP with projects
{
  transaction(where: { type: { _eq: "xp" } }) {
    amount
    createdAt
    object {
      name
      type
    }
  }
}

# Query with arguments for specific project
{
  object(where: { id: { _eq: 3323 } }) {
    name
    type
    attrs
  }
}
```

## Authentication

The application supports two authentication methods:

```javascript
// Using username
{
  username: "your_username",
  password: "your_password"
}

// Using email
{
  email: "your_email",
  password: "your_password"
}
```

Authentication is handled via the `/api/auth/signin` endpoint with Basic Authentication.

## Data Visualization Details

### XP Progress Graph

- Line graph showing cumulative XP over time
- Interactive data points with hover effects
- Gradient styling with custom animations
- Built using D3.js and SVG

```javascript
// Example XP data structure
{
  amount: 1000,
  createdAt: "2024-02-17T...",
  object: {
    name: "project-name",
    type: "project"
  }
}
```

### Audit Ratio Visualization

- Bar chart comparing audits done vs. received
- Percentage calculation and display
- Real-time ratio updates
- Custom SVG implementation

```javascript
// Example audit data structure
{
  totalUp: 1000,    // Audits performed
  totalDown: 800    // Audits received
}
```

## Project Structure

```
├── assets/             # SVG assets and icons
├── scripts/
│   ├── app.js         # Main application logic
│   ├── auth.js        # Authentication handling
│   ├── config.js      # Configuration and constants
│   ├── profile.js     # Profile data management
│   ├── utils.js       # Utility functions
│   └── visualization.js# Data visualization logic
├── styles/
│   └── styles.css     # Custom styling
├── index.html         # Login page
└── profile.html       # Dashboard page
```

## Contributing

Feel free to submit issues and enhancement requests. Pull requests are welcome for:

- New visualizations
- Performance improvements
- Additional features
- UI/UX enhancements
- Bug fixes
