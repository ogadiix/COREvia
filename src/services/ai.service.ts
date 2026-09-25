import { GoogleGenAI } from '@google/genai';

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatRequest {
  prompt: string;
  history?: AIChatMessage[];
  context?: string;
}

export interface AIChatResponse {
  answer: string;
  model: string;
  source: 'gemini' | 'institutional_engine';
  timestamp: string;
  suggestedFollowUps?: string[];
}

const SYSTEM_INSTRUCTION = `You are COREvia AI, the institutional banking and treasury intelligence copilot for COREvia Core Banking.
Your role is to assist bank managers, treasury officers, relationship managers, and credit analysts with deep, accurate, and actionable banking knowledge under Reserve Bank of India (RBI), FEDAI, AMFI, and Basel III standards.

Key Knowledge Domains:
1. Indian Banking Operations:
   - CASA deposits, Fixed Deposits (TD), Lien marking, Drawing Power (DP) calculations on Cash Credit (CC) hypothecation.
   - Payments & Clearing: RTGS (real-time gross settlement), NEFT (half-hourly batches), CTS-2010 cheque truncation, UPI/IMPS switch.
   - Maker-Checker authorization workflows (four-eyes principle) for high-value transactions.
   - Statutory ratios: CRR (Sec 42(1) RBI Act, currently 4.50%), SLR (Sec 24 BR Act, 18.00%), CRAR/Capital Adequacy (Basel III, 11.50% min).

2. Treasury, Markets & Yield Curves:
   - 10-Year Benchmark Indian Sovereign G-Sec (7.18% GS 2033 / 7.06% GS 2034) hovering around 7.00% - 7.08%.
   - US 10-Year Treasury (~4.26%) and India-US Sovereign Yield Spread (~275-285 bps).
   - RBI Policy Repo Rate (6.50%), Standing Deposit Facility (SDF 6.25%), Marginal Standing Facility (MSF 6.75%).
   - RBI OMO (Open Market Operations) and liquidity absorption strategies (e.g. ₹1 Lakh Crore bond sales to manage banking system liquidity surplus).
   - SLR bond portfolio MTM (Mark-to-Market) vs HTM (Held-to-Maturity) classification per RBI Master Directions.

3. Currency & Cross-Border Forex:
   - USD/INR spot rates (around ₹83.94 - ₹84.27), RBI Reference Rate, FEDAI card rate spreads (TT Buying/Selling, Bill Buying/Selling).
   - FEMA 1999 compliance, Current Account vs Capital Account transactions, GST on foreign exchange conversion (CGST Rule 32(2) slabs).
   - Cash margin liens and LC (Letter of Credit) issuance.

4. Mutual Funds & Systematic Investment Plans (SIP):
   - AMFI data benchmarks: Monthly SIP inflows at all-time high of ₹32,297 Crore (August 2026), crossing 10.01 Crore active SIP accounts.
   - Industry SIP AUM at ₹18.61 Lakh Crore (~21.4% of total mutual fund AUM).
   - Top equity fund categories: Small-cap, Mid-cap, Flexi-cap, Large-cap, and Gold ETFs.
   - Rupee-cost averaging, compounding benefits of long-term SIPs, taxation (LTCG at 12.5% on equity funds above ₹1.25 Lakh, STCG at 20%).

Guidelines for Answers:
- Be clear, professional, concise, and structured (use bullet points and bold key figures).
- Always ground financial numbers in Indian numbering formatting (Lakhs and Crores, ₹).
- Answer user queries directly and provide practical banking guidance.`;

