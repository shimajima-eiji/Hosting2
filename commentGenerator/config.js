// アプリケーション全体の設定を管理する設定ファイル

// アプリケーション設定
window.appConfig = {
  // デバッグモード設定（本番環境では false に設定）
  debug: {
    enabled: false, // 開発中はデバッグモードを有効に
    mockDelay: 500 // モックレスポンス遅延（ミリ秒）
  },

  // AI設定（開発者のみ変更）
  ai: {
    // 使用するAIプロバイダー: "openai", "claude", "gemini" または "mock"
    provider: 'openai',

    // OpenAI設定
    openai: {
      apiKey: '', // 実際のAPIキーを設定
      endpoint: 'https://api.openai.com/v1/chat/completions',
      // model: "gpt-3.5-turbo",
      model: 'gpt-4.5-preview',
      temperature: 0.7,
      maxTokens: 300
    },

    // Anthropic Claude設定
    claude: {
      apiKey: '', // Anthropic APIキーを設定
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-5-haiku-20241022', // または "claude-3-sonnet-20240229"
      temperature: 0.7,
      maxTokens: 300
    },

    // Google Gemini設定
    gemini: {
      apiKey: '', // Google AI Studio APIキーを設定
      endpoint:
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      model: 'gemini-pro',
      temperature: 0.7,
      maxTokens: 300
    }
  },

  // プロンプト設定
  prompts: {
    // システムプロンプト（AIの役割設定）
    system: `ファインチューニング`,

    // ユーザープロンプトテンプレート（変更なし）
    userTemplate: ``.trim()
  },

  // エラーメッセージ
  errorMessages: {
    apiError: '[AI生成エラー] このコメントは生成に失敗しました。管理者にお問い合わせください。',
    noApiKey: '[設定エラー] システム設定が不完全です。管理者にお問い合わせください。',
    parseError:
      '[データエラー] データの解析中にエラーが発生しました。フォーマットを確認してください。'
  },

  // モックレスポンス設定（デバッグモードまたはmockプロバイダー用）
  mockResponses: {
    high: '{{name}}さんは学習内容を非常によく理解しています。日報からは積極的な質問姿勢と自己解決能力の高さが伺えます。特に課題への取り組み方が丁寧で、実践的な応用力も身についていると感じました。引き続き周囲への知識共有も行いながら、さらなる高みを目指していきましょう。',
    medium:
      '{{name}}さんは基礎をしっかり理解し、積極的に学習に取り組んでいますね。日報からは、学習内容を自分の言葉で整理できていることが分かります。今後は応用的な課題にも挑戦して、知識の幅を広げていくと良いでしょう。質問も遠慮なくしてくださいね。',
    low: '{{name}}さんは基本的な内容に取り組む姿勢は良いですが、日報の内容に少し誤解があるようです。概念の基礎部分を復習して、実際に手を動かして確認することをお勧めします。分からないことはすぐに質問してください。一緒に理解を深めていきましょう。',
    veryLow:
      '{{name}}さんは日報から学習への意欲は感じられますが、基本概念の理解に課題があるようです。焦らず基礎から丁寧に復習していきましょう。特に重要なのは実践を通した理解です。明日は一緒に基本的な部分から確認していきたいと思います。質問はいつでも歓迎です。',
    default:
      '{{name}}さんの日報から、学習への意欲が伝わってきます。日々の取り組みが具体的に記載されており、理解度の高さを感じました。引き続き実践を通して知識を定着させていきましょう。疑問点があれば、遠慮なく質問してください。日々の積み重ねが大きな成長につながります。'
  }
};

console.log('設定ファイルが読み込まれました');
