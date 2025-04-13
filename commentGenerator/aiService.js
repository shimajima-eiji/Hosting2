// 複数のAIプロバイダー対応サービス

// テンプレート文字列を変数で置換する関数
function renderTemplate(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
    });
}

// プロンプトを生成する関数
function generatePrompt(studentData) {
    if (!studentData || !studentData.name) {
        return '';
    }
    
    // テンプレートに変数を埋め込む
    return renderTemplate(window.appConfig.prompts.userTemplate, {
        name: studentData.name,
        comment: studentData.comment || '',
        understanding: studentData.understanding || ''
    });
}

// モックレスポンス生成関数
function generateMockResponse(studentData) {
    if (!studentData || !studentData.name) {
        return "学生データが不足しています";
    }
    
    // 理解度に応じたテンプレートの選択
    let templateKey = 'default';
    const understanding = parseInt(studentData.understanding);
    
    if (!isNaN(understanding)) {
        if (understanding >= 90) {
            templateKey = 'high';
        } else if (understanding >= 80) {
            templateKey = 'medium';
        } else if (understanding >= 60) {
            templateKey = 'low';
        } else {
            templateKey = 'veryLow';
        }
    }
    
    // テンプレートを取得して変数を置換
    const template = window.appConfig.mockResponses[templateKey];
    return renderTemplate(template, { name: studentData.name });
}

// OpenAI API呼び出し
async function callOpenAIAPI(studentData) {
    try {
        // APIキーの取得
        const aiConfig = window.appConfig.ai;
        const apiKey = aiConfig.openai.apiKey;
        
        if (!apiKey || apiKey === 'sk-YOUR_API_KEY_HERE') {
            throw new Error(window.appConfig.errorMessages.noApiKey);
        }
        
        // プロンプト生成
        const prompt = generatePrompt(studentData);
        
        // API呼び出し
        const response = await fetch(aiConfig.openai.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: aiConfig.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: window.appConfig.prompts.system
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: aiConfig.openai.maxTokens,
                temperature: aiConfig.openai.temperature
            })
        });
        
        // エラーチェック
        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI API Error:", response.status, errorText);
            throw new Error(`API Error (${response.status})`);
        }
        
        // レスポンスの解析
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`API Error: ${data.error.message}`);
        }
        
        // レスポンスからテキストを抽出
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API呼び出しエラー:', error);
        return window.appConfig.errorMessages.apiError;
    }
}

// Anthropic Claude API呼び出し
async function callClaudeAPI(studentData) {
    try {
        // APIキーの取得
        const aiConfig = window.appConfig.ai;
        const apiKey = aiConfig.claude.apiKey;
        
        if (!apiKey) {
            throw new Error(window.appConfig.errorMessages.noApiKey);
        }
        
        // プロンプト生成
        const prompt = generatePrompt(studentData);
        
        // API呼び出し
        const response = await fetch(aiConfig.claude.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: aiConfig.claude.model,
                messages: [
                    {
                        role: 'system',
                        content: window.appConfig.prompts.system
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: aiConfig.claude.maxTokens,
                temperature: aiConfig.claude.temperature
            })
        });
        
        // エラーチェック
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Claude API Error:", response.status, errorText);
            throw new Error(`API Error (${response.status})`);
        }
        
        // レスポンスの解析
        const data = await response.json();
        
        // レスポンスからテキストを抽出（Claudeの場合）
        return data.content[0].text;
    } catch (error) {
        console.error('Claude API呼び出しエラー:', error);
        return window.appConfig.errorMessages.apiError;
    }
}

// Google Gemini API呼び出し
async function callGeminiAPI(studentData) {
    try {
        // APIキーの取得
        const aiConfig = window.appConfig.ai;
        const apiKey = aiConfig.gemini.apiKey;
        
        if (!apiKey) {
            throw new Error(window.appConfig.errorMessages.noApiKey);
        }
        
        // プロンプト生成
        const prompt = generatePrompt(studentData);
        const systemPrompt = window.appConfig.prompts.system;
        
        // エンドポイントにAPIキーを追加
        const endpointWithKey = `${aiConfig.gemini.endpoint}?key=${apiKey}`;
        
        // API呼び出し（Geminiの形式）
        const response = await fetch(endpointWithKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: systemPrompt + "\n\n" + prompt }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: aiConfig.gemini.temperature,
                    maxOutputTokens: aiConfig.gemini.maxTokens
                }
            })
        });
        
        // エラーチェック
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", response.status, errorText);
            throw new Error(`API Error (${response.status})`);
        }
        
        // レスポンスの解析（Geminiの形式）
        const data = await response.json();
        
        // レスポンスからテキストを抽出
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API呼び出しエラー:', error);
        return window.appConfig.errorMessages.apiError;
    }
}

// メインAPI呼び出し関数
async function callAPI(studentData) {
    // デバッグモードの場合またはプロバイダーがmockの場合
    if (window.appConfig.debug.enabled || window.appConfig.ai.provider === 'mock') {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(generateMockResponse(studentData));
            }, window.appConfig.debug.mockDelay);
        });
    }
    
    // プロバイダーに応じたAPI呼び出し
    const provider = window.appConfig.ai.provider;
    switch (provider) {
        case 'claude':
            return callClaudeAPI(studentData);
        case 'gemini':
            return callGeminiAPI(studentData);
        case 'openai':
            return callOpenAIAPI(studentData);
        default:
            // デフォルトではOpenAI
            return callOpenAIAPI(studentData);
    }
}

// AIサービスモジュールとして公開
window.aiService = {
    callAPI
};

console.log('AI サービスモジュールが読み込まれました');