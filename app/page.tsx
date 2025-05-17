'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [fileContents, setFileContents] = useState<{ [key: string]: string }>({});
  const [response, setResponse] = useState<{
    submittedDate?: string;
    finedAmount?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [chunks, setChunks] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFiles(prevFiles => [...prevFiles, selectedFile]);
      
      // Read file contents
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContents(prev => ({
          ...prev,
          [selectedFile.name]: content
        }));
      };
      reader.readAsArrayBuffer(selectedFile);

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

  const toggleFileSelection = (fileName: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileName)) {
      newSelection.delete(fileName);
    } else {
      newSelection.add(fileName);
    }
    setSelectedFiles(newSelection);
  };

  const handleQuery = async () => {
    if (!requestId || selectedFiles.size === 0) return;

    try {
      setLoading(true);
      setResponse({}); // Clear previous responses

      // Convert selectedFiles Set to Array
      const selectedFileNames = Array.from(selectedFiles);

      // Extract date
      const dateResponse = await fetch('http://localhost:8000/extractDate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileNames: selectedFileNames,
        }),
      });
      const dateData = await dateResponse.json();

      // Get classification
      const classificationResponse = await fetch('http://localhost:8000/classifyText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileNames: selectedFileNames,
        }),
      });
      const classificationData = await classificationResponse.json();

      // Get fined amount
      const fineResponse = await fetch('http://localhost:8000/findFineAmount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileNames: selectedFileNames,
        }),
      });
      const fineData = await fineResponse.json();

      setResponse({
          submittedDate: dateData.response,
        finedAmount: fineData.response,
      });
    } catch (error) {
      console.error('Error querying:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen bg-[#1e1e1e] text-white flex flex-col p-2 gap-2">
      <div className="flex gap-2">
        {/* Header - Source */}
        <div className={`border-r border-gray-700 flex items-center justify-between px-4 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-12' : 'w-[280px] min-w-[280px]'}`}>
          <h2 className={`text-lg truncate p-4 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>券輔部AI小幫手</h2>
          <button 
            className="p-0.5 text-[10px] hover:bg-[#2d2d2d] rounded"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-1">
        {/* Top Panel - Source */}
        <div className={`border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-12 min-w-12' : 'w-[280px] min-w-[280px]'}`}>
          <div className={`p-4 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
            <div className="mb-4">
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm bg-[#2d2d2d] rounded-md hover:bg-[#3d3d3d]">內控聲明書</button>
            </div>
          </div>
          {isSidebarCollapsed && (
            <div className="p-2 flex flex-col items-center gap-2">
              <button className="p-1 text-[10px] hover:bg-[#2d2d2d] rounded w-full text-center">🔍</button>
            </div>
          )}
        </div>

        {/* Right Section - Stacked Panels */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Middle Panel - Chat */}
          <div className="h-1/2 bg-[#2d2d2d] rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm">來源</h3>
              <label 
                className="px-4 py-2 bg-[#1e1e1e] rounded-md hover:bg-[#3d3d3d] text-sm cursor-pointer inline-block"
              >
                {loading ? '上傳中...' : '上傳來源'}
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            {files.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2 px-2">
                  <label className="flex items-center justify-between w-full h-8">
                    <span className="text-sm">選取所有來源</span>
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#2d2d2d]"
                        checked={selectedFiles.size === files.length}
                        onChange={() => {
                          if (selectedFiles.size === files.length) {
                            setSelectedFiles(new Set());
                          } else {
                            setSelectedFiles(new Set(files.map(f => f.name)));
                          }
                        }}
                      />
                    </div>
                  </label>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-2 py-2.5 hover:bg-[#3d3d3d] cursor-pointer mb-2 h-10"
                      onClick={() => toggleFileSelection(file.name)}
                    >
                      <span className="text-sm">📄 {file.name}</span>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-[#2d2d2d]"
                          checked={selectedFiles.has(file.name)}
                          onChange={() => toggleFileSelection(file.name)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    className="px-4 py-2 bg-[#1e1e1e] rounded-md hover:bg-[#3d3d3d] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleQuery}
                    disabled={loading || selectedFiles.size === 0}
                  >
                    處理
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">
                  {loading ? '處理中...' : '新增來源即可開始使用'}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Panel - Studio */}
          <div className="h-1/2 bg-[#2d2d2d] rounded-lg p-4 flex flex-col">
            <div>
              <h3 className="text-sm mb-4 flex items-center justify-between">
                輸出結果
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">處理中...</p>
                </div>
              ) : (response.submittedDate || response.finedAmount) ? (
                <div className="space-y-4 text-sm">
                  {response.submittedDate && (
                    <div>
                      <p className="text-gray-400 mb-1">檔案提交日期：</p>
                      <p className="pl-4">{response.submittedDate}</p>
                    </div>
                  )}
                  {response.finedAmount && (
                    <div>
                      <p className="text-gray-400 mb-1">罰款金額：</p>
                      <p className="pl-4">{response.finedAmount}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">選取來源並處理後即可顯示結果</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}