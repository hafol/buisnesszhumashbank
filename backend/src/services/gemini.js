const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

async function safeGenerateContent(prompt) {
  try {
    return await model.generateContent(prompt);
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('429 Too Many Requests') || msg.includes('quota')) {
      throw new Error('ИИ-советник временно перегружен из-за превышения квоты API (Too Many Requests). Пожалуйста, подождите 1-2 минуты и повторите попытку.');
    } else if (msg.includes('503 Service Unavailable') || msg.includes('overloaded')) {
      throw new Error('Сервисы ИИ в данный момент недоступны или перегружены. Повторите попытку позже.');
    }
    throw err;
  }
}

/**
 * Robustly extracts JSON from a string that might contain Markdown code blocks or other text.
 */
function extractJson(text) {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonMatch) return jsonMatch[1].trim();
  const blockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (blockMatch) return blockMatch[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.substring(start, end + 1);
  return text.trim();
}

/**
 * Analyzes a legal contract text
 */
async function analyzeContract(contractText) {
  const prompt = `Ты — профессиональный юридический консультант (AI Lawyer), эксперт по гражданскому и хозяйственному праву Республики Казахстан.
Проанализируй договор и предоставь ответ СТРОГО в JSON формате.

Фокусируйся на:
1. Соответствии Гражданскому кодексу РК.
2. Скрытых финансовых рисках (пени, штрафы, условия расторжения).
3. Важных сроках исполнения обязательств.
4. Налоговых последствиях для сторон (НДС, КПН/ИПН).

Структура ответа (на языке договора):
{
  "summary": "краткое резюме (2-3 предложения)",
  "keyTerms": ["пункт 1", "пункт 2", "..."],
  "obligations": ["обязательство 1", "обязательство 2", "..."],
  "risks": ["риск 1 - описание и почему это опасно", "риск 2", "..."],
  "deadlines": [
    {"description": "описание события", "date": "дата или условие"}
  ],
  "legalAdvice": "Профессиональная рекомендация по минимизации рисков"
}

Текст договора:
${contractText}

Отвечай ТОЛЬКО JSON.`;

  const result = await safeGenerateContent(prompt);
  const text = result.response.text().trim();
  return JSON.parse(extractJson(text));
}

/**
 * Calculates Kazakhstan taxes
 */
async function calculateTaxes({ userType, businessType, taxRegime, income, period, employeeCount, currentDate }) {
  const prompt = `Ты — Старший Налоговый Консультант и Главный Бухгалтер Республики Казахстан с 20-летним стажем. 
Твоя база знаний включает в себя все изменения Налогового Кодекса РК на ${currentDate || '2025 год'}.

ТЕКУЩАЯ ДАТА: ${currentDate || new Date().toISOString().split('T')[0]}

Данные для расчета:
- Тип субъекта: ${userType === 'individual' ? 'Физическое лицо' : 'Бизнес (' + businessType + ')'}
- Налоговый режим: ${taxRegime}
- Доход за период: ${income} тенге
- Период: ${period}
- Сотрудники: ${employeeCount || 0}

Твоя задача: 
1. Рассчитать налоги максимально точно согласно последним изменениям НК РК.
2. Для физлиц учесть: ИПН (10%), возможные вычеты (1 МЗП/14 МРП), взносы ВОСMS (2%).
3. Для ИП на упрощенке: 3% налог (ИПН+Соцналог), ОПВ, СО, ВОСМС за себя.
4. Дать конкретный план оплаты с КБК и сроками.
5. Пиши "name", "description", "expertAdvice", "instructions" на языке запроса (если данные пришли на казахском или пользователь ранее общался на казахском — отвечай на казахском). По молчанию используй русский.

Верни ответ СТРОГО в JSON:
{
  "period": "${period}",
  "totalIncome": ${income},
  "taxRate": число_процентов,
  "taxAmount": сумма_ИПН_или_КПН,
  "socialTax": сумма_соц_налога,
  "pensionContribution": сумма_ОПВ,
  "medicalInsurance": сумма_ОСМС,
  "totalPayable": итого_к_уплате,
  "taxBreakdown": [
    {"name": "Название", "amount": сумма, "description": "детальное обоснование со ссылкой на статью НК РК"}
  ],
  "declarations": [
    {"formNumber": "номер", "name": "название", "deadline": "дата", "whereToFile": "ссылка"}
  ],
  "paymentDetails": {
    "recipient": "название УГД",
    "bankName": "Национальный Банк РК",
    "iik": "KZ...",
    "bin": "000...",
    "kbe": "11",
    "knp": "911/101/...",
    "kbk": "конкретный КБК"
  },
  "expertAdvice": "Профессиональный совет по оптимизации или предупреждение о рисках",
  "instructions": ["шаг 1", "шаг 2", "..."]
}

Отвечай ТОЛЬКО JSON.`;

  const result = await safeGenerateContent(prompt);
  const text = result.response.text().trim();
  return JSON.parse(extractJson(text));
}

