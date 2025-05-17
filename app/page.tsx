'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [fileContents, setFileContents] = useState<{ [key: string]: string }>({});
  const [response, setResponse] = useState<{
    results?: Array<{
      companyCode: string;
      date: string;
      category: string;
      finedAmount: string;
      uploadDate: string;
    }>;
  }>({});
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [chunks, setChunks] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Read file contents for each file
      newFiles.forEach(selectedFile => {
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

        // Upload each file
        (async () => {
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
        })();
      });
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

  const extractCompanyCode = (fileName: string) => {
    // Extract company code from filename (e.g., "c000980113011140304.pdf" -> "000980", "c0009A0109011100325.pdf" -> "0009A0")
    const match = fileName.match(/^c([0-9A-Z]{6})/);
    return match ? match[1] : fileName;
  };

  const extractUploadDate = (fileName: string) => {
    // 從檔名中提取日期 (例如: c000980113011140304.pdf -> 114年3月4日)
    const match = fileName.match(/(\d{3})(\d{2})(\d{2})\.pdf$/);
    if (!match) {
      console.log('No match for filename:', fileName); // 用於除錯
      return "未知日期";
    }
    
    const [_, year, month, day] = match;
    // 移除月份和日期前面的0
    const cleanMonth = month.replace(/^0+/, '');
    const cleanDay = day.replace(/^0+/, '');
    return `${year}年${cleanMonth}月${cleanDay}日`;
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

      // Combine results
      const results = dateData.results.map((result: any) => {
        const classificationResult = classificationData.results.find(
          (c: any) => c.fileName === result.fileName
        );
        const fineResult = fineData.results.find(
          (b: any) => b.fileName === result.fileName
        );
        return {
          companyCode: extractCompanyCode(result.fileName),
          date: result.date,
          category: classificationResult?.category || "",
          finedAmount: fineResult?.response || "無",
          uploadDate: extractUploadDate(result.fileName)
        };
      });

      setResponse({ results });
    } catch (error) {
      console.error('Error querying:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreResult = async () => {
    if (!response.results || response.results.length === 0) {
      alert('請確保所有結果都已產生');
      return;
    }

    try {
      setLoading(true);
      const storeResponse = await fetch('http://localhost:8000/storeResult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: response.results,
        }),
      });

      const data = await storeResponse.json();
      if (storeResponse.ok) {
        setStoreSuccess(true);
        alert('結果已成功儲存');
      } else {
        throw new Error(data.detail || '儲存失敗');
      }
    } catch (error) {
      console.error('Error storing result:', error);
      alert('儲存結果時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('http://localhost:8000/downloadResults');
      if (!response.ok) {
        throw new Error('下載失敗');
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'internal_control_results.xlsx';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('下載檔案時發生錯誤');
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
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                  multiple
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
                <div className="flex gap-2">
                  <button
                    className="px-4 py-1 bg-[#1e1e1e] rounded-md hover:bg-[#3d3d3d] text-sm"
                    onClick={handleStoreResult}
                    disabled={loading || !response.results || response.results.length === 0}
                  >
                    儲存結果
                  </button>
                  <button
                    className="px-4 py-1 bg-[#1e1e1e] rounded-md hover:bg-[#3d3d3d] text-sm"
                    onClick={handleDownload}
                  >
                    下載Excel
                  </button>
                </div>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">處理中...</p>
                </div>
              ) : response.results && response.results.length > 0 ? (
                <div className="space-y-6 text-sm">
                  {response.results.map((result, index) => (
                    <div key={index} className="border-b border-gray-700 pb-4 last:border-b-0">
                      <p className="text-gray-400 mb-1">公司代號：{result.companyCode}</p>
                      <p className="text-gray-400 mb-1">分類結果：</p>
                      <p className="pl-4 mb-2">{result.category}</p>
                      <p className="text-gray-400 mb-1">檔案上傳日期：</p>
                      <p className="pl-4 mb-2">{result.uploadDate}</p>
                      <p className="text-gray-400 mb-1">內控聲明書簽署日期：</p>
                      <p className="pl-4 mb-2">{result.date}</p>
                      <p className="text-gray-400 mb-1">罰款金額：</p>
                      <p className="pl-4">{result.finedAmount || "無"}</p>
                    </div>
                  ))}
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