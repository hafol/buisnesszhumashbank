const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

/**
 * Analyzes a legal contract text
 * @param {string} contractText
 * @returns {Promise<Object>} { summary, keyTerms, obligations, risks, deadlines }
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

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code blocks if present
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Calculates Kazakhstan taxes based on business or individual info
 * @param {Object} params
 * @returns {Promise<Object>} full tax calculation
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

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Chat with a tax expert
 * @param {string} userMessage
 * @param {Object} context ({ taxData, userType, regime })
 * @returns {Promise<string>} expert response
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

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Parses a bank statement and extracts ALL transactions with categorization
 * @param {string} statementText
 * @returns {Promise<Array>} array of categorized transactions
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

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  const parsed = JSON.parse(cleaned);
  return parsed.transactions || [];
}

/**
 * General document analysis
 * @param {string} documentText
 * @returns {Promise<Object>}
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

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Business advisor AI with memory and financial context
 */
async function chatWithBusinessAdvisor({ businessName, businessType, businessDescription, transactions, chatHistory, userMessage }) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const profit = totalIncome - totalExpense;

  const historyText = chatHistory.length > 0
    ? chatHistory.map(m => `${m.role === 'user' ? 'Клиент' : 'ИИ-советник'}: ${m.message}`).join('\n')
    : 'Это начало разговора.';

  const recentTx = transactions.slice(0, 10).map(t =>
    `${t.date}: ${t.type === 'income' ? '+' : '-'}₸${Number(t.amount).toLocaleString()} (${t.category}) — ${t.description}`
  ).join('\n') || 'Транзакций нет';

  const prompt = `Ты — персональный бизнес-советник и стратег по развитию бизнеса в Казахстане.

ДАННЫЕ О БИЗНЕСЕ:
- Название: ${businessName}
- Тип: ${businessType}
- Описание: ${businessDescription || 'Не указано'}
- Общий доход: ₸${totalIncome.toLocaleString()}
- Общие расходы: ₸${totalExpense.toLocaleString()}
- Чистая прибыль: ₸${profit.toLocaleString()}

ПОСЛЕДНИЕ ТРАНЗАКЦИИ:
${recentTx}

ИСТОРИЯ РАЗГОВОРА:
${historyText}

ТЕКУЩИЙ ВОПРОС КЛИЕНТА: "${userMessage}"

ИНСТРУКЦИИ:
1. Определи язык вопроса (русский, казахский, английский) и отвечай НА ТОМ ЖЕ ЯЗЫКЕ.
2. Учитывай всю историю разговора — не повторяй уже сказанное.
3. Используй реальные финансовые данные бизнеса в своих советах.
4. Давай конкретные, практичные рекомендации по росту и масштабированию.
5. Если спрашивают о прибыльности — анализируй соотношение доходов и расходов.
6. Если нет транзакций — сначала попроси рассказать больше о бизнесе.
7. Будь дружелюбным и мотивирующим, но реалистичным.
8. Ответ должен быть структурированным (используй эмодзи для разделов).
9. Не превышай 300 слов в ответе.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = { analyzeContract, calculateTaxes, parseTransactions, analyzeDocument, chatWithTaxExpert, chatWithBusinessAdvisor };

