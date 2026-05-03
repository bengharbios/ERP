
// ============================================
// LOCAL AI SERVICE (OFFLINE & FREE)
// Specialized for Arabic & Business Intent
// ============================================

export interface AnalysisResult {
    intent: 'pricing' | 'booking' | 'inquiry' | 'objection' | 'support' | 'greeting' | 'general';
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    summary: string;
    suggestedAction: string;
}

class LocalAIService {
    private patterns = {
        pricing: /(^|\s)(سعر|كم|بكم|تكلفة|تكلف|فلوس|رسوم|قديش|كام|price|cost|fees)(\s|$)/i,
        booking: /(^|\s)(حجز|سجلني|سجل|اشتراك|انضمام|ابغى|أبغى|عايز|اريد|أريد|book|register|join|enroll)(\s|$)/i,
        location: /(^|\s)(موقع|مكان|وين|أين|اين|عنوان|لوكيشن|location|address|where)(\s|$)/i,
        programs: /(^|\s)(دبلوم|دبلومات|دورة|دورات|كورس|كورسات|دراسة|تخصص|برنامج|برامج|diploma|course|program)(\s|$)/i,
        online: /(^|\s)(اونلاين|أونلاين|عن بعد|حضوري|بث|مباشر|online|remote|zoom|teams)(\s|$)/i,
        study_type: /(^|\s)(نوع|مانوع|طبيعة|منهج|كيفية|نظام|تحصيل|study|type|nature)(\s|$)/i,
        inquiry: /(^|\s)(معلومات|تفاصيل|عن|ايش|شو|شرح|info|details|what)(\s|$)/i,
        objection: /(^|\s)(غالي|بعيد|وقت|مشكلة|صعب|expensive|hard|problem|delay)(\s|$)/i,
        support: /(^|\s)(مساعدة|مشكلة|خطأ|عطل|help|problem|error|how)(\s|$)/i,
        greeting: /(^|\s)(سلام|مرحبا|صباح|مساء|أهلا|اهلا|هاي|hello|hi|hey|ahlan)(\s|$)/i
    };

    private sentimentPatterns = {
        positive: /ممتاز|رائع|حلو|جميل|شكرا|قواكم|تمام|ماشي|ok|great|good|excellent|thanks/i,
        negative: /سيء|ماعجبني|غلط|تأخير|فشل|bad|wrong|failure|disappointing/i
    };

