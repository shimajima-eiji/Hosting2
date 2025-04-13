// 共通ユーティリティ関数

// 改行を含むCSVをパースする関数
function parseCSV(csvText) {
    console.log("parseCSV が呼び出されました");
    
    if (!csvText) return [];
    
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;
    
    // 改行コードを統一
    const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    for (let i = 0; i < normalizedText.length; i++) {
        const char = normalizedText[i];
        
        if (char === '"') {
            // 引用符の処理
            if (i + 1 < normalizedText.length && normalizedText[i + 1] === '"') {
                // エスケープされた引用符
                currentField += '"';
                i++; // 次の文字をスキップ
            } else {
                // 引用符の開始/終了
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // 引用符外のカンマは列の区切り
            currentLine.push(currentField);
            currentField = '';
        } else if (char === '\n' && !inQuotes) {
            // 引用符外の改行は行の区切り
            currentLine.push(currentField);
            lines.push(currentLine);
            currentLine = [];
            currentField = '';
        } else {
            // その他の文字はフィールドに追加
            currentField += char;
        }
    }
    
    // 最後のフィールドと行を処理
    if (currentField !== '' || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
    }
    
    return lines;
}

// CSVを文字列に変換する際、改行を含むセルは引用符で囲む
function toCSVString(data) {
    console.log("toCSVString が呼び出されました");
    
    if (!data || data.length === 0) return '';
    
    return data.map(row => {
        return row.map(cell => {
            // null/undefined対策
            if (cell === null || cell === undefined) return '';
            
            const cellStr = String(cell);
            // セルに改行、カンマ、引用符が含まれている場合は引用符で囲む
            if (cellStr.includes('\n') || cellStr.includes(',') || cellStr.includes('"')) {
                // 引用符をエスケープ（引用符を二重にする）
                return '"' + cellStr.replace(/"/g, '""') + '"';
            }
            return cellStr;
        }).join(',');
    }).join('\n');
}

// 名前かどうかを判定する関数（日本人名のパターン）
function isJapaneseName(text) {
    if (!text || typeof text !== 'string') return false;
    
    // 空白を削除して長さをチェック
    const trimmed = text.trim();
    if (trimmed.length < 2 || trimmed.length > 15) return false;
    
    // 漢字、ひらがな、カタカナ、空白のみを含むか確認
    const namePattern = /^[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\s]+$/;
    
    return namePattern.test(trimmed);
}

// 名前列を特定する関数 - デバッグ情報を追加
function identifyNameColumn(csvData) {
    console.log("identifyNameColumn が呼び出されました", csvData && csvData.length);
    
    if (!csvData || csvData.length < 2) {
        console.warn("CSVデータが不十分です");
        return 0; // データが少なすぎる場合は0を返す
    }

    const headers = csvData[0];
    console.log("ヘッダー行:", headers);
    
    // ヘッダーから名前らしき列を探す
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const header = headers[colIndex];
        if (header && typeof header === "string") {
            console.log(`ヘッダー[${colIndex}]: "${header}"`);
            if (header.includes("名前") || header.includes("氏名") || 
                header.includes("受講生") || header.includes("生徒") || 
                header === "Name" || header === "name") {
                console.log(`名前列を特定しました: インデックス ${colIndex}, ヘッダー "${header}"`);
                return colIndex;
            }
        }
    }
    
    console.log("ヘッダーで名前列が見つかりませんでした。内容から判断します。");
    
    // ヘッダーで見つからない場合、内容から判断
    // 日本人名らしき文字列（漢字+ひらがな/カタカナ）を含む列を探す
    let bestColumn = 0;
    let maxNameCount = 0;
    
    for (let colIndex = 0; colIndex < Math.min(5, headers.length); colIndex++) { // 最初の5列のみ検索
        let nameCount = 0;
        
        // 最初の10行ほどをサンプルとして調べる
        for (let rowIndex = 1; rowIndex < Math.min(csvData.length, 11); rowIndex++) {
            const row = csvData[rowIndex];
            if (colIndex < row.length && row[colIndex]) {
                const value = row[colIndex];
                if (typeof value === "string" && isJapaneseName(value)) {
                    nameCount++;
                }
            }
        }
        
        console.log(`列${colIndex}の名前らしき値の数: ${nameCount}`);
        
        if (nameCount > maxNameCount) {
            maxNameCount = nameCount;
            bestColumn = colIndex;
        }
    }
    
    console.log(`内容から判断した名前列: インデックス ${bestColumn}, 名前らしき値の数 ${maxNameCount}`);
    return bestColumn;
}

// 外部に公開する関数をエクスポート
window.utils = {
    parseCSV,
    toCSVString,
    identifyNameColumn,
    isJapaneseName
};

// 初期化完了メッセージ
console.log("utils.js の読み込みが完了しました");