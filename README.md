## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js and npm
- A MongoDB Atlas account
- Git

### Project Structure

```text
web-browser-app/
├── frontend/
└── backend/
```

### 1. Backend Setup

Open a terminal in the project folder and run:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
PORT=4000
MONGODB_URI=your_mongodb_atlas_connection_string
CLIENT_ORIGIN=http://localhost:3000
```

Replace the MongoDB value with your own MongoDB Atlas connection string.

Seed the initial sample data:

```bash
npm run seed
```

Run the backend:

```bash
npm run dev
```

The backend will run on:

`http://localhost:4000`

**Note:** Run the seed command only for the initial setup or when you need to restore the sample data.

### 2. Frontend Setup

Open a second terminal in the project folder and run:

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `frontend` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Start the frontend:

```bash
npm run dev
```

Open the application at:

`http://localhost:3000`

### 3. Running the Application

Keep both terminals running:

- Backend: `http://localhost:4000`
- Frontend: `http://localhost:3000`