/**
 * Chat with a tax expert
 */
async function chatWithTaxExpert(userMessage, context) {
  const prompt = `Ты — Старший Налоговый Консультант РК. 
Контекст текущего пользователя:
- Тип: ${context.userType}
- Режим: ${context.regime}
- Последний расчет налогов: ${JSON.stringify(context.taxData || {})}

Вопрос пользователя: "${userMessage}"

ОПРЕДЕЛИ ЯЗЫК ВОПРОСА (русский, казахский или английский) И ОТВЕЧАЙ НА ТОМ ЖЕ ЯЗЫКЕ.
Используй правильную терминологию Налогового Кодекса РК для выбранного языка.

Ответь максимально конкретно, профессионально, ссылаясь на Налоговый Кодекс РК. 
Если вопрос не касается налогов Казахстана, вежливо вернись к теме налогов.
Используй форматирование (жирный шрифт) для важных сумм и дат. 
Коротко и по делу. Кодировка UTF-8.
`;

  const result = await safeGenerateContent(prompt);
  return result.response.text().trim();
}

/**
 * Parses a bank statement
 */
async function parseTransactions(statementText) {
  const prompt = `Ты финансовый аналитик. Распарси следующую банковскую выписку и извлеки ВСЕ операции.
Для каждой операции определи категорию:
- income (любые входящие переводы, оплата от клиентов)
- office (аренда, коммунальные услуги, интернет)
- payroll (зарплата, налоги с зп, пенсионные, соцотчисления)
- taxes (налоги бизнеса, НДС, ИПН)
- transfer (переводы между своими счетами)
- other (всё остальное)

Выписка:
${statementText}

Ответ СТРОГО в JSON:
{
  "transactions": [
    {
      "date": "ГГГГ-ММ-ДД",
      "counterparty": "имя контрагента или описание",
      "amount": число,
      "type": "income|office|payroll|taxes|transfer|other",
      "description": "оригинальное описание из выписки"
    }
  ],
  "totalIncoming": общая_сумма_входящих,
  "totalOutgoing": общая_сумма_исходящих
}

Отвечай ТОЛЬКО JSON.`;

  const result = await safeGenerateContent(prompt);
  const text = result.response.text().trim();
  const parsed = JSON.parse(extractJson(text));
  return parsed.transactions || [];
}

/**
 * General document analysis
 */
async function analyzeDocument(documentText) {
  const prompt = `Проанализируй этот документ и предоставь ответ в JSON:

{
  "summary": "краткое резюме документа",
  "documentType": "тип документа",
  "keyTerms": ["ключевой пункт 1", "ключевой пункт 2"],
  "obligations": ["обязательство 1", "обязательство 2"],
  "risks": ["риск 1"],
  "deadlines": [{"description": "...", "date": "..."}],
  "financialAmounts": ["сумма 1", "сумма 2"],
  "actionItems": ["действие 1", "действие 2"]
}

Документ:
${documentText}

Отвечай ТОЛЬКО JSON.`;

  const result = await safeGenerateContent(prompt);
  const text = result.response.text().trim();
  return JSON.parse(extractJson(text));
}

