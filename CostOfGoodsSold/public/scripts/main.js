import { help1 } from './helpers.js';
import './buttons.js';
import './logic.js'; // Contains runFullProcess, setStatusText, etc.

// Expose help1 globally for inline HTML onClick
window.help1 = help1;
