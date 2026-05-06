import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

export const aiService = {
    generatePrompt(assignment: string, rubric: string, options: any) {
        const isArabic = options.language !== 'English';
        
        if (isArabic) {
            return `أنت مقيم أكاديمي ذكي متخصص في تحليل الواجبات الدراسية بناءً على معايير التصحيح (Rubric).
            
تعليمات صارمة:
1. المقياس (Rubric) هو المرجع الأساسي؛ يجب أن يحتوي التقرير على **جميع** المعايير المذكورة في المقياس دون استثناء.
2. إذا لم يقم الطالب بالإجابة على معيار معين أو لم يذكره، يجب تقييمه بـ (0) وحالة (Not Achieved) مع كتابة "لم يتم العثور على أدلة" في الوصف.
3. يجب أن تكون جميع النصوص الوصفية باللغة العربية الفصحى والاحترافية.
4. يجب أن تكون قيم "status" هي (Achieved) أو (Not Achieved).
5. يجب أن تكون قيم "depth" هي (Analytical) أو (Descriptive).
6. يجب أن تكون قيمة "grade" حصرياً أحد المصطلحات الإنجليزية التالية: (Pass, Merit, Distinction, Fail).
7. أجب فقط بصيغة JSON، بدون أي نصوص إضافية.

البيانات:
--- الواجب ---
${assignment}

--- المعايير ---
${rubric}

--- الإعدادات ---
حساسية التقييم: ${options.evalMode}

قم بتحليل الواجب وإخراج JSON بهذا الهيكل تماماً:
{
  "score": <رقم بين 0-100>,
  "grade": "Pass / Merit / Distinction / Fail",
  "criteria": [
    { "id": "اسم المعيار", "max": 100, "awarded": <رقم>, "status": "Achieved/Not Achieved", "depth": "Analytical/Descriptive", "desc": "شرح الأسباب بالعربي" }
  ],
  "strengths": ["نقطة قوة 1 بالعربي", "نقطة قوة 2 بالعربي"],
  "improvements": ["نقطة تحسين 1 بالعربي", "نقطة تحسين 2 بالعربي"],
  "integrity": "تقييم النزاهة بالعربي",
  "thinking": "تقييم التفكير النقدي بالعربي"
}`;
        }

        return `You are an automated Assessor Decision AI analyzing an academic assignment against a grading rubric.

Strict Instructions:
1. The Rubric is the master reference. You MUST include EVERY learning outcome/criterion mentioned in the Rubric in the final report.
2. If a criterion is not addressed in the student work, mark it as 'Not Achieved' with a score of 0 and state 'No evidence provided' in the description.
3. Descriptions must be academic and professional.
4. Values for "status" must be 'Achieved' or 'Not Achieved'.
5. Values for "depth" must be 'Analytical' or 'Descriptive'.
6. Respond ONLY in JSON format.

Input Data:
--- Assignment ---
${assignment}

--- Rubric ---
${rubric}

Analyze and output JSON:
{
  "score": <number>,
  "grade": "<Pass/Merit/Distinction/Fail>",
  "criteria": [
    { "id": "Criterion name", "max": 100, "awarded": <number>, "status": "Achieved/Not Achieved", "depth": "Analytical/Descriptive", "desc": "Reasoning in English" }
  ],
  "strengths": ["Strength 1"],
  "improvements": ["Improvement 1"],
  "integrity": "Integrity assessment",
  "thinking": "Critical thinking evaluation"
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
            console.error("OpenRouter AI Error:", error.response?.data || error.message);
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
