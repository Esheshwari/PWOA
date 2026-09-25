import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env';
import { DeterministicPriorityResult, TaskEvaluationInput } from './priorityService';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const key = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey: key });
  }
  return genAIClient;
}

export interface AIPriorityOutput {
  priority_label: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  deadline_risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommended_action: string;
  key_factors: string[];
  combined_score: number;
  model_used: string;
  fallback: boolean;
}

export async function generateAITaskPriority(
  task: TaskEvaluationInput,
  deterministic: DeterministicPriorityResult
): Promise<AIPriorityOutput> {
  const ai = getGenAI();

  // If no API key is set, use deterministic baseline reasoning
  if (!ai) {
    return createFallbackOutput(task, deterministic, 'Deterministic Engine (GEMINI_API_KEY not configured)');
  }

  const prompt = `You are the AI Work Management & Task Prioritization Engine for PWOA.
Analyze the following task and its deterministic priority signals, then provide a structured synthesis.

TASK DETAILS:
- Title: ${task.title}
- Description: ${task.description || 'No description provided'}
- Status: ${task.status}
- Category: ${task.category}
- Deadline: ${task.deadline ? new Date(task.deadline).toISOString() : 'None'}
- Self-Assigned Importance: ${task.importance}
- Estimated Effort: ${task.estimated_effort} minutes
- Project Name: ${task.project_name || 'General Project'}
- Project Importance: ${task.project_importance || 'MEDIUM'}
- Downstream Tasks Blocked By This: ${task.blocked_downstream_count || 0}
- Upstream Unresolved Prerequisites: ${task.unresolved_dependencies_count || 0}

DETERMINISTIC ANALYSIS SIGNALS:
- Deterministic Score: ${deterministic.deterministic_score}/100
- Deadline Urgency Score: ${deterministic.signals.deadline_urgency}/100
- Hours Until Deadline: ${deterministic.signals.hours_to_deadline ?? 'No deadline'} (Overdue: ${deterministic.signals.is_overdue})
- Task Importance Score: ${deterministic.signals.task_importance}/100
- Dependency Impact Score: ${deterministic.signals.dependency_impact}/100
- Effort Efficiency Score: ${deterministic.signals.effort_efficiency}/100
- Project Importance Score: ${deterministic.signals.project_importance}/100
- Preliminary Classification: ${deterministic.preliminary_priority_label}
- Baseline Risk Assessment: ${deterministic.deadline_risk}

INSTRUCTIONS:
1. Provide a concise, high-impact reasoning explanation (1-2 sentences) grounded in the facts above.
2. If the task is blocked by incomplete prerequisites, highlight the blocker in recommended_action.
3. If this task blocks other critical tasks, highlight that it is a critical path item.
4. If it is a quick win (<60m) with high importance, recommend knocking it out quickly.
5. Provide 3 specific key factors justifying this prioritization.
6. The priority_label MUST be one of: "CRITICAL", "HIGH", "MEDIUM", "LOW".
7. The deadline_risk MUST be one of: "CRITICAL", "HIGH", "MEDIUM", "LOW".

Return ONLY a valid JSON object matching this schema:
{
  "priority_label": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "Short explanation",
  "deadline_risk": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "recommended_action": "Clear actionable recommendation for the engineer",
  "key_factors": ["Factor 1", "Factor 2", "Factor 3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    // Validate fields strictly
    const validLabels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const priorityLabel = validLabels.includes(parsed.priority_label)
      ? parsed.priority_label
      : deterministic.preliminary_priority_label;

    const deadlineRisk = validLabels.includes(parsed.deadline_risk)
      ? parsed.deadline_risk
      : deterministic.deadline_risk;

    const reasoning = typeof parsed.reasoning === 'string' && parsed.reasoning.trim().length > 0
      ? parsed.reasoning.trim()
      : deterministic.deterministic_reasoning;

    const recommendedAction = typeof parsed.recommended_action === 'string' && parsed.recommended_action.trim().length > 0
      ? parsed.recommended_action.trim()
      : getFallbackAction(task, deterministic);

    const keyFactors = Array.isArray(parsed.key_factors) && parsed.key_factors.length > 0
      ? parsed.key_factors.map((f: any) => String(f).trim()).filter(Boolean).slice(0, 4)
      : buildDefaultFactors(task, deterministic);

    // Final combined score: Blend deterministic score (80%) + AI alignment (20%)
    const labelScoreMap: Record<string, number> = { CRITICAL: 95, HIGH: 75, MEDIUM: 50, LOW: 25 };
    const aiScoreComponent = labelScoreMap[priorityLabel] ?? 50;
    const combinedScore = Math.round((deterministic.deterministic_score * 0.8 + aiScoreComponent * 0.2) * 10) / 10;

    return {
      priority_label: priorityLabel as any,
      reasoning,
      deadline_risk: deadlineRisk as any,
      recommended_action: recommendedAction,
      key_factors: keyFactors,
      combined_score: combinedScore,
      model_used: config.geminiModel,
      fallback: false,
    };
  } catch (err) {
    console.error('Gemini API call failed or returned invalid JSON:', err);
    return createFallbackOutput(task, deterministic, 'Deterministic Fallback (API error handled safely)');
  }
}

function getFallbackAction(task: TaskEvaluationInput, deterministic: DeterministicPriorityResult): string {
  if (deterministic.signals.is_blocked) {
    return 'Unblock prerequisites before starting development to prevent stalled progress.';
  }
  if (deterministic.signals.is_overdue) {
    return 'Immediate escalation required: task has crossed its deadline.';
  }
  if (deterministic.signals.blocks_count > 0) {
    return `Prioritize immediately: unblocks ${deterministic.signals.blocks_count} downstream deliverable(s).`;
  }
  if (task.estimated_effort <= 60 && deterministic.preliminary_priority_label !== 'LOW') {
    return 'Execute immediately as a high-velocity quick win.';
  }
  if (deterministic.preliminary_priority_label === 'CRITICAL' || deterministic.preliminary_priority_label === 'HIGH') {
    return 'Schedule for current sprint focus batch.';
  }
  return 'Queue in backlog for scheduled backlog grooming.';
}

function buildDefaultFactors(task: TaskEvaluationInput, deterministic: DeterministicPriorityResult): string[] {
  const factors: string[] = [];
  if (deterministic.signals.is_overdue) {
    factors.push('Past deadline requires immediate resolution');
  } else if (deterministic.signals.hours_to_deadline !== null && deterministic.signals.hours_to_deadline <= 48) {
    factors.push(`Approaching tight deadline within ${deterministic.signals.hours_to_deadline}h`);
  }

  if (task.importance === 'CRITICAL' || task.importance === 'HIGH') {
    factors.push(`High business impact item (${task.importance})`);
  }

  if ((task.blocked_downstream_count || 0) > 0) {
    factors.push(`Blocks ${task.blocked_downstream_count} dependent task(s) on critical path`);
  }

  if (task.estimated_effort <= 60) {
    factors.push(`Low effort overhead (${task.estimated_effort}m) delivers immediate progress`);
  }

  if (factors.length < 3) {
    factors.push(`Categorized under ${task.category} workstream`);
  }

  return factors.slice(0, 3);
}

function createFallbackOutput(
  task: TaskEvaluationInput,
  deterministic: DeterministicPriorityResult,
  modelName: string
): AIPriorityOutput {
  return {
    priority_label: deterministic.preliminary_priority_label,
    reasoning: deterministic.deterministic_reasoning,
    deadline_risk: deterministic.deadline_risk,
    recommended_action: getFallbackAction(task, deterministic),
    key_factors: buildDefaultFactors(task, deterministic),
    combined_score: deterministic.deterministic_score,
    model_used: modelName,
    fallback: true,
  };
}

export interface AssistantContext {
  tasks: any[];
  projects: any[];
  userQuery: string;
}

export async function askAIAssistant(context: AssistantContext): Promise<string> {
  const ai = getGenAI();

  const taskSummary = context.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.ai_priority_label || t.importance,
    score: t.ai_priority_score,
    deadline: t.deadline,
    effort_min: t.estimated_effort,
    category: t.category,
    project: t.project_name,
    blocked_by: t.dependencies?.map((d: any) => d.title) || [],
    blocks: t.blocked_tasks?.map((b: any) => b.title) || [],
  }));

  const systemPrompt = `You are PWOA's Lead AI Productivity & Prioritization Assistant.
You have access to the user's REAL live projects and tasks data below.
Always ground your answers in the user's actual tasks, deadlines, effort estimates, and blockers.
Do NOT give generic answers or hallucinate task names not in the data.

USER TASKS DATA (${taskSummary.length} total tasks):
${JSON.stringify(taskSummary, null, 2)}

PROJECTS DATA:
${JSON.stringify(context.projects, null, 2)}

GUIDELINES:
1. Answer the user's specific request directly and concisely with clear bullet points.
2. If asked "What should I work on today?", pick the top 2-3 actionable unblocked items with highest urgency/priority, noting their estimated time.
3. If asked about time constraints (e.g. "I have 2 hours"), find tasks whose estimated effort fits in that window and maximizes value.
4. If asked about risks or blockers, highlight tasks that are BLOCKED or blocking others, or overdue.
5. Format your response cleanly using Markdown with bold headers and bullet points.`;

  if (!ai) {
    // Generate intelligent structured response from the real task data
    return generateLocalAssistantResponse(context.userQuery, context.tasks);
  }

  try {
    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + `\n\nUSER QUESTION: "${context.userQuery}"` }] },
      ],
      config: {
        temperature: 0.3,
      },
    });

    return response.text || generateLocalAssistantResponse(context.userQuery, context.tasks);
  } catch (err) {
    console.error('AI assistant query failed:', err);
    return generateLocalAssistantResponse(context.userQuery, context.tasks);
  }
}

function generateLocalAssistantResponse(query: string, tasks: any[]): string {
  const q = query.toLowerCase();
  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const overdueTasks = activeTasks.filter(
    (t) => t.deadline && new Date(t.deadline).getTime() < Date.now()
  );
  const criticalTasks = activeTasks.filter(
    (t) => t.ai_priority_label === 'CRITICAL' || t.importance === 'CRITICAL'
  );

  if (q.includes('2 hour') || q.includes('two hour') || q.includes('quick') || q.includes('time')) {
    const quickWins = activeTasks
      .filter((t) => (t.estimated_effort || 60) <= 120 && t.status !== 'BLOCKED')
      .sort((a, b) => (b.ai_priority_score || 0) - (a.ai_priority_score || 0))
      .slice(0, 3);

    if (quickWins.length === 0) {
      return `### Recommended Quick Wins\nAll current tasks exceed 2 hours. Consider breaking down larger initiatives into 30-60 minute chunks.`;
    }

    return `### Recommended for a 2-Hour Focus Window:
Here are high-impact tasks that fit into your 2-hour window:
${quickWins
  .map(
    (t) =>
      `* **${t.title}** (~${t.estimated_effort}m) — *${t.ai_priority_label || t.importance}* priority. ${
        t.ai_recommended_action || 'Execute now.'
      }`
  )
  .join('\n')}`;
  }

  if (q.includes('risk') || q.includes('deadline') || q.includes('overdue')) {
    return `### Critical Risk & Deadline Overview
* **Overdue Tasks (${overdueTasks.length}):** ${
      overdueTasks.length > 0
        ? overdueTasks.map((t) => `\n  - **${t.title}** (due ${new Date(t.deadline).toLocaleDateString()})`).join('')
        : 'None! All active tasks are within deadline.'
    }
* **Critical Priority Deliverables (${criticalTasks.length}):**
${criticalTasks
  .slice(0, 3)
  .map((t) => `  - **${t.title}** [${t.status}] — Priority Score: ${t.ai_priority_score || 'N/A'}`)
  .join('\n')}`;
  }

  // Default "What should I do?"
  const topActionable = activeTasks
    .filter((t) => t.status !== 'BLOCKED')
    .sort((a, b) => (b.ai_priority_score || 0) - (a.ai_priority_score || 0))
    .slice(0, 3);

  return `### Recommended Action Plan Today:
Based on deterministic priority weights (deadline, importance, dependency blockers):

${topActionable
  .map(
    (t, idx) =>
      `${idx + 1}. **${t.title}** (${t.estimated_effort || 60}m)
   - **Priority:** ${t.ai_priority_label || t.importance} (Score: ${t.ai_priority_score ?? 'Calculated'})
   - **Recommended Action:** ${t.ai_recommended_action || 'Focus sprint priority.'}
   - **Project:** ${t.project_name || 'General'}`
  )
  .join('\n\n')}

*Total focus time needed for top 3: ${topActionable.reduce(
    (acc, t) => acc + (t.estimated_effort || 60),
    0
  )} minutes.*`;
}
