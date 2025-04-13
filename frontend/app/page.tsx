'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [chunks, setChunks] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        setRequestId(data.request_id);
        setChunks(data.chunks);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuery = async () => {
    if (!requestId || !question) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          question: question,
        }),
      });

      const data = await response.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error querying:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Document Query System
        </h1>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-500 hover:text-blue-600"
            >
              {file ? file.name : 'Click to upload TXT file'}
            </label>
          </div>

          {chunks > 0 && (
            <p className="text-sm text-gray-600">
              Document processed into {chunks} chunks
            </p>
          )}

          <div className="space-y-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question"
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleQuery}
              disabled={!requestId || !question || loading}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              {loading ? 'Processing...' : 'Ask Question'}
            </button>
          </div>

          {response && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h2 className="font-semibold mb-2">Response:</h2>
              <p className="whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 