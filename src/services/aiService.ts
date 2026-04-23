import type { ProductContext, Persona, CompletenessResult } from '@/types';
import { DEFAULT_COMPLETENESS_RESULT } from '@/constants';
import { callOpenRouter, streamOpenRouter, hasOpenRouterKey } from './openrouterClient';

// ---------- Routing helpers ----------

async function callAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
  temperature = 0.7,
  maxTokens?: number
): Promise<string> {
  if (hasOpenRouterKey()) {
    return callOpenRouter(messages, { systemPrompt, temperature, maxTokens });
  }
  throw new Error('no-api-key');
}

async function streamAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt: string,
  temperature = 0.7,
  onChunk: (accumulated: string) => void,
  maxTokens?: number
): Promise<string> {
  if (hasOpenRouterKey()) {
    return streamOpenRouter(messages, { systemPrompt, temperature, maxTokens }, onChunk);
  }
  throw new Error('no-api-key');
}

// ---------- Simulate delay for mock ----------
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------- Prompt helpers ----------

function buildProductContextBlock(ctx: ProductContext): string {
  return [
    `Product name: ${ctx.productName}`,
    `Stage: ${ctx.stage}`,
    `Description: ${ctx.description}`,
    `Target users: ${ctx.targetUsers}`,
    `Business model: ${ctx.businessModel || 'n/a'}`,
    `Competitors: ${ctx.competitors || 'n/a'}`,
    `Company goals: ${ctx.companyGoals || 'n/a'}`
  ].join('\n');
}

// ---------- Mock PRD ----------

function mockPRD(productCtx: ProductContext, idea: string): string {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const ideaSnippet = (idea || 'this capability').substring(0, 150);

  return `# ${productCtx.productName} — Feature PRD

| Field | Value |
|---|---|
| Status | Draft v1.0 |
| Priority | P1 |
| Product | ${productCtx.productName} |
| Created | ${today} |

## Executive Summary

${productCtx.productName} is ${productCtx.description}. This feature addresses a critical need for ${productCtx.targetUsers}: ${ideaSnippet}. It aligns with our goal to ${productCtx.companyGoals || 'grow the business'}.

## 1. Problem Statement

### 1.1 The Core Problem

Users struggle with inefficient workflows, causing daily productivity loss.

### 1.2 Evidence

- Support tickets show recurring pain points
- User interviews confirm strong demand
- Competitive analysis reveals a market gap

### 1.3 Why Now

Market conditions and user feedback have reached a tipping point.

### 1.4 Cost of Inaction

Without this feature we risk churn and miss ~$2M ARR.

## 2. Goals & Success Metrics

### Success Metrics

| Metric | Type | Baseline | Target | Measurement | Window |
|---|---|---|---|---|---|
| Feature adoption | Primary | 0% | 60% | Event: feature_opened | 90 days |
| Task completion | Secondary | 45% | 70% | Funnel analysis | 60 days |
| User satisfaction | Secondary | 3.2/5 | 4.2/5 | NPS survey | 60 days |
| Page load time | Guardrail | 2.1s | ≤2.5s | RUM | Ongoing |

## 3. Target Users

**Primary:** ${productCtx.targetUsers} — daily users needing efficient task completion.

## 4. User Journey

### Current State

| Step | Pain Point | Severity |
|---|---|---|
| Identify need | Unclear start point | High |
| Execute task | Manual, error-prone | High |
| Save/Share | Complex export | High |

### Future State

| Step | Improvement |
|---|---|
| Identify need | Clear entry point |
| Execute task | Automated, guided |
| Save/Share | One-click export |

## 5. Functional Requirements

**FR-001:** Clear entry point from main dashboard.
**FR-002:** Real-time input validation with immediate error display.
**FR-003:** Auto-save progress every 30 seconds.
**FR-004:** Progress indicator for multi-step processes.
**FR-005:** Export in PDF, CSV, and JSON formats.
**FR-006:** Full audit log of user actions.
**FR-007:** Keyboard shortcuts for common actions.
**FR-008:** Mobile-responsive design (≥320px).
**FR-009:** Touch targets minimum 44×44px.
**FR-010:** Empty and error state guidance.

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | P95 load < 2s, API P99 < 500ms |
| Security | Encrypted at rest & in transit, GDPR compliant |
| Accessibility | WCAG 2.1 AA, keyboard nav, screen reader |
| Reliability | 99.9% uptime SLA |

## 7. Scope

**In scope:** Core feature, export, mobile, analytics, docs.
**Out of scope:** Advanced analytics (Phase 2), API access (Phase 2), SSO (Phase 3).

## 8. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Performance degradation | Medium | High | Load testing, caching |
| 2 | Low adoption | Medium | High | Beta program, onboarding |
| 3 | Data privacy | Low | High | Legal review, compliance |

## 9. Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Exact pricing model? | Product | 1 week |
| 2 | Admin controls needed? | Product | 3 days |
| 3 | Compliance requirements? | Legal | 1 week |

## 10. Launch Plan

- Phase 1 — Internal: 1 week basic functionality
- Phase 2 — Closed beta: 50 customers, 2 weeks
- Phase 3 — Phased rollout: 10% → 50% → 100%
- Feature flag: \`enable_new_feature\` (kill-switch: error > 5%)
`;
}

