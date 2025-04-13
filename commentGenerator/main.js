// アプリケーションのエントリーポイント

// DOMが読み込まれた後にイベントリスナーを初期化する関数
function initializeEventListeners() {
    // maskButton.js でエクスポートされたイベントハンドラを設定
    if (typeof window.setupMaskButton === 'function') {
        window.setupMaskButton();
    }
    
    // generateCommentButton.js でエクスポートされたイベントハンドラを設定
    if (typeof window.setupGenerateCommentButton === 'function') {
        window.setupGenerateCommentButton();
    }
    
    // unmaskButton.js でエクスポートされたイベントハンドラを設定
    if (typeof window.setupUnmaskButton === 'function') {
        window.setupUnmaskButton();
    }
    
    // copyButton.js でエクスポートされたイベントハンドラを設定
    if (typeof window.setupCopyButton === 'function') {
        window.setupCopyButton();
    }
    
    console.log('すべてのイベントリスナーが初期化されました');
}

// 残りのモジュールが読み込まれたことを確認する関数
function checkModulesLoaded() {
    // 必要なすべての関数が読み込まれているか確認
    if (typeof window.utils !== 'undefined' && 
        typeof window.dataStore !== 'undefined') {
        
        // すべての依存モジュールが読み込まれているので、イベントリスナーを初期化
        initializeEventListeners();
    } else {
        // まだ一部のモジュールが読み込まれていない場合は少し待ってから再確認
        setTimeout(checkModulesLoaded, 100);
    }
}

// DOMが完全に読み込まれた後に初期化処理を開始
document.addEventListener('DOMContentLoaded', function() {
    // コンソールにバージョン情報を表示
    console.log('CSVマスキングツール v1.0 初期化中...');
    
    // モジュールの読み込みを確認
    checkModulesLoaded();
});