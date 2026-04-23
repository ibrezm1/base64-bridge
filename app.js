/* =============================================
   B64 Bridge — app.js  (with SHA-256 checksums)
   ============================================= */

'use strict';

/* ---- State ---- */
const encFiles = [];

/* ---- DOM refs ---- */
const dropZone         = document.getElementById('drop-zone');
const fileInput        = document.getElementById('enc-file-input');
const fileList         = document.getElementById('file-list');
const encActions       = document.getElementById('enc-actions');
const encBtn           = document.getElementById('enc-btn');
const clearEncBtn      = document.getElementById('clear-enc-btn');
const encOutputArea    = document.getElementById('enc-output-area');
const encOutput        = document.getElementById('enc-output');
const copyBtn          = document.getElementById('copy-btn');
const downloadPayload  = document.getElementById('download-payload-btn');
const encStatus        = document.getElementById('enc-status');

const decBtn           = document.getElementById('dec-btn');
const clearDecBtn      = document.getElementById('clear-dec-btn');
const decInput         = document.getElementById('dec-input');
const decStatus        = document.getElementById('dec-status');
const decFilesEl       = document.getElementById('dec-files');

/* =============================================
   SHA-256 via Web Crypto API
   ============================================= */
async function sha256hex(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256fromBase64(b64) {
  const byteStr = atob(b64);
  const arr     = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
  return sha256hex(arr.buffer);
}

/* ---- Tab switching ---- */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + target).classList.add('active');
  });
});

/* ---- Drop zone ---- */
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  addFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });

/* ---- File management ---- */
function addFiles(newFiles) {
  for (const f of newFiles) {
    const duplicate = encFiles.some(x => x.name === f.name && x.size === f.size);
    if (!duplicate) encFiles.push(f);
  }
  renderFileList();
}

function removeFile(index) {
  encFiles.splice(index, 1);
  renderFileList();
  if (encFiles.length === 0) {
    encOutputArea.style.display = 'none';
    encOutput.value = '';
    setStatus(encStatus, '');
  }
}

function renderFileList() {
  fileList.innerHTML = '';
  encFiles.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML =
      '<div class="file-info">' +
        '<span class="file-name" title="' + esc(f.name) + '">' + esc(f.name) + '</span>' +
        '<span class="file-size">' + fmtSize(f.size) + '</span>' +
      '</div>' +
      '<button class="remove-btn" title="Remove" onclick="removeFile(' + i + ')">&#x2715;</button>';
    fileList.appendChild(item);
  });
  encActions.style.display = encFiles.length > 0 ? 'flex' : 'none';
}

/* ---- Encode (with SHA-256) ---- */
encBtn.addEventListener('click', async () => {
  if (!encFiles.length) return;

  encBtn.textContent = 'Encoding…';
  encBtn.disabled = true;
  setStatus(encStatus, '');

  try {
    const entries = [];
    for (const f of encFiles) {
      const arrayBuf = await f.arrayBuffer();
      const checksum = await sha256hex(arrayBuf);
      const uint8    = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const b64 = btoa(binary);
      entries.push({ name: f.name, size: f.size, sha256: checksum, data: b64 });
    }

    const payload = 'B64PACK:' + btoa(unescape(encodeURIComponent(JSON.stringify(entries))));
    encOutput.value = payload;
    encOutputArea.style.display       = 'flex';
    encOutputArea.style.flexDirection = 'column';
    encOutputArea.style.gap           = '0.75rem';

    renderFileListWithChecksums(entries);
    setStatus(encStatus, '✓ ' + entries.length + ' file(s) encoded — ' + fmtSize(payload.length) + ' payload', 'ok');
  } catch (err) {
    setStatus(encStatus, 'Error: ' + err.message, 'err');
  }

  encBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
      '<rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M5 8h6M8 5v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg> Encode Files';
  encBtn.disabled = false;
});

function renderFileListWithChecksums(entries) {
  fileList.innerHTML = '';
  entries.forEach((entry, i) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML =
      '<div class="file-info">' +
        '<span class="file-name" title="' + esc(entry.name) + '">' + esc(entry.name) + '</span>' +
        '<span class="file-size">' + fmtSize(entry.size) + '</span>' +
        '<span class="checksum-badge ok" title="SHA-256: ' + esc(entry.sha256) + '">' +
          '<svg width="11" height="11" viewBox="0 0 12 12" fill="none">' +
            '<path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
          ' SHA-256 <span class="hash-short">' + entry.sha256.slice(0,8) + '…' + entry.sha256.slice(-8) + '</span>' +
        '</span>' +
      '</div>' +
      '<button class="remove-btn" title="Remove" onclick="removeFile(' + i + ')">&#x2715;</button>';
    fileList.appendChild(item);
  });
}

