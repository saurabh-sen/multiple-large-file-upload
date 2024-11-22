import React, { ChangeEvent, useState } from "react";

interface IMessage {
  data: {
    type: "progress" | "done";
    progress?: number;
    blob?: Blob;
    fileId: string;
  };
}

interface FileInfo {
  id: string;
  name: string;
  size: number;
  url: string | null;
  progress: number;
}

const FileStreamWorker = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    const newFiles = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      url: null,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    fileArray.forEach((file, index) => {
      const fileId = newFiles[index].id;
      const worker = new Worker(new URL("./file-worker.ts", import.meta.url));

      worker.onmessage = (message: IMessage) => {
        if (message.data.fileId !== fileId) return;

        setFiles((prev) =>
          prev.map((fileInfo) =>
            fileInfo.id === fileId
              ? {
                  ...fileInfo,
                  progress: message.data.progress ?? fileInfo.progress,
                  url: message.data.blob
                    ? URL.createObjectURL(message.data.blob)
                    : fileInfo.url,
                }
              : fileInfo
          )
        );

        if (message.data.type === "done") {
          worker.terminate();
        }
      };

      worker.postMessage({ file, fileId }); // Send file and ID to the worker
    });
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <div>
        {files.map((file) => (
          <div key={file.id} style={{ margin: "10px 0" }}>
            <h3>{file.name}</h3>
            <p>Progress: {file.progress}%</p>
            {file.url && (
              <a href={file.url} download={file.name}>
                Download File
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileStreamWorker;
