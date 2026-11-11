// The tech stack graph on the About page. Editing these four structures is the only change needed
// to add, remove or regroup tools.

/** Areas, in legend order. */
export const groups = [
  { id: 'web', label: 'Web apps' },
  { id: 'agents', label: 'Agents' },
  { id: 'rag', label: 'Retrieval' },
  { id: 'llm', label: 'Models' },
  { id: 'evals', label: 'Evals and tracing' },
  { id: 'ml', label: 'Classical ML' },
];

/** Tools in each area, keyed by area id. */
export const tools: Record<string, string[]> = {
  web: ['FastAPI', 'Pydantic', 'Celery', 'Redis'],
  agents: ['LangGraph', 'LangChain', 'Mingraph'],
  rag: ['Qdrant'],
  llm: ['Ollama', 'Qwen3', 'Gemma 3'],
  evals: ['Ragas', 'DeepEval', 'Arize Phoenix'],
  ml: ['XGBoost', 'scikit-learn'],
};

/** Tools that hang off another tool instead of their area. */
export const parentOverride: Record<string, string> = { Qwen3: 'Ollama', 'Gemma 3': 'Ollama' };

/** Tools used together in real projects. Hidden until "Used together" is on. */
export const crossLinks: [string, string][] = [
  ['Celery', 'Redis'], ['FastAPI', 'Pydantic'], ['LangGraph', 'Qdrant'], ['LangGraph', 'Arize Phoenix'],
  ['Ragas', 'Qdrant'], ['DeepEval', 'LangGraph'], ['Mingraph', 'LangChain'], ['Ollama', 'LangGraph'], ['XGBoost', 'scikit-learn'],
];
