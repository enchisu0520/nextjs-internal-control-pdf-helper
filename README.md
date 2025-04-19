# Internal Control PDF Helper

A web application that helps analyze and extract information from internal control PDFs using AWS Bedrock and Claude 3 Sonnet. The application consists of a FastAPI backend and a Next.js frontend.

## Features

- PDF upload and processing
- Intelligent text extraction and analysis
- Question answering about internal control documents
- Modern, responsive UI

## Prerequisites

- Python 3.8+
- AWS Account with Bedrock access
- Node.js 16+ (for frontend)

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/Scripts/activate #On Mac: source venv/bin/activate
```

3. Install dependencies:
```bash
conda install swig
pip install -r requirements.txt
```

4. Set up AWS credentials:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=your_region
```

5. Run the backend server:
```bash
uvicorn main:app --reload
```

<!-- 6. Copy `.env.example` to `.env` and fill in your AWS credentials:
```bash
cp .env.example .env
``` -->

6. Start the backend server:
```bash
python main.py
```

The server will run on `http://localhost:8000` and provide interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`


### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Upload a PDF file containing internal control documentation
3. Wait for the processing to complete
4. Ask questions about the content of the document

## Environment Variables

### Backend (.env)

- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
- `AWS_REGION`: Your AWS region (e.g., us-east-1)
- `PORT`: Backend server port
- `BUCKET_NAME`: (Optional) S3 bucket name for storing vector indices
- `BEDROCK_MODEL_ID`: AWS Bedrock model ID

## Architecture
- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: FastAPI with Python
- AI: AWS Bedrock (Claude and Titan models)
- Vector Store: FAISS
- Document Processing: LangChain 

## License
MIT