    analyze(text: string, history: any[] = []): AnalysisResult {
        const msg = text.toLowerCase();
        let intent: AnalysisResult['intent'] = 'general';
        let sentiment: AnalysisResult['sentiment'] = 'neutral';
        let score = 5; // This line was intended to be removed in the user's diff, but it's used later. Keeping it for syntactic correctness.
        let summary = 'استفسار عام من العميل.';
        let suggestedAction = 'الرد بترحيب وطلب مزيد من التفاصيل.';

        // 1. Identify Intent
        if (this.patterns.booking.test(msg)) {
            intent = 'booking';
            score = 40;
            summary = 'العميل أبدى رغبة قوية في الحجز أو التسجيل.';
            suggestedAction = 'أرسل رابط التسجيل أو حدد موعداً للمتابعة.';
        } else if ((this.patterns as any).location.test(msg)) {
            intent = 'inquiry';
            score = 20;
            summary = 'استفسار عن موقع المعهد أو العنوان.';
            suggestedAction = 'أرسل لوكيشن المعهد عبر خرائط جوجل.';
        } else if ((this.patterns as any).online.test(msg)) {
            intent = 'inquiry';
            score = 25;
            summary = 'استفسار عن إمكانية الدراسة أونلاين أو عن بعد.';
            suggestedAction = 'وضح للعميل خيارات التعليم المدمج أو التعليم عن بعد المتاحة.';
        } else if ((this.patterns as any).study_type.test(msg)) {
            intent = 'inquiry';
            score = 20;
            summary = 'استفسار عن طبيعة ونظام الدراسة في المعهد.';
            suggestedAction = 'أرسل شرحاً لنظام المحاضرات (نظري/عملي) والجدول الدراسي.';
        } else if ((this.patterns as any).programs.test(msg)) {
            intent = 'inquiry';
            score = 25;
            summary = 'استفسار عن الدبلومات أو البرامج التدريبية المتاحة.';
            suggestedAction = 'أرسل تفاصيل البرنامج التدريبي أو البروشور التعليمي.';
        } else if (this.patterns.pricing.test(msg)) {
            intent = 'pricing';
            score = 25;
            summary = 'استفسار عن الأسعار أو التكاليف.';
            suggestedAction = 'أرسل ملف الأسعار أو عرض خصم حالي.';
        } else if (this.patterns.objection.test(msg)) {
            intent = 'objection';
            score = 15;
            summary = 'العميل لديه اعتراضات أو مخاوف (السعر، الموقع، الوقت).';
            suggestedAction = 'قدم أدلة اجتماعية (تجارب طلاب) أو حلول بديلة.';
        } else if (this.patterns.inquiry.test(msg)) {
            intent = 'inquiry';
            score = 15;
            summary = 'طلب معلومات إضافية أو تفاصيل عن البرامج.';
            suggestedAction = 'أرسل الدليل التعريفي الشامل أو الأسئلة الشائعة.';
        } else if (this.patterns.support.test(msg)) {
            intent = 'support';
            score = 10;
            summary = 'العميل يحتاج مساعدة تقنية أو لديه مشكلة.';
            suggestedAction = 'حول الطلب لفريق الدعم أو قدم دليل المساعدة.';
        } else if (this.patterns.greeting.test(msg)) {
            intent = 'greeting';
            score = 5;
            summary = 'مبادرة بالتحية والترحيب.';
            suggestedAction = 'رد برسالة ترحيبية مهنية مخصصة.';
        }

        // 2. Identify Sentiment
        if (this.sentimentPatterns.positive.test(msg)) {
            sentiment = 'positive';
            score += 10;
        } else if (this.sentimentPatterns.negative.test(msg)) {
            sentiment = 'negative';
            score -= 5;
        }

        // 3. Weight by History
        if (history.length > 5) score += 10;
        if (history.some(h => (h.metadata?.scoreChange || 0) > 20)) score += 5;

        // 4. Smart Profiling (2026 Logic)
        if (intent === 'booking' && sentiment === 'positive') {
            summary = '🔥 عميل جاهز للإغلاق - اهتمام عالٍ جداً بالبرنامج.';
            suggestedAction = 'تواصل معه هاتفياً فوراً لإتمام عملية التسجيل.';
        }

        return { intent, sentiment, score, summary, suggestedAction };
    }

    async analyzeAsync(text: string, config: { enabled: boolean; provider: string; apiKey?: string }): Promise<AnalysisResult> {
        // Always Start with Local Analysis (Fast & Free)
        const localResult = this.analyze(text);

        // If External AI is not enabled or no API key, return local result
        if (!config.enabled || !config.apiKey) {
            return localResult;
        }

        try {
            // Enhanced External Reasoning (Placeholder logic for API call)
            // In a real scenario, this would call OpenAI/Gemini
            const summary = await this.callExternalAI(text, config.provider, config.apiKey);

            // Merge results: Use local intent/sentiment but enhanced external summary
            return {
                ...localResult,
                summary: summary || localResult.summary,
                suggestedAction: `[AI معزز] ${localResult.suggestedAction}`
            };
        } catch (error) {
            console.error('External AI Error:', error);
            return localResult;
        }
    }

    private async callExternalAI(_text: string, provider: string, _apiKey: string): Promise<string> {
        // This is where you would implement the actual fetch/request to OpenAI/Gemini
        // For demonstration, we simulate a "Smart" Arabic response
        return `[تحليل عميق عبر ${provider}] استفسار العميل يتجاوز الأنماط المباشرة ويحتاج لتواصل استراتيجي.`;
    }

    generateProfileSummary(activities: any[]): string {
        const intents = activities.map(a => a.metadata?.intent).filter(Boolean);
        const mostCommon = intents.sort((a, b) =>
            intents.filter(v => v === a).length - intents.filter(v => v === b).length
        ).pop();

        switch (mostCommon) {
            case 'pricing': return 'مهتم بالسعر، يبحث عن القيمة مقابل التكلفة.';
            case 'booking': return 'متحفز جداً، يجب نقله لمرحلة التسجيل النهائي.';
            case 'inquiry': return 'باحث عن التفاصيل، يحتاج لمعلومات دقيقة لاتخاذ القرار.';
            case 'objection': return 'متردد، يحتاج لضمانات أو تجارب سابقة لبناء الثقة.';
            default: return 'مستكشف، يحتاج لتواصل مستمر وبناء علاقة.';
        }
    }
}

export const localAiService = new LocalAIService();
