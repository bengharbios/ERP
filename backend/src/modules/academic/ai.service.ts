import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

export const aiService = {
    generatePrompt(assignment: string, rubric: string, options: any) {
        const isArabic = options.language !== 'English';
        
        if (isArabic) {
            return `أنت مقيم أكاديمي ذكي متخصص في تحليل الواجبات الدراسية بناءً على معايير التصحيح (Rubric).
            
تعليمات صارمة للمطابقة والتقييم الرياضي:
1. المقياس (Rubric) هو المرجع الأساسي؛ يجب أن يحتوي التقرير على **جميع** المعايير المذكورة في المقياس دون استثناء.
2. **قاعدة عدم توفر الأدلة (Zero Evidence Rule):** إذا أجاب الطالب على جزء محدد فقط من الواجب (على سبيل المثال: أجاب فقط على المخرج LO3 وتجاهل LO1 و LO2)، فيجب عليك إعطاء درجة (0) وحالة (Not Achieved) للمعايير غير المجاب عليها مع كتابة "لم يتم العثور على أي أدلة أو إجابة مقدمة من الطالب لهذا المعيار" في الوصف. يمنع منعاً باتاً منح أي درجات جزئية أو كاملة لمعايير لم يقدم الطالب دليلاً عليها.
3. **الحساب الرياضي الفعلي للدرجة الكلية (Mathematical Score Summation):** الدرجة الإجمالية (score) يجب أن تكون مساوية تماماً للعملية الحسابية التالية: (مجموع الدرجات الفعلية الممنوحة awarded لجميع المعايير ÷ مجموع الحد الأقصى للدرجات max لجميع المعايير) × 100. يمنع منعاً باتاً تقدير الدرجة الإجمالية بشكل حدسي أو منفصل عن المجموع الفعلي الرياضي للمعايير.
4. يجب مواءمة الدرجة الإجمالية (score) مع حقل التقدير الإجمالي (grade) وفقاً للمعايير الأكاديمية التالية:
    - إذا كانت الدرجة الكلية أقل من 50%: التقدير Incomplete حتماً.
   - من 50% إلى 59%: التقدير Pass.
   - من 60% إلى 69%: التقدير Merit.
   - من 70% إلى 100%: التقدير Distinction.
5. يجب أن يبدأ حقل "id" برمز المعيار (مثل: LO1, AC1.1, Task 1) متبوعاً بعنوان المعيار.
6. يجب أن تكون **جميع** نصوص التقرير والتحليل باللغة العربية الفصحى حصراً، حتى لو كان الواجب أو المقياس باللغة الإنجليزية.
7. يجب أن تكون قيم "status" هي (Achieved) أو (Not Achieved).
8. يجب أن تكون قيم "depth" هي (Analytical) أو (Descriptive).
9. أجب فقط بصيغة JSON، بدون أي نصوص إضافية.

البيانات:
--- الواجب ---
${assignment}

--- المعايير ---
${rubric}

--- الإعدادات ---
حساسية التقييم: ${options.evalMode}

قم بتحليل الواجب وإخراج JSON بهذا الهيكل تماماً:
{
  "score": <الدرجة الكلية الفعلية المحسوبة رياضياً بدقة بين 0-100>,
  "grade": "Pass / Merit / Distinction / Incomplete",
  "criteria": [
    { "id": "اسم المعيار", "max": 100, "awarded": <رقم دقيق>, "status": "Achieved/Not Achieved", "depth": "Analytical/Descriptive", "desc": "شرح الأسباب بالتفصيل الأكاديمي بالعربي" }
  ],
  "strengths": ["نقطة قوة 1 بالعربي", "نقطة قوة 2 بالعربي"],
  "improvements": ["نقطة تحسين 1 بالعربي", "نقطة تحسين 2 بالعربي"],
  "integrity": "تقييم النزاهة بالعربي",
  "thinking": "تقييم التفكير النقدي بالعربي"
}`;
        }

        return `You are an automated Assessor Decision AI analyzing an academic assignment against a grading rubric.

CRITICAL LANGUAGE RULE: ALL output text MUST be written in ENGLISH ONLY. This is non-negotiable.
Every field - strengths, improvements, integrity, thinking, criteria descriptions - MUST be in English. 
Do NOT use Arabic or any other language regardless of the assignment or rubric language.

Strict Instructions & Mathematical Evaluation Rigor:
1. The Rubric is the master reference. You MUST include EVERY learning outcome/criterion mentioned in the Rubric in the final report.
2. **Zero Evidence Rule:** If a student only answers a specific part of the assignment (e.g., they only answered LO3 and completely skipped/ignored LO1 and LO2), you MUST strictly award a score of 0, mark the status as 'Not Achieved', and write "No evidence or answer provided by the student for this criterion." in the description. Do NOT award any partial or full marks for unanswered criteria.
3. **Strict Mathematical Score Calculation:** The overall cumulative score (score) MUST be mathematically calculated exactly as: (Sum of actual awarded scores for all criteria ÷ Sum of maximum possible max scores for all criteria) * 100. Intuitive or disconnected scoring is strictly forbidden. The overall score MUST match this formula precisely.
4. Align the cumulative score with the appropriate grade according to these academic rules:
   - Score < 50%: grade MUST be Incomplete.
   - Score 50% - 59%: grade MUST be Pass.
   - Score 60% - 69%: grade MUST be Merit.
   - Score 70% - 100%: grade MUST be Distinction.
5. Descriptions must be academic and professional IN ENGLISH ONLY.
6. Values for "status" must be 'Achieved' or 'Not Achieved'.
7. Values for "depth" must be 'Analytical' or 'Descriptive'.
8. Respond ONLY in JSON format, no markdown fences.

Input Data:
--- Assignment ---
${assignment}

--- Rubric ---
${rubric}

Analyze and output JSON:
{
  "score": <precise overall cumulative mathematically calculated score between 0 and 100>,
  "grade": "<Pass/Merit/Distinction/Incomplete>",
  "criteria": [
    { "id": "Criterion name", "max": 100, "awarded": <number>, "status": "Achieved/Not Achieved", "depth": "Analytical/Descriptive", "desc": "Detailed academic justification in English ONLY" }
  ],
  "strengths": ["Strength 1 in English", "Strength 2 in English"],
  "improvements": ["Improvement 1 in English"],
  "integrity": "Integrity assessment in English",
  "thinking": "Critical thinking evaluation in English"
}`;
    },

    async analyzeAssignment(assignment: string, rubric: string, options: any, explicitApiKey?: string) {
        const apiKey = explicitApiKey || process.env.GEMINI_API_KEY;
        const prompt = this.generatePrompt(assignment, rubric, options);

        if (apiKey && apiKey.startsWith('sk-or-')) {
            return this.analyzeWithOpenRouter(prompt, apiKey);
        }

        if (!apiKey) {
            throw new Error('API key not provided');
        }

        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text || '';
            return this.parseAIResponse(text);
        } catch (error: any) {
            const msg = error.message || "";
            if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
                throw new Error("تجاوزت حد الاستخدام المسموح لـ Gemini حالياً. يرجى الانتظار دقيقة أو استخدام محرك OpenRouter.");
            }
            if (msg.includes("503") || msg.toLowerCase().includes("overloaded")) {
                throw new Error("محرك Gemini يعاني من ضغط حالياً. يرجى المحاولة بعد قليل أو التبديل لمحرك آخر.");
            }
            console.error("Gemini AI Error:", error.message);
            throw error;
        }
    },

    async analyzeWithOpenRouter(prompt: string, apiKey: string) {
        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'meta-llama/llama-3.1-70b-instruct:free',
                messages: [{ role: 'system', content: 'You are a professional academic assessor that only outputs JSON.' }, { role: 'user', content: prompt }],
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://erp-xi-lac.vercel.app',
                    'X-Title': 'OSARAB ERP'
                }
            });

            const text = response.data.choices[0].message.content;
            return this.parseAIResponse(text);
        } catch (error: any) {
            const errorData = error.response?.data;
            if (errorData?.error?.code === 429) {
                throw new Error("تجاوزت حد الاستخدام لـ OpenRouter. يرجى التحقق من حصة مفتاحك.");
            }
            console.error("OpenRouter AI Error:", errorData || error.message);
            throw error;
        }
    },

    parseAIResponse(text: string) {
        try {
            // Aggressively extract JSON from potential conversational text or markdown
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const cleanText = jsonMatch ? jsonMatch[0] : text;
            
            // Remove markdown code blocks if still present
            const finalJson = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(finalJson);
        } catch (error) {
            console.error('Failed to parse AI response:', text);
            throw new Error('AI Engine returned invalid format. Please try again.');
        }
    }
};