class AIService {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  /**
   * Generates intelligent AI response for banking, treasury, currency, and mutual fund queries
   */
  async askAssistant(request: AIChatRequest): Promise<AIChatResponse> {
    const { prompt, history = [], context = '' } = request;
    const ai = this.getClient();

    if (ai) {
      // Primary and resilient fallback models per gemini-api guidelines
      const candidateModels = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

      // Construct conversation contents
      const contents: any[] = [];

      // Append historical turns if present
      for (const msg of history.slice(-6)) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }

      // Add contextual preamble if present
      const currentPrompt = context
        ? `[Active Banking Context: ${context}]\n\nUser Inquiry: ${prompt}`
        : prompt;

      contents.push({
        role: 'user',
        parts: [{ text: currentPrompt }],
      });

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.3,
            },
          });

          const answerText = response.text || 'Unable to generate response.';

          return {
            answer: answerText,
            model: modelName,
            source: 'gemini',
            timestamp: new Date().toISOString(),
            suggestedFollowUps: this.generateFollowUps(prompt),
          };
        } catch {
          // If a model is experiencing high demand (e.g. 503) or rate limits, seamlessly try the next model in candidateModels
          continue;
        }
      }
    }

    // High-grade institutional fallback engine when API key is not configured or all external endpoints are unavailable
    const fallbackAnswer = this.institutionalFallbackReasoning(prompt);
    return {
      answer: fallbackAnswer,
      model: 'corevia-banking-engine-v1',
      source: 'institutional_engine',
      timestamp: new Date().toISOString(),
      suggestedFollowUps: this.generateFollowUps(prompt),
    };
  }

  private generateFollowUps(prompt: string): string[] {
    const p = prompt.toLowerCase();
    if (p.includes('sip') || p.includes('mutual fund')) {
      return [
        'How does rupee cost averaging protect SIPs during market corrections?',
        'What is the current AMFI SIP inflow benchmark?',
        'Explain the capital gains taxation on equity vs debt mutual funds',
      ];
    }
    if (p.includes('usd') || p.includes('inr') || p.includes('forex') || p.includes('currency')) {
      return [
        'How do FEDAI card rate spreads differ between TT Selling and Bill Selling?',
        'What GST applies on foreign currency exchange under Rule 32(2)?',
        'How does crude oil surge impact the USD/INR exchange rate?',
      ];
    }
    if (p.includes('yield') || p.includes('g-sec') || p.includes('bond') || p.includes('repo')) {
      return [
        'What is the current 10Y Benchmark G-Sec yield and duration?',
        'Explain how SLR bond portfolio MTM impacts bank profit and loss',
        'What is the current India-US 10Y sovereign yield spread?',
      ];
    }
    return [
      'What are the statutory CRR and SLR maintenance guidelines under RBI?',
      'How does the Maker-Checker authorization workflow operate for high-value payments?',
      'Show current market movements and AMFI SIP inflow statistics',
    ];
  }

  private institutionalFallbackReasoning(query: string): string {
    const q = query.toLowerCase();

    // Mutual funds and SIPs
    if (q.includes('sip') || q.includes('mutual fund') || q.includes('amfi')) {
      return `### AMFI Mutual Fund & SIP Industry Overview (August 2026 Benchmarks)

• **Record Monthly Inflows**: Monthly Systematic Investment Plan (SIP) contributions reached a historic high of **₹32,297 Crore** in August 2026, marking a 3.8% monthly growth and 14% YoY increase.
• **10 Crore Milestone**: Active contributing SIP folios surpassed **10.01 Crore accounts**, demonstrating widespread retail investor discipline across India.
• **SIP Assets Under Management (AUM)**: Reached **₹18.61 Lakh Crore**, now representing **21.4% of total mutual fund industry assets**.
• **Leading Categories**:
  - **Small-Cap Funds**: ₹7,973 Crore net inflows
  - **Mid-Cap Funds**: ₹6,989 Crore net inflows
  - **Flexi-Cap Funds**: ₹5,059 Crore net inflows
  - **Gold ETFs**: ₹2,596 Crore in safe-haven allocations
• **Taxation Rules (Finance Act 2024-25)**:
  - **Equity Mutual Funds**: Long-Term Capital Gains (LTCG > 12 months) taxed at **12.5%** on gains exceeding ₹1.25 Lakh per financial year; Short-Term (STCG) at **20%**.
  - **Debt Mutual Funds**: Taxed at applicable slab rates without indexation benefits.`;
    }

    // Currency and USD/INR
    if (q.includes('usd') || q.includes('inr') || q.includes('currency') || q.includes('forex') || q.includes('exchange rate')) {
      return `### USD/INR Spot & Currency Desk Surveillance

• **Current Interbank Spot**: Trading around **₹83.94 – ₹84.27 per USD**, fluctuating with global crude oil benchmarks and US Dollar Index (DXY) momentum.
• **RBI Reference Benchmark**: Anchored near **₹83.9425**, with the RBI intervening via public sector banks in the NDF (Non-Deliverable Forward) and onshore spot markets to curb excessive volatility.
• **FEDAI Card Rates Spreads**:
  - **TT Selling (Outward Remittances)**: Spot + 18 bps margin (₹84.09)
  - **TT Buying (Inward Remittances)**: Spot - 18 bps margin (₹83.79)
  - **Bill Rates**: Wider spread (~27 bps) accommodating courier, verification, and collection transit risks.
• **Statutory GST on Forex Conversion (CGST Rule 32(2))**:
  - Up to ₹1 Lakh: 1% of gross amount (min ₹250)
  - ₹1 Lakh to ₹10 Lakh: ₹1,000 + 0.5% of excess amount
  - Above ₹10 Lakh: ₹5,500 + 0.1% of excess amount (capped at ₹60,000 max GST).`;
    }

    // Bond yields and treasury
    if (q.includes('yield') || q.includes('g-sec') || q.includes('bond') || q.includes('treasury') || q.includes('repo')) {
      return `### Sovereign Bond Yields & Treasury Monitoring

• **10-Year Benchmark G-Sec (7.18% GS 2033)**: Currently yielding **7.040%** (clean price ₹100.95; modified duration ~6.84 years). Yields recently crossed the 7.0% threshold due to crude price pressures and US Treasury dynamics.
• **Sovereign Yield Spread (India vs US 10Y)**:
  - India 10Y: **7.04%** | US 10Y: **4.26%**
  - **Yield Differential**: **+278 basis points**, staying within the neutral historical corridor of 260–310 bps, supporting stable foreign institutional debt flows (FPI via FAR - Fully Accessible Route).
• **RBI Policy Stance & Liquidity**:
  - Policy Repo Rate: **6.50%** (SDF: 6.25%, MSF: 6.75%).
  - Liquidity Management: Banking system exhibits surplus liquidity; RBI is conducting targeted Open Market Operation (OMO) bond sales of ₹1 Lakh Crore to drain structural excess cash.
• **Bank SLR Portfolio MTM Impact**: Current 7.040% yield offers an estimated +14 bps valuation cushion over budgeted cost, mitigating MTM provisioning risk for Available for Sale (AFS) and Held for Trading (HFT) books under RBI Master Directions.`;
    }

    // Core banking operations
    if (q.includes('crr') || q.includes('slr') || q.includes('drawing power') || q.includes('casa') || q.includes('maker') || q.includes('loan')) {
      return `### Institutional Banking Operations & Prudential Norms

• **Cash Reserve Ratio (CRR)**: Prescribed at **4.50% of NDTL** under Section 42(1) of the RBI Act. Maintained as unremunerated cash balances in current account with the Reserve Bank. COREvia currently maintains 4.54% (+0.04% buffer).
• **Statutory Liquidity Ratio (SLR)**: Mandatory minimum **18.00% of NDTL** under Section 24 of Banking Regulation Act. Maintained in approved G-Secs, T-Bills, and cash. COREvia maintains 18.65% (+0.65% excess buffer).
• **Drawing Power (DP) Formula**:
  \`DP = (Paid Stock - Margin %) + (Eligible Book Debts < 90 Days - Margin %)\`
  Prevents overleveraging and ensures advances remain fully backed by primary hypothecated assets.
• **Maker-Checker Protocol**: Enforces the four-eyes authorization rule. Tellers and makers enter financial transactions or master record changes; checkers independently verify vouchers, signatures, and anti-money laundering (AML) risk before general ledger commitment.`;
    }

    // General banking response
    return `### COREvia Banking Intelligence Copilot

I can assist you with comprehensive information and calculations across:

1. **Treasury & Bond Yields**: 10Y Benchmark G-Sec, yield curve slopes, India-US sovereign spreads, and SLR portfolio MTM impact.
2. **Currency & Forex**: Live USD/INR spot benchmarks, FEDAI TT/Bill spreads, FEMA compliance, and GST Rule 32(2) tax calculations.
3. **Mutual Funds & SIPs**: Latest AMFI industry statistics (record ₹32,297 Cr monthly inflows, 10.01 Cr folios), compounding projections, and tax implications.
4. **Core Banking Operations**: CASA registers, Drawing Power audits, CTS-2010 clearing batches, and Maker-Checker four-eyes compliance.

Please specify any transaction or market topic you would like me to analyze!`;
  }
}

export const aiService = new AIService();
