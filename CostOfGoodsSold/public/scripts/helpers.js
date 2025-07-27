/**
 * Displays a centralized popup modal with a title, message, and custom button text.
 * 
 * Used for:
 * - Instructions
 * - Error messages
 * - Process feedback
 * 
 * The modal listens for clicks outside itself to auto-dismiss, which is delayed slightly
 * to prevent accidental closure from the triggering click event.
 */
export function donePopup(title, message, closeText) {
  const popup = document.getElementById('done');
  const closeButton = document.getElementById('closeButton');

  // Inject dynamic content
  document.getElementById('messageHeading').innerHTML = title;
  document.getElementById('messageBody').innerHTML = message;
  closeButton.innerText = closeText || 'Close';

  // Show modal
  popup.style.display = 'block';

  // Hook up close button and outside click dismiss logic
  closeButton.onclick = () => {
    popup.style.display = 'none';
    window.removeEventListener('click', outsideClickHandler);
  };

  // Defer registration of outside click handler to avoid immediate closure
  setTimeout(() => {
    window.addEventListener('click', outsideClickHandler);
  }, 0);

  // Modal dismissal if user clicks outside the popup area
  function outsideClickHandler(event) {
    if (!popup.contains(event.target)) {
      popup.style.display = 'none';
      window.removeEventListener('click', outsideClickHandler);
    }
  }
}

/**
 * Displays a comprehensive instructional guide to the user in a modal.
 * 
 * This serves as the main help system for the tool, walking users through:
 * - Downloading CoGS reports from Square
 * - Uploading to the app
 * - Running invoice checks
 * - Importing results to Xero
 * 
 * Critical for user onboarding and reducing support queries.
 */
export function help1() {
  donePopup("How to use:", "<strong>Firstly, grabbing info from Square:</strong><br><br><strong>1)</strong> Go to Reports -> Inventory reports -> Cost of goods sold (or just click the button on this page to take you there)<br><br><strong>2)</strong> Set the date range for sales on which you want to report <br><br>2.5) Optionally, you can select specific categories, otherwise just leave it as All Categories. Keep the 'Sales' selection as 'Sales' <br><br><strong>4)</strong> Click 'Export'. This will download a file from Square <br><br><br><strong>Using this tool:</strong><br><br><strong>1)</strong> This page will pull all the current top-level categories off Square. Ensure they are each mapped to the correct sales account on Xero by using the dropdowns.<br><br><strong>2)</strong> Click '📁 Choose Cost of Goods file from Square' and select the file which was downloaded from Square, and wait for it to upload and process. <br><br><strong>3)</strong> When instructed, click 'Generate report...' <br><br> <strong>4)</strong> You will be prompted if you want to include invoices. <br><br> Putting it simply, CoGS from Square will ONLY include sales from the following places: <br><br><em>Online sales (leathercraft and souvenirs, NOT leather), in-store sales, and Square-created invoices.</em><br><br>Any custom invoices (i.e. Xero invoices using the custom tool) will not have CoGS from the Square export. By selecting 'Yes' to include invoices, it will account for <strong>ALL</strong> CoGS across the business.<br><br>Selecting 'No' will mean just exporting CoGS from the Square sources listed above. <br><br> <strong>5)</strong> Follow the status messages as they appear. The process may take a while if the cost of goods report is large. Two files will download. <br><br><br><strong>Importing to Xero:</strong><br><br><strong>1)</strong> Click the button 'Take me to Xero imports...'<br><br> <strong>2)</strong> From there, browse for the file called 'upload_to_xero' and import it. <br><br> <strong>3)</strong> This will create a draft journal. Click it and edit as required. Open up the generated 'check_uncategorised' file to reconcile any small amounts which have come through uncategorised <br><br>3.5) The uncategorised file will tally all freight/postage related costs and give you a net total of all uncategorised products WITHOUT freight in the end column to give you a clearer picture", "OK - Makes sense :)");
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}