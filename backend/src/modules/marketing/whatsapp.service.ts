import { Client, LocalAuth, Message } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import prisma from '../../common/db/prisma';
import { localAiService } from './localAi.service';

// ============================================
// WHATSAPP CLIENT MANAGER
// ============================================

class WhatsAppService {
    private client: Client | null = null;
    private isReady = false;
    private connectionState: 'DISCONNECTED' | 'INITIALIZING' | 'AUTHENTICATING' | 'READY' = 'DISCONNECTED';
    private lastQrCode: string | null = null;
    private messageHandlers: Array<(msg: Message) => void> = [];

    constructor() {
        this.initializeClient();
    }

    async initializeClient() {
        if (this.client && this.connectionState !== 'DISCONNECTED') {
            return; // Already connecting or connected
        }

        if (this.client) {
            try {
                await this.client.destroy();
            } catch (e) {
                console.error('Error destroying client:', e);
            }
        }

        console.log('🔧 Initializing WhatsApp Client...');
        this.lastQrCode = null;
        this.isReady = false;
        this.connectionState = 'INITIALIZING';

        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: 'institute-erp'
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            }
        });

        this.setupEventHandlers();
        this.client.initialize().catch(err => {
            console.error('Failed to initialize client:', err);
            this.connectionState = 'DISCONNECTED';
        });
    }

    private setupEventHandlers() {
        if (!this.client) return;

        // QR Code for first-time setup
        this.client.on('qr', (qr) => {
            console.log('\n📱 Scan this QR code with your WhatsApp:');
            this.lastQrCode = qr;
            this.connectionState = 'DISCONNECTED';
            qrcode.generate(qr, { small: true });
            console.log('\n👆 Open WhatsApp → Linked Devices → Scan QR\n');
        });

        // Ready
        this.client.on('ready', () => {
            console.log('✅ WhatsApp Client is READY!');
            this.isReady = true;
            this.connectionState = 'READY';
            this.lastQrCode = null;
        });

        // Authentication
        this.client.on('authenticated', () => {
            console.log('✅ WhatsApp Authenticated');
            this.connectionState = 'AUTHENTICATING';
            this.lastQrCode = null;
        });

        // Disconnected
        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp Disconnected:', reason);
            this.isReady = false;
            this.connectionState = 'DISCONNECTED';
        });

        // Auth failure
        this.client.on('auth_failure', (msg) => {
            console.error('❌ WhatsApp Auth Failure:', msg);
            this.connectionState = 'DISCONNECTED';
            this.isReady = false;
        });

        // Incoming Messages
        this.client.on('message', async (message) => {
            await this.handleIncomingMessage(message);
        });

        // Message Acknowledgements (read receipts)
        this.client.on('message_ack', async (msg, ack) => {
            // ack: 0 = sent, 1 = delivered, 2 = read
            if (ack === 2) {
                await this.handleMessageRead(msg);
            }
        });
    }

    // ============================================
    // MESSAGE HANDLING
    // ============================================

    private async handleIncomingMessage(message: Message) {
        try {
            // Skip if message from self
            if (message.fromMe) {
                await this.handleOutgoingMessage(message);
                return;
            }

            // WhatsApp Group Chat Report Parser for CRM
            if (message.from.endsWith('@g.us')) {
                try {
                    // 1. Fetch system settings to check if WhatsApp CRM integration is enabled
                    const systemSetting = await prisma.systemSetting.findFirst({
                        where: { key: 'telegram_crm_config' }
                    });
                    
                    if (systemSetting) {
                        const crmConfig = JSON.parse(systemSetting.value);
                        
                        if (crmConfig.whatsappBotEnabled) {
                            const chat = await message.getChat();
                            const groupName = chat.name || '';
                            
                            // 2. Filter allowed group names if configured
                            const allowedStr = crmConfig.whatsappAllowedGroups || '';
                            let isGroupAllowed = true;
                            
                            if (allowedStr.trim().length > 0) {
                                const allowedGroups = allowedStr.split(',').map((g: string) => g.trim().toLowerCase());
                                isGroupAllowed = allowedGroups.includes(groupName.toLowerCase());
                            }
                            
                            if (isGroupAllowed) {
                                const text = message.body || '';
                                
                                // Test if the text matches a CRM structured sales report
                                const isReport = /الاسم\s*:/i.test(text) && /(?:رقم\s*)?الهاتف\s*:/i.test(text);
                                
                                if (isReport) {
                                    console.log(`📲 [WhatsApp CRM] Parsing sales report from WhatsApp group "${groupName}"...`);
                                    
                                    const { crmService } = require('../../crm/crm.service');
                                    const parsedData = crmService.parseTelegramMessage(text);
                                    
                                    if (parsedData && parsedData.phone) {
                                        const result = await crmService.updateLeadFromMessage(parsedData);
                                        
                                        // Send a confirmation text back to the WhatsApp group so the salesperson knows it registered!
                                        const clientName = result.lead?.name || parsedData.name || 'العميل';
                                        const spName = result.lead?.salesperson ? `${result.lead.salesperson.firstName || ''} ${result.lead.salesperson.lastName || ''}`.trim() : 'الموظف المسؤول';
                                        
                                        await message.reply(
                                            `✅ *تم تسجيل التقرير بنجاح في نظام السلام CRM وجوجل شيت!* 📝\n\n` +
                                            `👤 *العميل:* ${clientName}\n` +
                                            `📁 *الحالة:* تم التحديث والجدولة\n` +
                                            `👤 *الموظف المسؤول:* ${spName}`
                                        );
                                        console.log(`✅ [WhatsApp CRM] Sales report for "${clientName}" successfully processed and logged!`);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                } catch (err: any) {
                    console.error('❌ [WhatsApp CRM] Error parsing group report:', err.message);
                }
                
                // Do not continue to create marketing activities for group messages
                return;
            }

            const contact = await message.getContact();
            const phoneNumber = message.from.replace('@c.us', '');
            const messageText = message.body;
            const contactName = contact.pushname || contact.name || 'Unknown';

            console.log(`📩 New message from ${contactName}: "${messageText}"`);

            // Find or create lead
            let lead = await prisma.marketingLead.findFirst({
                where: { phone: phoneNumber },
                include: {
                    activities: { orderBy: { timestamp: 'desc' }, take: 5 }
                }
            });

            const isDuplicate = !!lead;

            if (!lead) {
                // Create new lead first
                lead = await prisma.marketingLead.create({
                    data: {
                        phone: phoneNumber,
                        firstName: contactName.split(' ')[0],
                        lastName: contactName.split(' ').slice(1).join(' ') || '',
                        source: 'WhatsApp',
                        status: 'NEW',
                        interestScore: 10
                    },
                    include: { activities: true }
                });
                console.log(`✨ New lead created: ${contactName}`);
            }

            if (!lead) return;

            // Deep Analysis with Local AI (Free, Offline, Arabic)
            const _activities = (lead as any).activities || [];
            const _analysis = localAiService.analyze(messageText, _activities);

            // Calculate impact
            const currentScore = lead.interestScore || 0;
            const newScore = Math.min(100, currentScore + _analysis.score);
            const profileSummary = localAiService.generateProfileSummary([..._activities, { metadata: _analysis }]);

            // Update Lead Intelligence
            await prisma.marketingLead.update({
                where: { id: lead.id },
                data: {
                    interestScore: newScore,
                    aiFollowUpNotes: `${_analysis.summary} | ${profileSummary}`,
                    lastActivity: new Date()
                }
            });

            // Record Global Activity
            await prisma.leadActivity.create({
                data: {
                    leadId: lead.id,
                    activityType: 'whatsapp_message_received',
                    channel: 'WhatsApp',
                    metadata: {
                        message: messageText,
                        contactName,
                        isDuplicate,
                        intent: _analysis.intent,
                        sentiment: _analysis.sentiment,
                        scoreChange: _analysis.score,
                        newScore,
                        summary: _analysis.summary,
                        suggestedAction: _analysis.suggestedAction,
                        timestamp: new Date().toISOString()
                    }
                }
            });

            // Smart Notification
            const priority = this.determinePriority(newScore, _analysis.intent);
            await this.sendNotification({
                leadId: lead.id,
                leadName: contactName,
                phone: phoneNumber,
                message: messageText,
                intent: _analysis.intent,
                score: newScore,
                priority,
                isDuplicate,
                recommendation: _analysis.suggestedAction || this.getRecommendation(newScore, _analysis.intent)
            });

            // Call any registered handlers
            this.messageHandlers.forEach(handler => handler(message));

        } catch (error) {
            console.error('Error handling incoming message:', error);
        }
    }

    private async handleOutgoingMessage(message: Message) {
        try {
            const phoneNumber = message.to.replace('@c.us', '');

            const lead = await prisma.marketingLead.findFirst({
                where: { phone: phoneNumber }
            });

            if (lead) {
                await prisma.leadActivity.create({
                    data: {
                        leadId: lead.id,
                        activityType: 'whatsapp_message_sent',
                        channel: 'WhatsApp',
                        metadata: {
                            message: message.body,
                            timestamp: new Date().toISOString()
                        }
                    }
                });

                console.log(`📤 Outgoing message logged for lead ${lead.id}`);
            }
        } catch (error) {
            console.error('Error handling outgoing message:', error);
        }
    }

    private async handleMessageRead(message: Message) {
        try {
            const phoneNumber = message.to.replace('@c.us', '');

            const lead = await prisma.marketingLead.findFirst({
                where: { phone: phoneNumber }
            });

            if (lead) {
                await prisma.leadActivity.create({
                    data: {
                        leadId: lead.id,
                        activityType: 'whatsapp_message_read',
                        channel: 'WhatsApp',
                        metadata: {
                            messageId: message.id._serialized,
                            timestamp: new Date().toISOString()
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error handling message read:', error);
        }
    }

    // ============================================
    // NOTIFICATION & HELPERS
    // ============================================

    // ============================================
    // PRIORITY & RECOMMENDATIONS
    // ============================================

    private determinePriority(score: number, intent: string): string {
        if (score >= 85 || intent === 'high_intent') return 'CRITICAL';
        if (score >= 60 || intent === 'pricing') return 'HIGH';
        if (score >= 40) return 'MEDIUM';
        return 'LOW';
    }

    private getRecommendation(score: number, intent: string): string {
        if (intent === 'high_intent') {
            return 'رد فوراً! العميل جاهز للتسجيل';
        }
        if (intent === 'pricing') {
            return 'أرسل تفاصيل السعر مع عرض خاص';
        }
        if (intent === 'demo') {
            return 'جدول موعد Demo خلال 24 ساعة';
        }
        if (score >= 70) {
            return 'عميل WARM - متابعة خلال ساعة';
        }
        if (score >= 40) {
            return 'عميل محتمل - متابعة خلال 3 ساعات';
        }
        return 'رد عادي خلال 6 ساعات';
    }

    private async sendNotification(notification: {
        leadId: string;
        leadName: string;
        phone: string;
        message: string;
        intent: string;
        score: number;
        priority: string;
        isDuplicate: boolean;
        recommendation: string;
    }) {
        // For now, log to console
        // In production, this would send to frontend via WebSocket or notification service

        const icon = {
            CRITICAL: '🚨',
            HIGH: '🔥',
            MEDIUM: '🔔',
            LOW: '💤'
        }[notification.priority] || '📩';

        console.log(`\n${icon} ${notification.priority} PRIORITY NOTIFICATION`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`From: ${notification.leadName} (${notification.phone})`);
        console.log(`Message: "${notification.message}"`);
        console.log(`Intent: ${notification.intent} | Score: ${notification.score}/100`);
        console.log(`Status: ${notification.isDuplicate ? '🔄 Repeat Contact' : '✨ New Lead'}`);
        console.log(`💡 Recommendation: ${notification.recommendation}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // TODO: Send to frontend dashboard via WebSocket
    }

    // ============================================
    // PUBLIC METHODS
    // ============================================


    async sendMessage(to: string, message: string): Promise<boolean> {
        if (!this.isReady || !this.client) {
            console.error('WhatsApp client is not ready');
            return false;
        }

        try {
            const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
            await this.client.sendMessage(chatId, message);
            console.log(`✅ Message sent to ${to}`);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    getStatus() {
        console.log(`[WhatsAppService] Current State: ${this.connectionState}, Ready: ${this.isReady}, QR: ${!!this.lastQrCode}`);
        return {
            isReady: this.isReady,
            isConnected: this.client !== null,
            connectionState: this.connectionState,
            qrCode: this.lastQrCode
        };
    }

    async logout() {
        if (this.client) {
            await this.client.logout();
            await this.initializeClient();
            return true;
        }
        return false;
    }

    onMessage(handler: (msg: Message) => void) {
        this.messageHandlers.push(handler);
    }

    async disconnect() {
        if (this.client) {
            await this.client.destroy();
            this.isReady = false;
            console.log('WhatsApp client disconnected');
        }
    }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
