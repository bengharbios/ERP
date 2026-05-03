-- إضافة الفصول الثلاثة
-- نحتاج أولاً معرفة IDs للبرامج والمستويات

-- PL3-AR (Pre-Level 3 - Arabic)
INSERT INTO classes (code, nameAr, nameEn, programId, levelId, capacity, createdAt, updatedAt)
VALUES ('PL3-AR', 'المستوى الثالث التحضيري - عربي', 'Pre-Level 3 - Arabic', 1, 3, 30, NOW(), NOW());

-- PL5-AR (Pre-Level 5 - Arabic)  
INSERT INTO classes (code, nameAr, nameEn, programId, levelId, capacity, createdAt, updatedAt)
VALUES ('PL5-AR', 'المستوى الخامس التحضيري - عربي', 'Pre-Level 5 - Arabic', 1, 5, 30, NOW(), NOW());

-- PL5-Eng (Pre-Level 5 - English)
INSERT INTO classes (code, nameAr, nameEn, programId, levelId, capacity, createdAt, updatedAt)
VALUES ('PL5-ENG', 'المستوى الخامس التحضيري - إنجليزي', 'Pre-Level 5 - English', 1, 5, 30, NOW(), NOW());

-- ============================================
-- إضافة الطلبة
-- ملاحظة: سنحتاج IDs الفصول بعد إضافتها
-- ============================================

-- الحصول على IDs الفصول
SET @pl3_ar_id = (SELECT id FROM classes WHERE code = 'PL3-AR' LIMIT 1);
SET @pl5_ar_id = (SELECT id FROM classes WHERE code = 'PL5-AR' LIMIT 1);
SET @pl5_eng_id = (SELECT id FROM classes WHERE code = 'PL5-ENG' LIMIT 1);

-- طلبة PL3-AR
INSERT INTO students (studentId, nameAr, nameEn, email, phone, gender, dateOfBirth, classId, installmentNumber, status, createdAt, updatedAt)
VALUES 
('S20260001', 'حياة لولو', 'Hayat Loulou', 'hayat.loulou@example.com', '971501234501', 'female', '2005-01-01', @pl3_ar_id, 3, 'active', NOW(), NOW()),
('S20260003', 'فاطمة محمد صادق', 'Fatma Mohamed Sadeq', 'fatma.sadeq@example.com', '971501234503', 'female', '2005-01-02', @pl3_ar_id, 7, 'active', NOW(), NOW()),
('S20260008', 'مريم هشام سلمان', 'Maream Hosham Salman', 'maream.salman@example.com', '971501234508', 'female', '2005-01-08', @pl3_ar_id, 13, 'active', NOW(), NOW()),
('S20260010', 'نواف سامي', 'Nawaf Sami', 'nawaf.sami@example.com', '971501234510', 'male', '2005-01-10', @pl3_ar_id, 4, 'active', NOW(), NOW()),
('S20260011', 'نورا الخثيري', 'Noura Alktheeri', 'noura.alktheeri@example.com', '971501234511', 'female', '2005-01-11', @pl3_ar_id, 5, 'active', NOW(), NOW());

-- طلبة PL5-AR
INSERT INTO students (studentId, nameAr, nameEn, email, phone, gender, dateOfBirth, classId, installmentNumber, status, createdAt, updatedAt)
VALUES 
('S20260002', 'روى الكثيري', 'Rawa Al ketheeri', 'rawa.ketheeri@example.com', '971501234502', 'female', '2003-01-01', @pl5_ar_id, 11, 'active', NOW(), NOW()),
('S20260004', 'عبدالله المرزوقي', 'Abdulla Al Marzooqi', 'abdulla.marzooqi@example.com', '971501234504', 'male', '2003-01-04', @pl5_ar_id, 9, 'active', NOW(), NOW()),
('S20260005', 'بشار غسان معلا', 'Bashar Ghassan Mualla', 'bashar.mualla@example.com', '971501234505', 'male', '2003-01-05', @pl5_ar_id, 7, 'active', NOW(), NOW()),
('S20260006', 'عائشة قاسم', 'Aisha kasem', 'aisha.kasem@example.com', '971501234506', 'female', '2003-01-06', @pl5_ar_id, 4, 'active', NOW(), NOW()),
('S20260007', 'سارة بورعي', 'Sara Bourai', 'sara.bourai@example.com', '971501234507', 'female', '2003-01-07', @pl5_ar_id, 1, 'active', NOW(), NOW()),
('S20260009', 'عبدالرحمن أحمد', 'Abdel Rahman Ahmed', 'abdel.ahmed@example.com', '971501234509', 'male', '2003-01-09', @pl5_ar_id, 8, 'active', NOW(), NOW()),
('S20260012', 'مهند محمد السويدان', 'Mohanad Mohammad Al swidan', 'mohanad.swidan@example.com', '971501234512', 'male', '2003-01-12', @pl5_ar_id, 3, 'active', NOW(), NOW()),
('S20260013', 'ريم المهيري', 'Reem Almheiri', 'reem.almheiri@example.com', '971501234513', 'female', '2003-01-13', @pl5_ar_id, 11, 'active', NOW(), NOW()),
('S20260014', 'مي التميمي', 'Mai AL Tamimi', 'mai.tamimi@example.com', '971501234514', 'female', '2003-01-14', @pl5_ar_id, 4, 'active', NOW(), NOW()),
('S20260016', 'ماجد عبدالله أحمد', 'Majed Abdulla ahmed', 'majed.ahmed@example.com', '971501234516', 'male', '2003-01-16', @pl5_ar_id, 2, 'active', NOW(), NOW()),
('S20260017', 'نورا رجب', 'Noura Ragab', 'noura.ragab@example.com', '971501234517', 'female', '2003-01-17', @pl5_ar_id, 0, 'active', NOW(), NOW());

-- طلبة PL5-Eng
INSERT INTO students (studentId, nameAr, nameEn, email, phone, gender, dateOfBirth, classId, installmentNumber, status, createdAt, updatedAt)
VALUES 
('S20260015', 'محمد فؤاد رمضان', 'Mohamed Fouad Ramadan', 'mohamed.ramadan@example.com', '971501234515', 'male', '2003-01-15', @pl5_eng_id, 5, 'active', NOW(), NOW());

-- التحقق من الإضافات
SELECT 'Classes Added:' as info;
SELECT id, code, nameAr, nameEn FROM classes WHERE code IN ('PL3-AR', 'PL5-AR', 'PL5-ENG');

SELECT '' as separator;
SELECT 'Students Added:' as info;
SELECT s.studentId, s.nameAr, s.nameEn, c.code as classCode, s.installmentNumber 
FROM students s 
JOIN classes c ON s.classId = c.id 
WHERE c.code IN ('PL3-AR', 'PL5-AR', 'PL5-ENG')
ORDER BY c.code, s.nameAr;
