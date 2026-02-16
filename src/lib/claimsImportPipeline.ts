import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { parseResumeStructured } from './claimParser';
import type { ParsedClaim } from './claimParser';

GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type ClaimsImportFileKind = 'pdf' | 'docx' | 'txt';

const FILE_KIND_BY_EXTENSION: Record<string, ClaimsImportFileKind> = {
  pdf: 'pdf',
  docx: 'docx',
  txt: 'txt',
};

const FILE_KIND_BY_MIME: Record<string, ClaimsImportFileKind> = {
  'application/pdf': 'pdf',
  [DOCX_MIME]: 'docx',
  'text/plain': 'txt',
};

interface ZipEntry {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function detectFileKind(file: Pick<File, 'name' | 'type'>): ClaimsImportFileKind | null {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (FILE_KIND_BY_EXTENSION[extension]) {
    return FILE_KIND_BY_EXTENSION[extension];
  }
  if (file.type && FILE_KIND_BY_MIME[file.type]) {
    return FILE_KIND_BY_MIME[file.type];
  }
  return null;
}

function normalizeClaimsImportText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replaceAll('\u0000', '')
    .trim();
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const signature = 0x06054b50;
  const minOffset = Math.max(0, bytes.length - 0xffff - 22);
  for (let i = bytes.length - 22; i >= minOffset; i -= 1) {
    if (readUint32(bytes, i) === signature) return i;
  }
  return -1;
}

function parseZipEntries(bytes: Uint8Array): ZipEntry[] {
  const eocdOffset = findEndOfCentralDirectory(bytes);
  if (eocdOffset < 0) {
    throw new Error('Invalid DOCX file: ZIP end header not found.');
  }

  const entryCount = readUint16(bytes, eocdOffset + 10);
  const centralDirectoryOffset = readUint32(bytes, eocdOffset + 16);
  const entries: ZipEntry[] = [];
  const textDecoder = new TextDecoder();

  let offset = centralDirectoryOffset;
  for (let i = 0; i < entryCount; i += 1) {
    if (readUint32(bytes, offset) !== 0x02014b50) {
      throw new Error('Invalid DOCX file: central directory entry is malformed.');
    }

    const compressionMethod = readUint16(bytes, offset + 10);
    const compressedSize = readUint32(bytes, offset + 20);
    const fileNameLength = readUint16(bytes, offset + 28);
    const extraLength = readUint16(bytes, offset + 30);
    const commentLength = readUint16(bytes, offset + 32);
    const localHeaderOffset = readUint32(bytes, offset + 42);
    const fileNameStart = offset + 46;
    const fileName = textDecoder.decode(
      bytes.slice(fileNameStart, fileNameStart + fileNameLength),
    );

    entries.push({
      fileName,
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function getZipEntryCompressedBytes(bytes: Uint8Array, entry: ZipEntry): Uint8Array {
  const localHeaderOffset = entry.localHeaderOffset;
  if (readUint32(bytes, localHeaderOffset) !== 0x04034b50) {
    throw new Error('Invalid DOCX file: local file header is missing.');
  }

  const fileNameLength = readUint16(bytes, localHeaderOffset + 26);
  const extraLength = readUint16(bytes, localHeaderOffset + 28);
  const dataOffset = localHeaderOffset + 30 + fileNameLength + extraLength;
  return bytes.slice(dataOffset, dataOffset + entry.compressedSize);
}

async function inflateRawDeflate(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DOCX import is not supported by this browser.');
  }
  const rawBytes = Uint8Array.from(bytes);
  const stream = new Blob([rawBytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const inflated = await new Response(stream).arrayBuffer();
  return new Uint8Array(inflated);
}

async function unzipEntry(bytes: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  const compressed = getZipEntryCompressedBytes(bytes, entry);
  if (entry.compressionMethod === 0) return compressed;
  if (entry.compressionMethod === 8) return inflateRawDeflate(compressed);
  throw new Error(
    `DOCX import failed: unsupported compression method (${entry.compressionMethod}).`,
  );
}

async function extractDocxText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = parseZipEntries(bytes).filter(
    (entry) => entry.fileName.startsWith('word/') && entry.fileName.endsWith('.xml'),
  );

  if (entries.length === 0) {
    throw new Error('DOCX import failed: no readable XML entries found.');
  }

  const decodedSections: string[] = [];
  const utf8 = new TextDecoder();

  for (const entry of entries) {
    const data = await unzipEntry(bytes, entry);
    const xml = utf8.decode(data);
    const withBreaks = xml
      .replace(/<w:tab[^>]*\/>/g, '\t')
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n');
    const withoutTags = withBreaks.replace(/<[^>]+>/g, ' ');
    decodedSections.push(decodeXmlEntities(withoutTags));
  }

  return normalizeClaimsImportText(decodedSections.join('\n'));
}

async function extractPdfText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data: bytes }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const text = await page.getTextContent();
    const pageLines = text.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
    if (pageLines) pages.push(pageLines);
  }

  return normalizeClaimsImportText(pages.join('\n'));
}

async function extractTxtText(file: File): Promise<string> {
  return normalizeClaimsImportText(await file.text());
}

export function validateClaimsImportFile(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  const kind = detectFileKind(file);
  if (!kind) {
    return 'Unsupported file type. Upload PDF, DOCX, or TXT.';
  }
  if (file.size <= 0) {
    return 'The selected file is empty.';
  }
  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    return 'File is too large. Maximum size is 5MB.';
  }
  return null;
}

export async function extractClaimsImportText(file: File): Promise<string> {
  const kind = detectFileKind(file);
  if (!kind) {
    throw new Error('Unsupported file type. Upload PDF, DOCX, or TXT.');
  }

  if (kind === 'pdf') return extractPdfText(file);
  if (kind === 'docx') return extractDocxText(file);
  return extractTxtText(file);
}

export function parseClaimsImportText(rawText: string): ParsedClaim[] {
  const normalized = normalizeClaimsImportText(rawText);
  if (!normalized) return [];
  return parseResumeStructured(normalized);
}

export function getClaimsImportAcceptValue(): string {
  return '.pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}
