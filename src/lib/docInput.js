import { POSITIONS } from './constants';
import { MIME, MAX_FILE_BYTES, MAX_FILE_MB, extOf } from './files';
import { body } from './api';

const startsWith = (buf, sig, at = 0) => sig.every((b, i) => buf[at + i] === b);
// Files that may be previewed in the browser must really be what they claim to be.
const SIGNATURES = {
  pdf: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46]),
  png: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]),
  jpg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  jpeg: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  gif: (b) => startsWith(b, [0x47, 0x49, 0x46, 0x38]),
  webp: (b) => startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8),
};

// Reads JSON or multipart (title, content, tags, department, file).
// Returns { data, file, error } — data holds only the fields that were sent.
export async function readDocInput(req) {
  let raw = {};
  let file = null;
  if ((req.headers.get('content-type') || '').startsWith('multipart/form-data')) {
    const fd = await req.formData();
    for (const k of ['title', 'content', 'tags', 'department']) if (fd.has(k)) raw[k] = fd.get(k);
    const f = fd.get('file');
    if (f && typeof f === 'object' && f.size > 0) file = f;
  } else {
    raw = await body(req);
  }

  const data = {};
  if (raw.title !== undefined) data.title = String(raw.title).trim().slice(0, 200);
  if (raw.content !== undefined) data.content = String(raw.content).slice(0, 50000);
  if (raw.tags !== undefined) {
    const list = Array.isArray(raw.tags) ? raw.tags : String(raw.tags).split(',');
    data.tags = list.map((s) => String(s).trim().slice(0, 40)).filter(Boolean).slice(0, 20);
  }
  if (raw.department !== undefined) {
    if (!['all', ...POSITIONS].includes(raw.department)) return { error: 'Invalid department' };
    data.department = raw.department;
  }
  return { data, file };
}

// Validates an uploaded File and returns { meta, buf } or { error }.
export async function prepareFile(file) {
  const name = String(file.name || 'file').replace(/[\\/\u0000-\u001f]/g, '_').slice(-150);
  const ext = extOf(name);
  if (!(ext in MIME)) return { error: 'This file format is not supported' };
  if (file.size > MAX_FILE_BYTES) return { error: `File is too large (max ${MAX_FILE_MB} MB)` };
  const buf = Buffer.from(await file.arrayBuffer());
  if (SIGNATURES[ext] && !SIGNATURES[ext](buf)) return { error: 'The file content does not match its extension' };
  return { buf, meta: { name, mime: MIME[ext], size: buf.length } };
}
