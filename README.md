# PDF Diagram Explanation App

A web application that allows users to upload PDF diagrams and get AI-powered explanations of selected areas within the diagrams.

## Features

- PDF file upload and viewing
- Interactive area selection on diagrams
- AI-powered explanations using OpenAI GPT-4 Vision
- Annotation and comment system
- History management
- Responsive design with accessibility support

## Tech Stack

### Frontend
- React 18 + TypeScript
- Material-UI (MUI)
- Zustand for state management
- PDF.js for PDF rendering
- Fabric.js for canvas interactions

### Backend
- FastAPI + Python 3.11
- PostgreSQL with SQLAlchemy
- Celery + Redis for background tasks
- MinIO for file storage
- OpenAI API integration

## Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker and Docker Compose

### Quick Start with Docker

1. Clone the repository
2. Copy environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Start all services:
   ```bash
   docker-compose up -d
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
pytest
```

## Project Structure

```
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── types/          # TypeScript type definitions
│   │   ├── services/       # API services
│   │   ├── store/          # Zustand stores
│   │   └── utils/          # Utility functions
│   └── package.json
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── requirements.txt
├── docker-compose.yml       # Docker services configuration
└── .github/workflows/       # CI/CD pipelines
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.