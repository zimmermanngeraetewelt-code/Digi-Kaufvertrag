const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { Contract } = require('../models');
const { Op } = require('sequelize');

const { protect } = require('../middleware/auth');

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});

// 1. Natural Language Query (Smart Assistant)
router.post('/query', protect, async (req, res) => {
    try {
        const { prompt, history } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Fetch recent contracts to provide context
        // We exclude signature fields (Base64) to keep the prompt size manageable
        const contracts = await Contract.findAll({
            attributes: { exclude: ['technicianSignature', 'customerSignature'] },
            limit: 100,
            order: [['date', 'DESC']],
        });

        const systemPrompt = `
# ROLES AND GOAL
You are the "Gerätewelt Intelligent Analyst (v2.0)". You are a high-level business consultant specializing in electrical appliance sales data. 
Today's Date: ${new Date().toISOString().split('T')[0]} (YYYY-MM-DD)

# UNIVERSE & DATA
- You have access to the most recent 100 contracts (JSON below).
- "Umsatz/Sales" = ALWAYS 'totalAmount' (Brutto).
- "Netto/Profit" = ALWAYS 'sum'.
- "MwSt/TAX" = ALWAYS 'vatAmount' (19%).

# INTELLIGENCE SUB-SYSTEMS
1. DATE-AWARENESS: Compare Today's Date against 'date' fields. If asked for 'this month', sum all records from now back to the 1st day of the current month.
2. LANGUAGE ADAPTATION: Detect the user's language automatically (English, German, Turkish, Polish, etc.). REPLY ENTIRELY IN THAT SAME LANGUAGE. Maintain professional tone regardless of language.
3. DATA REASONING: If a user asks for "trends", identify common brands (Miele, Bosch) or appliance types (Waschmaschine) appearing most often.
4. CALCULATION ACCURACY: You must perform math yourself. Do NOT say "it's not listed" if the data is in the JSON. You are a calculator.
5. PHONE ORDERS: The field 'isPhoneOrder' (boolean) indicates contracts made over the phone. These often wait for a signature during delivery.

# RESPONSE PROTOCOL
- Be professional, detailed, and data-driven.
- If data is truly missing for a requested range, offer a summary of what IS available.
- Use markdown formatting (bolding, tables if necessary) to make numbers stand out.

Current Data Context (JSON):
${JSON.stringify(contracts, null, 2)}
`;

        // Format history for Claude (if provided)
        const chatMessages = (history || []).map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.content
        }));
        chatMessages.push({ role: 'user', content: prompt });

        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", // Using Haiku for better compatibility and speed
            max_tokens: 1536,
            system: systemPrompt,
            messages: chatMessages,
        });

        res.json({ answer: response.content[0].text });
    } catch (error) {
        console.error('AI Query Error:', error);
        res.status(500).json({ error: 'Failed to process AI query' });
    }
});

// 2. Automated Translation
router.post('/translate', protect, async (req, res) => {
    try {
        const { contractId, targetLanguage } = req.body;
        if (!contractId || !targetLanguage) {
            return res.status(400).json({ error: 'Contract ID and target language are required' });
        }

        const contract = await Contract.findByPk(contractId);
        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        const systemPrompt = `
You are a professional legal and business translator. 
Your task is to translate a German business contract/quotation into ${targetLanguage}.
You MUST maintain the professional, legal tone of a German business document.
Translate all items, descriptions, and terms accurately.
Do NOT translate the company name "Gerätewelt" or specific brand names like "Miele", "Bosch", etc.
Return ONLY the translated content in a clear format.
`;

        const contractData = JSON.stringify({
            customerName: contract.customerName,
            customerAddress: contract.customerAddress,
            deviceType: contract.deviceType,
            items: contract.items,
            paymentMethod: contract.paymentMethod,
            totalAmount: contract.totalAmount,
            date: contract.date
        }, null, 2);

        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: "user", content: `Translate this contract data into ${targetLanguage}:\n\n${contractData}` }],
        });

        res.json({ translatedText: response.content[0].text });
    } catch (error) {
        console.error('AI Translation Error:', error);
        res.status(500).json({ error: 'Failed to process AI translation' });
    }
});

module.exports = router;
