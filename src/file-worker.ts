self.onmessage = async (event: MessageEvent<{ file: File; fileId: string }>) => {
    const { file, fileId } = event.data;
    const stream = file.stream();
    const reader = stream.getReader();
  
    let receivedLength = 0;
    const chunks = [];
    const totalLength = file.size;
  
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
  
      if (value) {
        chunks.push(value);
        receivedLength += value.length;
  
        // Send progress back to the main thread
        self.postMessage({
          type: "progress",
          progress: Math.round((receivedLength / totalLength) * 100),
          fileId,
        });
      }
    }
  
    // Combine chunks into a Blob
    const blob = new Blob(chunks);
    self.postMessage({ type: "done", blob: blob, fileId });
    self.close(); // Terminate worker when done
  };
  