/**
 * Business advisor AI
 */
async function chatWithBusinessAdvisor({ businessName, businessType, businessDescription, transactions, chatHistory, userMessage, language = 'ru' }) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalIncome - totalExpense;

  const historyText = chatHistory.length > 0
    ? chatHistory.map(m => `${m.role === 'user' ? 'Клиент' : 'ИИ-советник'}: ${m.message}`).join('\n')
    : 'Это начало разговора.';

  const recentTx = transactions.slice(0, 10).map(t =>
    `${t.date}: ${t.type === 'income' ? '+' : '-'}₸${Number(t.amount).toLocaleString()} (${t.category}) — ${t.description}`
  ).join('\n') || 'Транзакций нет';

  const langName = language === 'kz' ? 'Kazakh' : language === 'en' ? 'English' : 'Russian';

  const prompt = `You are a personal business advisor and strategic growth expert in Kazakhstan.
Your goal is to provide specific, data-driven advice based on the business context and transactions provided.

BUSINESS DATA:
- Name: ${businessName}
- Type: ${businessType}
- Description: ${businessDescription || 'Not specified'}
- Total Income: ₸${totalIncome.toLocaleString()}
- Total Expense: ₸${totalExpense.toLocaleString()}
- Net Profit: ₸${profit.toLocaleString()}

RECENT TRANSACTIONS:
${recentTx}

CONVERSATION HISTORY:
${historyText}

CURRENT USER MESSAGE: "${userMessage}"

INSTRUCTIONS:
1. MANDATORY: Respond ONLY in ${langName}. 
2. If the chosen language is Kazakh (kz), DO NOT use Russian words.
3. Use the provided financial data to give concrete, practical scaling and growth advice.
4. Be structured, professional, and use emojis for readability.
5. If there are no transactions, ask the user to provide more details about their current operations first.
6. Acknowledge the context from the conversation history if relevant.
7. Keep it motivational yet realistic.
8. Do not exceed 300 words.`;

  const result = await safeGenerateContent(prompt);
  return result.response.text().trim();
}

/**
 * Forecasts taxes
 */
async function forecastTaxes({ income, taxRegime, businessType, nextQuarter, currentDate }) {
  const prompt = `Ты — старший налоговый консультант РК. На основе текущих данных составь прогноз налоговой нагрузки на ${nextQuarter}.

Входные данные:
- Текущий доход: ${income} тенге
- Налоговый режим: ${taxRegime}
- Тип бизнеса: ${businessType}
- Дата: ${currentDate}

Допущения для прогноза:
- Рост дохода на 10-15% (оптимистичный) и 5% (консервативный)
- Учти сезонные факторы

Ответ СТРОГО в JSON:
{
  "nextQuarter": "${nextQuarter}",
  "currentIncome": ${income},
  "conservativeIncome": number,
  "optimisticIncome": number,
  "conservativeTax": number,
  "optimisticTax": number,
  "taxBreakdown": [
    { "name": "название налога", "conservative": number, "optimistic": number, "description": "объяснение" }
  ],
  "totalConservative": number,
  "totalOptimistic": number,
  "recommendations": ["рекомендация 1", "рекомендация 2", "рекомендация 3"],
  "warnings": ["предупреждение если есть"],
  "tip": "главный совет на этот квартал"
}

Отвечай ТОЛЬКО JSON.`;

  const result = await safeGenerateContent(prompt);
  const text = result.response.text().trim();
  return JSON.parse(extractJson(text));
}

/**
 * Analyzes financial health
 */
