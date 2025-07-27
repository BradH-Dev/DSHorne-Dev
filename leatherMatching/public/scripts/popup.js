import { helpTexts } from './helpText.js';

export function donePopup(messageHeading, messageBody, buttonText) {
    var popup = document.getElementById("done");
    popup.style.display = "block";
    var messageHeadingParagraph = document.getElementById("messageHeading");
    messageHeadingParagraph.textContent = messageHeading;
    var messageBodyParagraph = document.getElementById("messageBody");
    messageBodyParagraph.innerHTML = messageBody;
    var closeButton = document.getElementById("closeButton");
    closeButton.innerText = buttonText;
    closeButton.onclick = function() {
        popup.style.display = "none";
    };
}
  
export function showHelp(key) {
    const text = helpTexts[key];
    if (text) {
      donePopup(text.heading, text.body, text.button);
    }
  }
  
export function closePopup(type) {
    if (type == "reviewStock")
        document.getElementById("confirmPopup").style.display = "none";
    if (type == "stockCheck")
        document.getElementById("checkStock").style.display = "none";
    if (type == "running")
        document.getElementById("running").style.display = "none";
    if (type == "done")
        document.getElementById("done").style.display = "none";
    if (type == "doneRunning")
        document.getElementById("doneRunning").style.display = "none";
    if (type == "initialLoad")
        document.getElementById("initialLoad").style.display = "none";
}
