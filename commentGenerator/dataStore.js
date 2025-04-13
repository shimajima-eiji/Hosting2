// アプリケーション全体で共有するデータストア

// グローバル変数として定義（既に存在する場合は再定義しない）
window.maskingMap = window.maskingMap || new Map();
window.maskCounter = window.maskCounter || 1;

// データストアモジュール
window.dataStore = {
    // マスキングマップの操作メソッド
    clearMaskingMap: function() {
        window.maskingMap.clear();
    },
    setMaskingPair: function(maskId, realName) {
        window.maskingMap.set(maskId, realName);
    },
    getMaskingMap: function() {
        return window.maskingMap;
    },
    
    // マスクカウンターの操作
    resetMaskCounter: function() {
        window.maskCounter = 1;
    },
    incrementMaskCounter: function() {
        return window.maskCounter++;
    },
    getMaskCounter: function() {
        return window.maskCounter;
    }
};