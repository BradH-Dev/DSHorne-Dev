export function showCustomAlert(message) {
    const overlay = document.getElementById("customAlertOverlay");
    const messageElement = document.getElementById("alertMessage");
    messageElement.textContent = message;
    overlay.style.display = "flex";
}

export function closeCustomAlert() {
    document.getElementById("customAlertOverlay").style.display = "none";
}

// Detect click outside popup to close it
document.addEventListener('mousedown', function(event) {
    const overlay = document.getElementById("customAlertOverlay");
    const popup = document.getElementById("customAlertBox");
    if (overlay.style.display === "flex" && !popup.contains(event.target)) {
        closeCustomAlert();
    }
});
