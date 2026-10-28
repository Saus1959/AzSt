// Allowed document formats. Shared by the server (validation) and the client (accept / icons).
// Vercel functions accept request bodies up to ~4.5 MB, so the cap is 4 MB.
export const MAX_FILE_MB = 4;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const GROUPS = {
  pdf: { pdf: 'application/pdf' },
  word: {
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    odt: 'application/vnd.oasis.opendocument.text',
    rtf: 'application/rtf',
  },
  sheet: {
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    csv: 'text/csv',
  },
  slides: {
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    odp: 'application/vnd.oasis.opendocument.presentation',
  },
  image: {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  },
  archive: {
    zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed', tar: 'application/x-tar', gz: 'application/gzip',
  },
  code: {
    txt: 'text/plain', md: 'text/markdown', json: 'application/json', xml: 'application/xml', yml: 'text/yaml', yaml: 'text/yaml',
    py: 'text/x-python', ino: 'text/plain', c: 'text/x-c', cpp: 'text/x-c++', h: 'text/x-c', js: 'text/javascript', log: 'text/plain',
  },
  cad: {
    dwg: 'application/octet-stream', dxf: 'application/octet-stream', step: 'application/octet-stream', stp: 'application/octet-stream',
    iges: 'application/octet-stream', igs: 'application/octet-stream', stl: 'model/stl', obj: 'text/plain', '3mf': 'application/octet-stream',
    gbr: 'application/octet-stream', kicad_pcb: 'text/plain', kicad_sch: 'text/plain',
  },
  audio: { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg' },
  video: { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' },
};

export const MIME = Object.assign({}, ...Object.values(GROUPS));
export const ACCEPT = Object.keys(MIME).map((e) => '.' + e).join(',');

export const extOf = (name = '') => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');
export const kindOf = (name) => {
  const e = extOf(name);
  return Object.keys(GROUPS).find((k) => e in GROUPS[k]) || 'other';
};

// Only these may be opened in the browser; everything else is always a download.
export const INLINE_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
export const canPreview = (name) => INLINE_EXT.includes(extOf(name));

export const fmtSize = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
