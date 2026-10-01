import prisma from '../../common/db/prisma';
import { crmService } from './crm.service';

const textReport = `الاسم: هبه مصرية
رقم الهاتف: 0551700552
الجنسية: مصر
الإمارة: دبي
الدبلوم المهتم به: العالي
درجة الاهتمام: 8
-----------------------
📝 الملاحظات: تم الاتصال بالعميله سالت لأختها التى درست سنة ثالثة دبلوم صناعي قسم تريكو ولم تكمل السنة عن امكانية استكمالها لدراستها لتاخذ شهادة قلت لها انها يمكنها دراسه الدبلوم العالي الذي يكافئ سنتين جامعيتين وشرحت لها كل التفاصيل الخاصة بالدبلوم العالي وشهادة الدبلوم العالي من حيث صدورها واعتمادها وكل التفاصيل الخاصه بالرسوم الدراسية والتخصصات قالت هي تريد شهاده لاختها ليس لكي تعمل لانها تعمل معي في محل لخدمة حفلات الافراح وهي فقط تريد لها شهادة لكي تكون حاصله على شهاده فقط وطلبت ارسال كل هذه التفاصيل على الواتساب وبتراجع والدها وبتتواصل معنا ثاني ان شاء الله وهي مهتمه
-----------------------
👤 الموظف المسؤول: محمد صالح`;

async function testReport() {
    console.log('Simulating report parsing...');
    try {
        const parsedData = crmService.parseTelegramMessage(textReport);
        console.log('Parsed Data:', JSON.stringify(parsedData, null, 2));

        if (!parsedData.phone) {
            console.log('FAIL: Phone number missing in parsed data.');
            return;
        }

        console.log('Updating/Creating lead in database...');
        const result = await crmService.updateLeadFromMessage(parsedData);
        console.log('Success! Result Lead:', JSON.stringify(result.lead, null, 2));
    } catch (err: any) {
        console.error('CRASH DETECTED IN REPORT SAVING:', err.stack || err.message);
    }
}

testReport().then(() => prisma.$disconnect());
