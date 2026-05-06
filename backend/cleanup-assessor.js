const fs = require('fs');
const path = 'frontend/src/pages/AcademicAssessorAI.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetText = 'تم إعداد هذا التقرير والتصحيح المقترح باستخدام محرك <strong>{engineMode} Engine</strong>. وتبقى هذه النتيجة موضوعية بناءً على مخرجات واضحة.';
const replacementText = 'تمت مراجعة هذا التقرير وتدقيقه وفقاً لمعايير الجودة الأكاديمية المعتمدة لضمان مطابقة مخرجات التعلم وتحقيق النزاهة العلمية.';

content = content.replace(targetText, replacementText);
content = content.replace("background: 'var(--hz-surface-2)'", "background: 'transparent'");
content = content.replace("border: '1px dashed var(--hz-border-soft)'", "border: '1px solid #eee'");

fs.writeFileSync(path, content, 'utf8');
console.log('Cleanup successful');
