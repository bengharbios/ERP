const fs = require('fs');
const path = 'frontend/src/pages/AcademicAssessorAI.css';
let content = fs.readFileSync(path, 'utf8');

const start = content.indexOf('@media print');
if (start !== -1) {
    const cleanContent = content.substring(0, start);
    const printStyles = `
@media print {
    /* HIDE EVERYTHING BY DEFAULT */
    body * {
        visibility: hidden !important;
        background: transparent !important;
        background-color: transparent !important;
        box-shadow: none !important;
    }
    
    /* SHOW ONLY THE REPORT */
    #printable-academic-report, #printable-academic-report * {
        visibility: visible !important;
    }
    
    #printable-academic-report {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        background: white !important;
        background-color: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
    }

    /* Force backgrounds to white inside the report */
    .ag-marking-table, .ag-marking-table tr, .ag-marking-table td, .ag-marking-table th {
        background: white !important;
        background-color: white !important;
        color: black !important;
        border: 1px solid #111 !important;
    }
    .ag-marking-table th { background: #f0f0f0 !important; }
    
    .ag-grade-box, .ag-notice-box, .ag-grade-pill {
        background: white !important;
        background-color: white !important;
        color: black !important;
        border: 1px solid #000 !important;
    }
    
    .ag-report-section {
        background: transparent !important;
        border: none !important;
    }

    .ag-print-header {
        display: flex !important;
        border-bottom: 2px solid #000 !important;
        margin-bottom: 20px !important;
    }
    
    .ag-badge, .hz-badge { display: none !important; }
    
    /* Kill any remaining dark backgrounds */
    [style*="background"] { background: transparent !important; }
    [style*="color: var(--hz-neon)"] { color: #000 !important; }
}`;
    fs.writeFileSync(path, cleanContent + printStyles, 'utf8');
}
console.log('Gold Standard Print Styles applied successfully');