async function analyzeFinancialHealth({ transactions, totalIncome, totalExpenses, businessCount, currentDate, language = 'ru' }) {
  const categoryMap = {};
  transactions.forEach(tx => {
    if (tx.type === 'expense') {
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + Number(tx.amount);
    }
  });
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => ({ category: cat, amount: amt }));

  const profit = totalIncome - totalExpenses;
  const margin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;

  const langMap = {
    'kz': 'Kazakh (Қазақ тілі)',
    'ru': 'Russian (Русский)',
    'en': 'English'
  };
  const targetLang = langMap[language] || langMap['ru'];

  const prompt = `[SYSTEM INSTRUCTION: RESPOND ENTIRELY IN ${targetLang.toUpperCase()}. DO NOT USE RUSSIAN.]

You are a professional financial advisor. Analyze the business financial health for ${currentDate}.

DATA:
- Businesses: ${businessCount}
- Total Income: ${totalIncome} KZT
- Total Expenses: ${totalExpenses} KZT
- Net Profit: ${profit} KZT
- Margin: ${margin}%
- Top Expense Categories: ${JSON.stringify(topCategories)}
- Total Transactions: ${transactions.length}

IMPORTANT: ALL TEXT FIELDS IN THE JSON MUST BE IN ${targetLang.toUpperCase()}. 
Even if the transaction data is in Russian, YOU MUST TRANSLATE EVERYTHING to ${targetLang}. 
NO RUSSIAN WORDS ALLOWED in "healthLabel", "summary", "insights", or "recommendations".

TASK:
1. Score financial health from 0-100.
2. BE DETERMINISTIC. If numbers don't change, healthScore must stay the same.
3. Provide specific recommendations in ${targetLang}.

STRICT JSON FORMAT:
{
  "healthScore": number,
  "healthLabel": "label in ${targetLang}",
  "healthColor": "emerald|blue|amber|orange|red",
  "summary": "2-3 sentences in ${targetLang}",
  "insights": [
    { "icon": "emoji", "title": "title in ${targetLang}", "text": "description in ${targetLang}", "type": "positive|neutral|warning|danger" }
  ],
  "topExpenses": ${JSON.stringify(topCategories)},
  "recommendations": ["rec 1 in ${targetLang}", "rec 2", "rec 3"],
  "monthlyTarget": number
}

Output ONLY valid JSON.`;

  const result = await safeGenerateContent(prompt);
  const text = result.response.text().trim();
  return JSON.parse(extractJson(text));
}

/**
 * Generates document content
 */
async function generateDocumentContent(promptText) {
  const prompt = `Ты — профессиональный помощник по подготовке юридических и финансовых документов в Казахстане. 
Твоя задача: создать структуру документа для библиотеки jsPDF на основе описания пользователя.

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ К СТРУКТУРЕ:
1. Использовать шрифт 'TimesNewRoman' (уже настроен в системе).
2. fontSize для основного текста: 11.
3. Должен быть заголовок (bold: true, alignment: 'center').
4. Профессиональный отступ (margins).
5. Если в описании есть суммы, сроки или условия — оформи их в таблицу или маркированный список.
6. Язык документа должен соответствовать языку запроса пользователя (русский, казахский или английский).

ТРЕБОВАНИЯ К ФОРМАТУ (JSON):
- Ответ должен быть СТРОГО валидным JSON объектом.
- Используй ключи: "content", которые могут содержать "text", "bold", "fontSize", "alignment", и "table" (с body: [[...]]).
- Мы используем библиотеку jsPDF для отрисовки, поэтому структура должна быть плоской и понятной.

Описание документа:
"${promptText}"

Верни ТОЛЬКО JSON объект. Без лишних слов и markdown-разметки.`;

  const result = await safeGenerateContent(prompt);
  const text = result.response.text().trim();
  return JSON.parse(extractJson(text));
}

module.exports = {
  analyzeContract,
  calculateTaxes,
  parseTransactions,
  analyzeDocument,
  chatWithTaxExpert,
  chatWithBusinessAdvisor,
  forecastTaxes,
  analyzeFinancialHealth,
  generateDocumentContent
};
