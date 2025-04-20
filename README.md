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


## Architecture
- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: FastAPI with Python
- AI: AWS Bedrock (Claude and Titan models)
- Vector Store: FAISS
- Document Processing: LangChain 

## License
MIT