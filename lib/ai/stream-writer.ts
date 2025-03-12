import { DataStreamWriter } from 'ai';

export function createAIStreamWriter(): DataStreamWriter {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const dataStream: DataStreamWriter = {
    writeData: async (data) => {
      const json = JSON.stringify({
        type: 'data',
        data,
      });
      await writer.write(encoder.encode(`${json}\n`));
    },
  };

  return dataStream;
} 