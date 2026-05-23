type ZipEntry = {
  path: string;
  content: string;
};

const encoder = new TextEncoder();

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = () => {
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  return { date, time };
};

const writeUint16 = (value: number) => {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
};

const writeUint32 = (value: number) => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
};

const concatBytes = (chunks: Uint8Array[]) => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
};

export function createZipBlob(entries: ZipEntry[]) {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  const { date, time } = dosDateTime();
  let offset = 0;

  entries
    .filter((entry) => entry.path && !entry.path.endsWith('/'))
    .forEach((entry) => {
      const nameBytes = encoder.encode(entry.path.replace(/^\/+/, ''));
      const contentBytes = encoder.encode(entry.content);
      const crc = crc32(contentBytes);

      const localHeader = concatBytes([
        writeUint32(0x04034b50),
        writeUint16(20),
        writeUint16(0),
        writeUint16(0),
        writeUint16(time),
        writeUint16(date),
        writeUint32(crc),
        writeUint32(contentBytes.length),
        writeUint32(contentBytes.length),
        writeUint16(nameBytes.length),
        writeUint16(0),
        nameBytes
      ]);

      const centralHeader = concatBytes([
        writeUint32(0x02014b50),
        writeUint16(20),
        writeUint16(20),
        writeUint16(0),
        writeUint16(0),
        writeUint16(time),
        writeUint16(date),
        writeUint32(crc),
        writeUint32(contentBytes.length),
        writeUint32(contentBytes.length),
        writeUint16(nameBytes.length),
        writeUint16(0),
        writeUint16(0),
        writeUint16(0),
        writeUint16(0),
        writeUint32(0),
        writeUint32(offset),
        nameBytes
      ]);

      localChunks.push(localHeader, contentBytes);
      centralChunks.push(centralHeader);
      offset += localHeader.length + contentBytes.length;
    });

  const centralDirectory = concatBytes(centralChunks);
  const endRecord = concatBytes([
    writeUint32(0x06054b50),
    writeUint16(0),
    writeUint16(0),
    writeUint16(centralChunks.length),
    writeUint16(centralChunks.length),
    writeUint32(centralDirectory.length),
    writeUint32(offset),
    writeUint16(0)
  ]);

  return new Blob([...localChunks, centralDirectory, endRecord], { type: 'application/zip' });
}