// ---------- Public API ----------

export async function generatePRD(
  productCtx: ProductContext,
  idea: string,
  onStream?: (accumulated: string) => void,
  authorName?: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  const author = authorName || 'Product Manager';
  const system = `You are a principal product manager at a top-tier tech company. Write an exhaustive, production-quality PRD in markdown.

STRICT REQUIREMENTS:
- Minimum 2000 words of substance — no padding, just depth
- Every section must be fully written out, not placeholder text
- Use the exact target users provided; create named user personas with goals and pain points
- All markdown tables must have real data rows (not "TBD" cells)
- Functional requirements: use FR-001 format, include acceptance criteria for each
- Metrics: specify baseline, target, measurement tool, and time window for every row
- Risks: include Likelihood (Low/Med/High), Impact (Low/Med/High), and concrete mitigation steps
- Launch plan: named phases with entry/exit criteria, not just bullet points
- DO NOT add any "Prepared by", "Written by", "Author:", signature block, or closing byline anywhere in the document
- The Author field in the metadata table must be exactly: ${author}

REQUIRED SECTIONS (in this order):
1. # [ProductName] — [FeatureName] PRD  (with a metadata table: Status, Priority, Author: ${author}, Created, Last Updated)
2. ## Executive Summary  (3–4 paragraphs: what, why now, expected outcomes, strategic fit)
3. ## 1. Problem Statement  (1.1 Core Problem, 1.2 Evidence & Data, 1.3 Why Now, 1.4 Cost of Inaction)
4. ## 2. Goals & Success Metrics  (table + guardrail metrics)
5. ## 3. Target Users  (2–3 detailed personas with Name, Role, Goals, Pain Points, Tech comfort)
6. ## 4. User Journey  (Current State journey table + Future State journey table, with pain points per step)
7. ## 5. Functional Requirements  (FR-001 through FR-015+, each with Description and Acceptance Criteria)
8. ## 6. Non-Functional Requirements  (Performance, Security, Accessibility, Reliability, Scalability)
9. ## 7. Scope  (In Scope list, Out of Scope list, Future Phases table)
10. ## 8. Risks & Mitigations  (table with #, Risk, Likelihood, Impact, Mitigation, Owner)
11. ## 9. Open Questions  (table with #, Question, Owner, Due Date, Status)
12. ## 10. Launch Plan  (Phase table with Phase, Scope, Success Criteria, Timeline, Owner)

Write every section completely. Do not truncate or summarize any section. End after section 10 — no closing remarks, signatures, or bylines.`;

  const user =
    `Generate a complete, detailed PRD for this feature.\n\nPRODUCT CONTEXT\n${buildProductContextBlock(productCtx)}\n\n` +
    `FEATURE IDEA\n${idea || '(not provided)'}`;

  try {
    let text: string;
    if (onStream && hasOpenRouterKey()) {
      text = await streamAI([{ role: 'user', content: user }], system, 0.65, onStream);
    } else {
      text = await callAI([{ role: 'user', content: user }], system, 0.65);
    }
    console.info('[AI] PRD generated successfully via OpenRouter');
    return { success: true, text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    console.error('[AI] PRD generation failed:', msg);

    if (msg === 'no-api-key') {
      await delay(4000);
      return {
        success: true,
        text: mockPRD(productCtx, idea),
        error: 'No API key set. Add VITE_OPENROUTER_API_KEY to .env and restart the dev server.'
      };
    }

    await delay(300);
    const isAuthError = msg.includes('Authentication failed') || msg.includes('API key') || msg.includes('401') || msg.includes('403');
    return {
      success: true,
      text: mockPRD(productCtx, idea),
      error: isAuthError
        ? `API key rejected — check VITE_OPENROUTER_API_KEY in .env and restart the dev server.`
        : `AI generation failed: ${msg}. Showing template PRD instead.`
    };
  }
}

export async function refinePRD(
  currentPrd: string,
  request: string,
  productCtx: ProductContext,
  onStream?: (text: string) => void
): Promise<{ success: boolean; text?: string; changes?: string; error?: string }> {
  const system = `You are a principal product manager refining a PRD based on user feedback.

RULES:
- Return the COMPLETE updated PRD in markdown — do not truncate or omit any section
- When updating a section: rewrite it FULLY and IN DETAIL. Expand, don't just patch. Add depth, specifics, and examples
- When asked to improve metrics: add baselines, targets, measurement tools, and time windows
- When asked to add requirements: add at least 3–5 new numbered FRs with acceptance criteria
- When asked to improve a section: make it at least 50% longer with new substantive content
- Preserve sections not touched by the request (but still include them fully)
- After the PRD, add a separator line containing only: ---CHANGES---
- After the separator, list every section you changed and exactly what was added or expanded (bullet list)`;

  const user =
    `PRODUCT CONTEXT\n${buildProductContextBlock(productCtx)}\n\nCURRENT PRD\n${currentPrd}\n\nUSER REQUEST\n${request}`;

  try {
    let raw: string;
    if (onStream && hasOpenRouterKey()) {
      raw = await streamAI([{ role: 'user', content: user }], system, 0.5, (accumulated) => {
        const splitIdx = accumulated.indexOf('---CHANGES---');
        onStream(splitIdx >= 0 ? accumulated.slice(0, splitIdx).trim() : accumulated);
      });
    } else {
      raw = await callAI([{ role: 'user', content: user }], system, 0.5);
    }
    const splitIdx = raw.indexOf('---CHANGES---');
    const text = splitIdx >= 0 ? raw.slice(0, splitIdx).trim() : raw;
    const changes =
      splitIdx >= 0 ? raw.slice(splitIdx + '---CHANGES---'.length).trim() : 'Refined based on your request.';
    return { success: true, text, changes };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    console.error('[AI] Refinement failed:', msg);

    if (msg === 'no-api-key') {
      await delay(2000);
      return mockRefinePRD(currentPrd, request);
    }
    await delay(500);
    const mock = mockRefinePRD(currentPrd, request);
    return { ...mock, error: `AI refinement failed: ${msg}. Showing simulated changes.` };
  }
}

function mockRefinePRD(
  currentPrd: string,
  request: string
): { success: boolean; text: string; changes: string } {
  let updatedPrd = currentPrd;
  let changes = 'Enhanced based on your request.';

  if (request.toLowerCase().includes('mobile')) {
    updatedPrd = updatedPrd.replace(
      '**FR-008:**',
      `**FR-M001:** Fully responsive down to 320px width.\n**FR-M002:** Touch targets ≥ 44×44px.\n**FR-M003:** Swipe/pinch gestures supported.\n**FR-008:**`
    );
    changes = 'Added mobile-specific functional requirements.';
  } else if (request.toLowerCase().includes('metric') || request.toLowerCase().includes('measurable')) {
    updatedPrd = updatedPrd.replace(
      '| Feature adoption | Primary | 0% | 60% | Event: feature_opened | 90 days |',
      '| Feature adoption | Primary | 0% | 60% | Event: feature_opened (tracked via Segment) | 90 days |'
    );
    changes = 'Made metrics more specific with tracking implementation details.';
  } else if (request.toLowerCase().includes('risk')) {
    updatedPrd = updatedPrd.replace(
      '| 3 | Data privacy | Low | High | Legal review, compliance |',
      '| 3 | Data privacy | Low | High | Legal review, compliance |\n| 4 | Security vulnerability | Low | Critical | Pen testing, security audit |'
    );
    changes = 'Added security vulnerability risk with mitigation strategy.';
  } else {
    updatedPrd = updatedPrd.replace(
      '## Executive Summary',
      `## Executive Summary\n\n> **Updated:** This PRD incorporates feedback from the refinement request.\n`
    );
    changes = 'Enhanced executive summary to reflect latest feedback.';
  }

  // Bump version
  const vMatch = updatedPrd.match(/Draft v(\d+\.\d+)/);
  if (vMatch) {
    const v = (parseFloat(vMatch[1]) + 0.1).toFixed(1);
    updatedPrd = updatedPrd.replace(`Draft v${vMatch[1]}`, `Draft v${v}`);
  }

  return { success: true, text: updatedPrd, changes };
}

export async function checkCompleteness(
  prd: string
): Promise<{ success: boolean; result?: CompletenessResult; error?: string }> {
  const system =
    'Audit this PRD for completeness. Output ONLY valid JSON:\n' +
    '{"score":number,"verdict":"READY"|"NOT_READY","summary":string,"sections":[{"name":string,"score":number,"status":"strong"|"needs_work"|"weak","issue":string}],"blockers":string[],"suggestions":string[]}\n' +
    'No prose outside JSON. Sections: Executive Summary, Problem Statement, Goals & Metrics, Target Users, User Journey, Functional Requirements, Non-Functional Requirements, Scope, Risks, Open Questions, Launch Plan.';

  try {
    const raw = await callAI([{ role: 'user', content: `Audit this PRD:\n${prd}` }], system, 0.2);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const parsed = JSON.parse(match[0]) as CompletenessResult;
    if (typeof parsed.score !== 'number' || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid response shape');
    }
    parsed.verdict = parsed.score >= 75 ? 'READY' : 'NOT_READY';
    parsed.blockers = Array.isArray(parsed.blockers) ? parsed.blockers : [];
    parsed.suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    return { success: true, result: parsed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'no-api-key') {
      await delay(3000);
      return { success: true, result: mockCompletenessResult() };
    }
    // Parsing/API error — fall back to mock so UI doesn't break
    return { success: true, result: mockCompletenessResult(), error: `AI analysis failed (${msg}). Showing estimated scores.` };
  }
}

function mockCompletenessResult(): CompletenessResult {
  const result: CompletenessResult = {
    ...DEFAULT_COMPLETENESS_RESULT,
    score: Math.floor(Math.random() * 20) + 70,
    sections: DEFAULT_COMPLETENESS_RESULT.sections.map((s) => ({
      ...s,
      score: Math.floor(Math.random() * 30) + 60
    }))
  };
  result.verdict = result.score >= 75 ? 'READY' : 'NOT_READY';
  if (result.verdict === 'NOT_READY') {
    result.blockers = ['Score below threshold — please refine the PRD further'];
  }
  return result;
}

export async function generatePersonaMessage(
  persona: Persona,
  productCtx: ProductContext,
  currentPrd: string,
  conversation: { role: string; content: string }[],
  isOpening = false,
  onStream?: (text: string) => void
): Promise<{
  success: boolean;
  text?: string;
  approved?: boolean;
  needsMore?: boolean;
  update?: { section: string; content: string };
  error?: string;
}> {
  const system =
    `You are ${persona.name}, ${persona.role}. Focus: ${persona.focus}.\n` +
    `Speak first-person, direct, professional. Reference specific PRD sections/metrics by name.\n` +
    `Acknowledge the user's last point briefly, then ask at most 1 targeted follow-up. 2-3 sentences total.\n` +
    `After 3-5 exchanges when satisfied, end with [APPROVED]. To propose an edit append [PRD_UPDATE: Section | content].\n` +
    `Stay in character. Never output raw JSON.`;

  // Trim PRD context harder for persona turns to speed up responses.
  const prdContent = currentPrd.length > 3500
    ? currentPrd.slice(0, 2500) + '\n\n[... middle ...]\n\n' + currentPrd.slice(-1000)
    : currentPrd;

  const context =
    `COMPANY & PRODUCT CONTEXT\n${buildProductContextBlock(productCtx)}\n\n` +
    `FULL PRD (review carefully before asking questions)\n${prdContent}`;

  try {
    const msgs: { role: 'user' | 'assistant'; content: string }[] = [];

    if (isOpening || conversation.length === 0) {
      msgs.push({
        role: 'user',
        content: `${context}\n\nGreet the team briefly (1 sentence), then cite 2 specific concerns or questions about this PRD from your perspective as ${persona.role}. Reference actual section names, metrics, requirements, or user personas from the PRD — do not ask generic questions.`
      });
    } else {
      msgs.push({ role: 'user', content: context });
      msgs.push({ role: 'assistant', content: 'Ready to continue the review.' });
      for (const m of conversation) {
        if (m.role === 'user' || m.role === 'assistant') {
          msgs.push({ role: m.role as 'user' | 'assistant', content: m.content });
        }
      }
    }

    const PERSONA_MAX_TOKENS = 700;
    let text: string;
    if (onStream && hasOpenRouterKey()) {
      text = await streamAI(msgs, system, 0.75, onStream, PERSONA_MAX_TOKENS);
    } else {
      text = await callAI(msgs, system, 0.75, PERSONA_MAX_TOKENS);
    }
    return { success: true, text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'no-api-key') {
      await delay(1500);
      return mockPersonaMessage(persona, conversation, isOpening);
    }
    await delay(400);
    return mockPersonaMessage(persona, conversation, isOpening);
  }
}

function mockPersonaMessage(
  persona: Persona,
  conversation: { role: string; content: string }[],
  isOpening: boolean
): { success: boolean; text: string; approved?: boolean; update?: { section: string; content: string } } {
  if (isOpening) {
    const openings: Record<string, string> = {
      eng: `Hi, I'm ${persona.name} — Engineering Lead. I've reviewed the technical aspects. My main concern is the P99 < 500ms target. Can you walk me through the architecture and caching strategy?`,
      design: `Hello! ${persona.name} here. The user flow looks solid, but I'm missing details on empty states and error handling. What happens when a user first encounters this with no data?`,
      data: `Hi, ${persona.name} from Analytics. "Event tracking" in the metrics section isn't specific enough — which exact events, and do we have baseline data?`,
      legal: `${persona.name}, Legal. What user data are we collecting and how long do we retain audit logs? I need this for GDPR compliance.`,
      cs: `Hey! ${persona.name} from CS. My concern is support burden. How are we preparing the team and what's the migration plan for existing users?`,
      sales: `${persona.name}, Sales. Is this available to all tiers or just enterprise? We have customers asking — can we commit to the timeline?`,
      mkt: `Hi! ${persona.name}, Marketing. The positioning isn't differentiated enough. How do we stand out vs. ${['Salesforce', 'HubSpot', 'Notion'][Math.floor(Math.random() * 3)]}?`,
      cpo: `${persona.name}, CPO. I'm concerned about scope creep. How do we protect Phase 1 from the Phase 2 items bleeding in?`,
      ceo: `CEO here. I like the direction, but what are we NOT building to prioritize this? What's our competitive moat?`
    };
    return {
      success: true,
      text: openings[persona.id] || `Hello, I'm ${persona.name}. Let me review this PRD carefully.`
    };
  }

  const userCount = conversation.filter((m) => m.role === 'user').length;

  if (userCount >= 3) {
    const approvals: Record<string, string> = {
      eng: `Good clarification on performance. The caching strategy makes sense. [APPROVED] Engineering is ready to start the technical spike.`,
      design: `The empty state and error handling plan addresses all my concerns. [APPROVED] UX is ready — let's schedule a usability test for beta.`,
      data: `Those specific event names and baselines give me confidence. [APPROVED] Analytics will instrument this before launch.`,
      legal: `Data handling is now clear. [APPROVED] Legal is satisfied — update the privacy policy before launch.`,
      cs: `The training plan and migration strategy look solid. [APPROVED] CS is ready to support this.`,
      sales: `Pricing clarity and timeline commitment work for us. [APPROVED] We'll update the sales deck.`,
      mkt: `Positioning and differentiation are clear. [APPROVED] Marketing will start the launch brief.`,
      cpo: `Scope guardrails and success criteria are well-defined. [APPROVED] Product is aligned — let's ship.`,
      ceo: `Strategic fit is clear. [APPROVED] Proceed. We'll review results at the 30-day mark.`
    };
    return {
      success: true,
      text: approvals[persona.id] || `[APPROVED] ${persona.name} approves this PRD.`,
      approved: true
    };
  }

  const followUps: Record<string, string[]> = {
    eng: ['What\'s the database query plan for this feature?', 'How does this interact with the existing auth service?', 'Do we have a rollback plan if error rate spikes?'],
    design: ['Have we validated this flow with users?', 'What about dark mode support?', 'How do loading states behave on 3G?'],
    data: ['Is the data pipeline ready for these events?', 'What\'s our statistical significance target?', 'How do we isolate this feature\'s impact from other changes?'],
    legal: ['Where is data stored geographically?', 'Do we need explicit user consent?', 'What\'s the retention period for logs?'],
    cs: ['How many support tickets do we expect in week 1?', 'Is there in-app guidance for first-time users?', 'What\'s the escalation path for technical issues?'],
    sales: ['Can we offer this as a standalone add-on?', 'Which enterprise customers have requested this specifically?', 'What\'s the competitive pricing benchmark?'],
    mkt: ['What\'s the exact launch date?', 'Which channels are we using for the announcement?', 'Do we have customer quotes ready?'],
    cpo: ['How does this move our north star metric?', 'What are we deprioritizing for this?', 'What\'s our post-launch learning plan?'],
    ceo: ['What\'s the 12-month revenue impact?', 'How defensible is this feature?', 'What\'s our exit criteria if it underperforms?']
  };

  const options = followUps[persona.id] || ['Can you provide more details on this?'];
  const text = options[userCount % options.length];

  if (userCount === 2 && Math.random() > 0.5) {
    return {
      success: true,
      text: `${text}\n\n[PRD_UPDATE: Functional Requirements | **FR-NEW:** The system SHALL support a feature flag for gradual rollout per user segment.]`,
      update: { section: 'Functional Requirements', content: '**FR-NEW:** Feature flag for gradual rollout.' }
    };
  }

  return { success: true, text };
}

// Fire off multiple persona turns in parallel (e.g. pre-warming opening messages
// for all reviewers). Each persona's stream callback fires independently.
export async function generatePersonaMessagesBatch(
  personas: Persona[],
  productCtx: ProductContext,
  currentPrd: string,
  conversationsByPersona: Record<string, { role: string; content: string }[]>,
  isOpening = false,
  onStreamPersona?: (personaId: string, accumulated: string) => void
): Promise<Record<string, { success: boolean; text?: string; error?: string }>> {
  const entries = await Promise.all(
    personas.map(async (p) => {
      const result = await generatePersonaMessage(
        p,
        productCtx,
        currentPrd,
        conversationsByPersona[p.id] || [],
        isOpening,
        onStreamPersona ? (acc) => onStreamPersona(p.id, acc) : undefined
      );
      return [p.id, result] as const;
    })
  );
  return Object.fromEntries(entries);
}

// Parse AI response for special tags
export function parseAIResponse(text: string): {
  cleanText: string;
  approved: boolean;
  needsMore: boolean;
  updates: { section: string; content: string }[];
} {
  const result = { cleanText: text, approved: false, needsMore: false, updates: [] as { section: string; content: string }[] };

  if (text.includes('[APPROVED]')) {
    result.approved = true;
    result.cleanText = result.cleanText.replace(/\[APPROVED\]/g, '').trim();
  }
  if (text.includes('[NEEDS_MORE]')) {
    result.needsMore = true;
    result.cleanText = result.cleanText.replace(/\[NEEDS_MORE\]/g, '').trim();
  }

  const updateRegex = /\[PRD_UPDATE:\s*([^|]+)\|([^\]]+)\]/g;
  let match;
  while ((match = updateRegex.exec(text)) !== null) {
    result.updates.push({ section: match[1].trim(), content: match[2].trim() });
  }
  result.cleanText = result.cleanText.replace(updateRegex, '').trim();

  return result;
}

