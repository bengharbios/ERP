const fs = require('fs');
const path = 'frontend/src/pages/AcademicAssessorAI.css';
let content = fs.readFileSync(path, 'utf8');

const start = content.indexOf('@media print');
if (start !== -1) {
    const cleanContent = content.substring(0, start);
    const printStyles = `
@media print {
    /* NUKE THE ENTIRE DASHBOARD BACKGROUND */
    body, html, #root, .hz-root, .hz-app, .hz-main, .ag-root, .ag-body, .ag-main, .ag-container {
        background: white !important;
        background-color: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
        visibility: visible !important;
    }

    /* HIDE EVERYTHING EXCEPT THE REPORT */
    body > *:not(#root) { display: none !important; }
    #root > *:not(.hz-app) { display: none !important; }
    .hz-app > *:not(.hz-main) { display: none !important; }
    .hz-main > *:not(.ag-root) { display: none !important; }
    .ag-root > *:not(.ag-body) { display: none !important; }
    .ag-body > *:not(.ag-main) { display: none !important; }
    .ag-main > *:not(.ag-container) { display: none !important; }
    .ag-container > *:not(#printable-academic-report) { display: none !important; }

    /* UI ELEMENTS TO KILL */
    .hz-topbar, .hz-sidebar, .ag-sidebar, .ag-header, .hide-on-print, .hz-btn, .ag-stepper, .hz-breadcrumb, h1, h2:not(.ag-report-title-main) {
        display: none !important;
    }
    
    #printable-academic-report {
        visibility: visible !important;
        position: static !important;
        width: 100% !important;
        background: white !important;
        background-color: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
        box-shadow: none !important;
        border: none !important;
    }

    /* Force tables to be clean black and white */
    .ag-marking-table, .ag-marking-table tr, .ag-marking-table td, .ag-marking-table th {
        background: white !important;
        background-color: white !important;
        color: black !important;
        border: 1px solid #000 !important;
    }
    .ag-marking-table th { background: #eee !important; }
    
    /* Clean up badges */
    .ag-grade-pill, .ag-notice-box, .ag-grade-box {
        background: white !important;
        color: black !important;
        border: 1px solid #000 !important;
        box-shadow: none !important;
    }
    
    .ag-print-header {
        display: flex !important;
        border-bottom: 2px solid #000 !important;
        margin-bottom: 20px !important;
    }
    
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}`;
    fs.writeFileSync(path, cleanContent + printStyles, 'utf8');
}
console.log('Scorched Earth Print Isolation applied successfully');
