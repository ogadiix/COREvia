import path from 'path';
import crypto from 'crypto';

export interface StoredFile {
  storageKey: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  contentBuffer: Buffer;
  sha256: string;
  createdAt: string;
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

// Allowed extensions
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.txt',
  '.csv',
  '.docx',
  '.xlsx',
]);

// Strictly forbidden executable or dangerous extensions
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.sh', '.cmd', '.js', '.vbs', '.msi', '.php', '.phtml',
  '.py', '.bin', '.jar', '.jsp', '.com', '.scr', '.dll', '.ps1', '.vbe',
  '.wsf', '.hta', '.cpl', '.svg', // SVG can contain script tags, sanitize or reject
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB limit

// In-memory persistent storage map for synthetic demo environment
const storageVault = new Map<string, StoredFile>();

export const documentStorage = {
  /**
   * Validates file upload metadata and contents against security allowlists
   */
  validateFile(params: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    buffer?: Buffer;
  }): { valid: boolean; error?: string; safeFileName: string } {
    const { fileName, mimeType, sizeBytes, buffer } = params;

    if (!fileName || typeof fileName !== 'string') {
      return { valid: false, error: 'File name is required', safeFileName: '' };
    }

    // Sanitize file name: remove directory traversal, control characters, limit length
    const rawBaseName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(rawBaseName).toLowerCase();
    const safeBase = rawBaseName.slice(0, 120);

    if (DANGEROUS_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        error: `Executable or potentially dangerous file extension '${ext}' is strictly prohibited.`,
        safeFileName: '',
      };
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        error: `File extension '${ext}' is not permitted. Allowed formats: PDF, JPG, PNG, WEBP, TXT, CSV, DOCX, XLSX.`,
        safeFileName: '',
      };
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `MIME type '${mimeType}' is not allowed.`,
        safeFileName: '',
      };
    }

    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds the 15 MB limit. Uploaded: ${(sizeBytes / (1024 * 1024)).toFixed(1)} MB.`,
        safeFileName: '',
      };
    }

    // Inspect magic bytes if buffer is present
    if (buffer && buffer.length >= 4) {
      const hex = buffer.subarray(0, 4).toString('hex').toLowerCase();
      // PDF: %PDF (25 50 44 46)
      if (ext === '.pdf' && !hex.startsWith('25504446')) {
        return {
          valid: false,
          error: 'File content does not match standard PDF binary signature.',
          safeFileName: '',
        };
      }
      // PNG: 89 50 4E 47
      if (ext === '.png' && !hex.startsWith('89504e47')) {
        return {
          valid: false,
          error: 'File content does not match PNG signature.',
          safeFileName: '',
        };
      }
      // JPEG: FF D8 FF
      if ((ext === '.jpg' || ext === '.jpeg') && !hex.startsWith('ffd8ff')) {
        return {
          valid: false,
          error: 'File content does not match JPEG signature.',
          safeFileName: '',
        };
      }
    }

    return { valid: true, safeFileName: safeBase };
  },

  /**
   * Stores a file in the secure document vault
   */
  async saveFile(params: {
    documentCode: string;
    version: number;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<{ storageKey: string; fileSizeStr: string; sha256: string }> {
    const { documentCode, version, fileName, mimeType, buffer } = params;

    const validation = this.validateFile({
      fileName,
      mimeType,
      sizeBytes: buffer.length,
      buffer,
    });

    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed');
    }

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const storageKey = `vault/${documentCode}/v${version}_${validation.safeFileName}`;
    const fileSizeKb = (buffer.length / 1024).toFixed(1);
    const fileSizeStr = buffer.length > 1024 * 1024
      ? `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`
      : `${fileSizeKb} KB`;

    const stored: StoredFile = {
      storageKey,
      fileName: validation.safeFileName,
      fileSize: fileSizeStr,
      mimeType,
      contentBuffer: buffer,
      sha256,
      createdAt: new Date().toISOString(),
    };

    storageVault.set(storageKey, stored);

    return {
      storageKey,
      fileSizeStr,
      sha256,
    };
  },

  /**
   * Retrieves a file by storageKey
   */
  async getFile(storageKey: string): Promise<StoredFile | null> {
    const file = storageVault.get(storageKey);
    if (file) return file;
    return null;
  },

  /**
   * Generates a realistic synthetic document template buffer with watermark
   */
  generateSyntheticDocumentContent(params: {
    documentCode: string;
    documentType: string;
    customerName: string;
    customerCode?: string;
    version: number;
    metadata?: Record<string, any>;
  }): { buffer: Buffer; mimeType: string; fileName: string } {
    const { documentCode, documentType, customerName, customerCode = 'CUS-10482', version } = params;
    const dateStr = new Date().toISOString().split('T')[0];

    // Build structured synthetic document text
    const textContent = `================================================================================
COREvia SYNTHETIC BANKING SYSTEM — DOCUMENT VAULT
================================================================================
STATUS: DEMO ENVIRONMENT SYNTHETIC RECORD
DISCLAIMER: This is a generated synthetic demo artifact for COREvia Core Banking.
This is NOT an official government identity document or legal instrument.
Do not use or submit this document in external or production channels.
================================================================================

DOCUMENT METADATA
--------------------------------------------------------------------------------
Document Reference  : ${documentCode}
Document Category   : ${documentType.toUpperCase()}
Subject Customer    : ${customerName} (${customerCode})
Version             : Version ${version}
Generation Date     : ${dateStr}
Digital Signature   : SHA256:${crypto.createHash('sha256').update(documentCode + customerName + version).digest('hex').slice(0, 32)}
Verification Status : SYNTHETIC VERIFIED (COREvia Security Core)

DETAILS & EXTRACTED FIELDS
--------------------------------------------------------------------------------
Issuing Authority   : Synthetic Enterprise Banking Sandbox (India Region)
Document ID Masked  : XXXX-XXXX-${documentCode.slice(-4)}
Document Purpose    : Banking Compliance, Credit Underwriting & Customer 360 Records
Entity Relationship : Core Banking CIF Reference #${customerCode}

AUDIT FOOTPRINT
--------------------------------------------------------------------------------
Timestamp           : ${new Date().toISOString()}
Storage Node        : COREvia Vault Node-01 (Encrypted At Rest)
Audit Checksum      : VALID
================================================================================`;

    const pdfHeader = Buffer.from('%PDF-1.4\n');
    const buffer = Buffer.concat([pdfHeader, Buffer.from(textContent, 'utf-8')]);
    const safeType = documentType.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `${documentCode}_${safeType}_v${version}.pdf`;

    return {
      buffer,
      mimeType: 'application/pdf',
      fileName,
    };
  },
};