export interface CompanyProfile {
  industry: string;
  description: string;
  goals: string;
  targetMarket: string;
  businessModel: string;
  competitors: string[];
  size: string;
}

export async function generateCompanyContext(
  name: string,
  hint?: string
): Promise<{ success: boolean; profile?: CompanyProfile; error?: string }> {
  const systemPrompt = `You are a concise business analyst. Given a company name, infer a realistic company profile.
Return ONLY valid JSON — no markdown fences, no explanation.
JSON shape:
{
  "industry": "string (e.g. SaaS / B2B Software)",
  "description": "2-3 sentence description of what the company does",
  "goals": "key business goals as a short paragraph",
  "targetMarket": "who they sell to",
  "businessModel": "how they make money (e.g. SaaS subscription, freemium)",
  "competitors": ["Competitor A", "Competitor B", "Competitor C"],
  "size": "one of: 1-10 | 11-50 | 51-200 | 201-1000 | 1000+"
}`;

  const userMsg = hint
    ? `Company name: ${name}\nAdditional context: ${hint}`
    : `Company name: ${name}`;

  try {
    const raw = await callAI(
      [{ role: 'user', content: userMsg }],
      systemPrompt,
      0.5,
      600
    );

    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const profile = JSON.parse(cleaned) as CompanyProfile;
    if (!profile.industry || !profile.description) {
      throw new Error('Incomplete profile returned by AI');
    }
    if (!Array.isArray(profile.competitors)) profile.competitors = [];
    return { success: true, profile };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate company profile';
    return { success: false, error: msg };
  }
}
