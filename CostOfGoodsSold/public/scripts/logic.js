import { sleep } from './helpers.js';

// Upload status is managed globally to control access to downstream processing.
// Used by UI logic (e.g., buttons.js) to gate access to actions like full report generation.
let globalUploadBool = false;

export function setGlobalUploadBool(val) {
  globalUploadBool = val;
}

export function getGlobalUploadBool() {
  return globalUploadBool;
}

/**
 * Primary backend-driven process that executes once a valid CoGS file is uploaded.
 * 
 * 1. Opens a Server-Sent Events (SSE) connection to stream processing updates in real-time.
 * 2. Listens for messages until a 'done' event is fired.
 * 3. On completion, triggers CSV generation and auto-downloads two output files.
 * 4. Cleans up UI state and resets buttons/input for next run.
 */
export async function runFullProcess() {
  try {
    setStatusText('Initiating full process...', true);

    const eventSource = new EventSource('/skus/full-process');

    // Stream status updates to UI as the backend processes the uploaded file
    eventSource.onmessage = (e) => {
      const msg = e.data;
      if (msg.startsWith("ERROR")) {
        setStatusText(msg, false, true);
        eventSource.close(); // Exit early on critical error
      } else {
        setStatusText(msg);
      }
    };

    // When the backend signals completion, finalize the pipeline with CSV downloads
    eventSource.addEventListener("done", async () => {
      setStatusText("Generating Xero CSV...", true);
      await sleep(1500); // UX delay to simulate processing and avoid jarring transitions
      await downloadFile('/csv/generate', 'upload_to_xero.csv');

      setStatusText("Generating uncategorised CSV...", true);
      await sleep(1500);
      await downloadFile('/csv/processed-details', 'check_uncategorised.csv');

      // Wrap-up state cleanup
      setStatusText("All processes complete. Files downloaded.");
      eventSource.close();
      document.getElementById('allProcessesButton').disabled = false;
      document.getElementById('fileInput').value = '';
      document.getElementById('fileName').textContent = '';
      globalUploadBool = false;
      setStatusText('Process complete. Ready for new file.');
    });

    eventSource.onerror = (e) => console.warn('SSE closed:', e); // Passive error handling for dropped connections

  } catch (e) {
    // Global fallback in case the SSE or download pipeline fails
    console.error('Full process error:', e);
    setStatusText('An error occurred.', false, true);
    document.getElementById('allProcessesButton').disabled = false;
  }
}

/**
 * Triggered by the `runFullProcess` pipeline to download generated CSVs from backend.
 * Files are served as blobs to ensure correct download behavior across browsers.
 */
export async function downloadFile(endpoint, filename) {
  const res = await fetch(endpoint, { method: 'POST' });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  // Create an anchor and click it to trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  // Clean up temporary blob URL
  window.URL.revokeObjectURL(url);
}

/**
 * Updates the UI status message shown to the user near the main button.
 * Used across the app for upload, processing, and download stages.
 * 
 * Optionally supports:
 * - a blinking "..." animation during long processes
 * - red coloring for error messages
 */
export function setStatusText(text, isProcessing = false, isError = false) {
  const el = document.getElementById('statusText');
  el.innerText = 'Status: ' + text;
  isProcessing ? el.classList.add('dots') : el.classList.remove('dots');
  el.style.color = isError ? 'red' : 'black';
}

/**
 * Loads category mapping options into the HTML table dynamically from the backend.
 * The table maps Square product categories to Xero sales accounts.
 * 
 * Each row includes a dropdown that, when changed, triggers `updateSelection()`.
 * 
 * This must be called on page load and after any CSV update.
 */
export async function loadCategories() {
  const res = await axios.get('/csv/getCategories');
  const rows = res.data.split('\n');
  rows.shift(); // Remove header row

  const tbody = document.getElementById('categoriesTable').getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';

  // Build a table row for each category mapping option
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

/**
 * Updates the mapping of a Square category to a Xero sales account.
 * Triggered when a user interacts with a dropdown in the categories table.
 */
export async function updateSelection(id, value) {
  try {
    await axios.post('/update', { id, selection: value });
  } catch (error) {
    console.error('Update error', error);
  }
}

// Ensure category mappings are loaded when the page finishes loading.
// This is the only global side effect in the module.
window.onload = loadCategories;
