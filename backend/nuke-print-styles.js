const fs = require('fs');
const path = 'frontend/src/pages/AcademicAssessorAI.css';
let content = fs.readFileSync(path, 'utf8');

const start = content.indexOf('@media print');
if (start !== -1) {
    const cleanContent = content.substring(0, start);
    const printStyles = `
@media print {
    @page { size: A4; margin: 15mm; }
    .hz-root, .hz-app, .hz-main, .ag-root, .ag-body, .ag-main, .ag-container, body, html {
        background: white !important;
        background-color: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    .hz-topbar, .hz-sidebar, .ag-sidebar, .ag-header, .hide-on-print, .hz-btn, .ag-stepper, [style*="background-color: #172038"], [style*="background: #172038"] {
        display: none !important;
        background: transparent !important;
        background-color: transparent !important;
    }
    .ag-grade-pill, .ag-notice-box, .ag-grade-box {
        background: white !important;
        color: black !important;
        border: 1px solid #000 !important;
        box-shadow: none !important;
    }
    .ag-report-wrap {
        position: static !important;
        width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        background: white !important;
    }
    .ag-marking-table { border: 1px solid #111 !important; border-collapse: collapse !important; width: 100% !important; }
    .ag-marking-table th, .ag-marking-table td { border: 1px solid #111 !important; padding: 10px !important; }
    .ag-marking-table th { background: #eee !important; color: #000 !important; }
    .ag-print-header { display: block !important; border-bottom: 2px solid #000 !important; margin-bottom: 30px !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}`;
    fs.writeFileSync(path, cleanContent + printStyles, 'utf8');
}
console.log('Print styles nuked successfully');