/* ---- Copy payload ---- */
copyBtn.addEventListener('click', async () => {
  const text = encOutput.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus(encStatus, '✓ Copied to clipboard!', 'ok');
  } catch {
    encOutput.select();
    document.execCommand('copy');
    setStatus(encStatus, '✓ Copied!', 'ok');
  }
  setTimeout(() => setStatus(encStatus, '✓ ' + encFiles.length + ' file(s) encoded — ' + fmtSize(encOutput.value.length) + ' payload', 'ok'), 2000);
});

/* ---- Download payload as .txt ---- */
downloadPayload.addEventListener('click', () => {
  const text = encOutput.value;
  if (!text) return;
  triggerDownload(new Blob([text], { type: 'text/plain' }), 'b64_payload.txt');
});

/* ---- Clear encode ---- */
clearEncBtn.addEventListener('click', () => {
  encFiles.length = 0;
  renderFileList();
  encOutputArea.style.display = 'none';
  encOutput.value = '';
  setStatus(encStatus, '');
});

/* ---- Decode (with SHA-256 verification) ---- */
decBtn.addEventListener('click', async () => {
  const raw = decInput.value.trim();
  decFilesEl.innerHTML = '';
  setStatus(decStatus, '');

  if (!raw) { setStatus(decStatus, 'Paste the encoded payload first.', 'err'); return; }
  if (!raw.startsWith('B64PACK:')) { setStatus(decStatus, 'Invalid payload — must start with B64PACK:', 'err'); return; }

  decBtn.textContent = 'Verifying checksums…';
  decBtn.disabled = true;

  try {
    const jsonStr = decodeURIComponent(escape(atob(raw.slice(8))));
    const entries = JSON.parse(jsonStr);
    if (!Array.isArray(entries) || entries.length === 0) throw new Error('No files found in payload.');

    let allOk = true;

    for (const entry of entries) {
      const item = document.createElement('div');
      item.className = 'dec-item';

      const hasChecksum = !!entry.sha256;
      let verified   = null;
      let actualHash = '';

      if (hasChecksum) {
        actualHash = await sha256fromBase64(entry.data);
        verified   = actualHash === entry.sha256;
        if (!verified) allOk = false;
      }

      let checksumHtml = '';
      if (hasChecksum) {
        if (verified) {
          checksumHtml =
            '<span class="checksum-badge ok" title="SHA-256 verified: ' + esc(entry.sha256) + '">' +
              '<svg width="11" height="11" viewBox="0 0 12 12" fill="none">' +
                '<path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
              '</svg>' +
              ' Checksum OK <span class="hash-short">' + entry.sha256.slice(0,8) + '…' + entry.sha256.slice(-8) + '</span>' +
            '</span>';
        } else {
          checksumHtml =
            '<span class="checksum-badge fail" title="Expected: ' + esc(entry.sha256) + ' | Got: ' + esc(actualHash) + '">' +
              '<svg width="11" height="11" viewBox="0 0 12 12" fill="none">' +
                '<path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
              '</svg>' +
              ' Checksum MISMATCH' +
            '</span>';
        }
      } else {
        checksumHtml = '<span class="checksum-badge warn">No checksum in payload</span>';
      }

      const canDownload = !hasChecksum || verified;
      item.innerHTML =
        '<div class="file-info">' +
          '<span class="file-name" title="' + esc(entry.name) + '">' + esc(entry.name) + '</span>' +
          '<span class="file-size">' + fmtSize(entry.size) + '</span>' +
          checksumHtml +
        '</div>' +
        (canDownload
          ? '<button class="btn btn-primary dl-btn">Download</button>'
          : '<button class="btn btn-danger dl-btn" title="File may be corrupted">Download anyway</button>');

      item.querySelector('.dl-btn').addEventListener('click', () => downloadDecoded(entry.name, entry.data));
      decFilesEl.appendChild(item);
    }

    const msg = allOk
      ? '✓ ' + entries.length + ' file(s) verified — all checksums match'
      : '⚠ ' + entries.length + ' file(s) decoded — some checksums FAILED';
    setStatus(decStatus, msg, allOk ? 'ok' : 'err');

  } catch (err) {
    setStatus(decStatus, 'Failed to decode: ' + err.message, 'err');
  }

  decBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
      '<path d="M8 4v8M8 12L5 9M8 12l3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M2 13h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg> Decode &amp; Restore Files';
  decBtn.disabled = false;
});

/* ---- Clear decode ---- */
clearDecBtn.addEventListener('click', () => {
  decInput.value = '';
  decFilesEl.innerHTML = '';
  setStatus(decStatus, '');
});

/* ---- Download decoded file ---- */
function downloadDecoded(name, b64) {
  try {
    const byteStr = atob(b64);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    triggerDownload(new Blob([arr]), name);
  } catch (err) {
    alert('Error downloading file: ' + err.message);
  }
}

/* ---- Utilities ---- */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function fmtSize(bytes) {
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function setStatus(el, msg, type) {
  el.textContent = msg;
  el.className   = 'status-msg' + (type ? ' ' + type : '');
}
