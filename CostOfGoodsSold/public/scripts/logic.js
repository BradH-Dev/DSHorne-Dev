import { sleep } from './helpers.js';

let globalUploadBool = false;

export function setGlobalUploadBool(val) {
  globalUploadBool = val;
}

export function getGlobalUploadBool() {
  return globalUploadBool;
}

export async function runFullProcess() {
  try {
    setStatusText('Initiating full process...', true);
    const eventSource = new EventSource('/skus/full-process');

    eventSource.onmessage = (e) => {
      const msg = e.data;
      if (msg.startsWith("ERROR")) {
        setStatusText(msg, false, true);
        eventSource.close();
      } else {
        setStatusText(msg);
      }
    };

    eventSource.addEventListener("done", async () => {
      setStatusText("Generating Xero CSV...", true);
      await sleep(1500);
      await downloadFile('/csv/generate', 'upload_to_xero.csv');
      setStatusText("Generating uncategorised CSV...", true);
      await sleep(1500);
      await downloadFile('/csv/processed-details', 'check_uncategorised.csv');
      setStatusText("All processes complete. Files downloaded.");
      eventSource.close();
      document.getElementById('allProcessesButton').disabled = false;
      document.getElementById('fileInput').value = '';
      document.getElementById('fileName').textContent = '';
      globalUploadBool = false;
      setStatusText('Process complete. Ready for new file.');
    });

    eventSource.onerror = (e) => console.warn('SSE closed:', e);
  } catch (e) {
    console.error('Full process error:', e);
    setStatusText('An error occurred.', false, true);
    document.getElementById('allProcessesButton').disabled = false;
  }
}

export async function downloadFile(endpoint, filename) {
  const res = await fetch(endpoint, { method: 'POST' });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function setStatusText(text, isProcessing = false, isError = false) {
  const el = document.getElementById('statusText');
  el.innerText = 'Status: ' + text;
  isProcessing ? el.classList.add('dots') : el.classList.remove('dots');
  el.style.color = isError ? 'red' : 'black';
}

export async function loadCategories() {
  const res = await axios.get('/csv/getCategories');
  const rows = res.data.split('\n');
  rows.shift();
  const tbody = document.getElementById('categoriesTable').getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';
  rows.forEach(row => {
    if (row.trim()) {
      const [name, id, selection] = row.split(',');
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${name}</td><td style="display: none;">${id}</td><td><select onchange="updateSelection('${id}', this.value)">
        <option value=""></option>
        <option value="leather" ${selection === "leather" ? "selected" : ""}>Sales - Leather</option>
        <option value="leathercraft" ${selection === "leathercraft" ? "selected" : ""}>Sales - Leathercraft</option>
        <option value="souvenirs" ${selection === "souvenirs" ? "selected" : ""}>Sales - Souvenirs</option>
      </select></td>`;
      tbody.appendChild(tr);
    }
  });
}

export async function updateSelection(id, value) {
  try {
    await axios.post('/update', { id, selection: value });
  } catch (error) {
    console.error('Update error', error);
  }
}

window.onload = loadCategories;
