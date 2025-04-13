// マスキングボタンの処理

// 日報コメント列を特定する関数
function identifyCommentColumns(csvData) {
    if (!csvData || csvData.length < 1) {
        return [];
    }
    
    const headers = csvData[0];
    const commentIndices = [];
    
    // ヘッダーの中からコメント関連の列を探す
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (header && typeof header === 'string' && 
            (header.includes('コメント') || header.includes('質問') || 
             header === 'Comment' || header.includes('メモ'))) {
            commentIndices.push(i);
        }
    }
    
    // コメント列が見つからない場合、2列目（インデックス1）をコメント列と想定
    if (commentIndices.length === 0 && headers.length > 1) {
        return [1];
    }
    
    return commentIndices;
}

// 理解度列を特定する関数
function identifyUnderstandingColumn(csvData) {
    if (!csvData || csvData.length < 1) {
        return -1;
    }
    
    const headers = csvData[0];
    
    // ヘッダーの中から理解度関連の列を探す
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (header && typeof header === 'string' && 
            (header.includes('理解度') || header.includes('達成度') || 
             header === 'Understanding' || header.includes('スコア') || 
             header.includes('score'))) {
            return i;
        }
    }
    
    // 理解度列が見つからない場合、数値が入っている列を探す
    for (let i = 1; i < Math.min(csvData.length, 10); i++) {
        const row = csvData[i];
        for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            // 数値のみを含む列（80、90、100など）
            if (!isNaN(cell) && Number(cell) >= 0 && Number(cell) <= 100) {
                return j;
            }
        }
    }
    
    return -1;
}

// 除外する列を特定する関数（特定のキーワードを含む列など）
function identifyExcludeColumns(csvData) {
    if (!csvData || csvData.length < 1) {
        return [];
    }
    
    const headers = csvData[0];
    const excludeIndices = [];
    
    // ヘッダーの中から除外する列を探す
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (header && typeof header === 'string' && 
            (header.includes('削除') || header.includes('消す') || 
             header.includes('除外') || header.includes('ID') || 
             header.includes('番号'))) {
            excludeIndices.push(i);
        }
    }
    
    return excludeIndices;
}

// 名前列を特定する関数（改良版）
function identifyNameColumn(csvData) {
    if (!csvData || csvData.length < 2) {
        console.warn("CSVデータが不十分です");
        return 0;
    }

    const headers = csvData[0];
    console.log("ヘッダー行:", headers);
    
    // まず名前に関連するヘッダーを探す
    const nameKeywords = ["名前", "氏名", "受講生名", "生徒名", "学生名", "Name", "name"];
    
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const header = headers[colIndex];
        if (!header || typeof header !== "string") continue;
        
        // 正確なキーワードマッチング
        for (const keyword of nameKeywords) {
            if (header === keyword || header.includes(keyword)) {
                console.log(`名前列を特定しました: インデックス ${colIndex}, ヘッダー "${header}"`);
                return colIndex;
            }
        }
    }
    
    // ヘッダーから特定できなかった場合、内容から判断する
    console.log("ヘッダーで名前列が見つかりませんでした。内容から判断します。");
    
    let bestColumn = 0;
    let maxNameCount = 0;
    
    // 最初の5列までを検索
    for (let colIndex = 0; colIndex < Math.min(5, headers.length); colIndex++) { 
        let nameCount = 0;
        
        // 最初の10行をサンプルとして調べる
        for (let rowIndex = 1; rowIndex < Math.min(csvData.length, 11); rowIndex++) {
            const row = csvData[rowIndex];
            if (!row || colIndex >= row.length) continue;
            
            const value = row[colIndex];
            if (typeof value === "string" && shouldMaskName(value)) {
                nameCount++;
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

// IDを特定する関数（新規追加）
function identifyIDColumn(csvData) {
    if (!csvData || csvData.length < 2) return -1;
    
    const headers = csvData[0];
    const idKeywords = ["ID", "番号", "学籍番号", "受講生ID", "顧客番号"];
    
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const header = headers[colIndex];
        if (!header || typeof header !== "string") continue;
        
        for (const keyword of idKeywords) {
            if (header === keyword || header.includes(keyword)) {
                console.log(`ID列を特定しました: インデックス ${colIndex}, ヘッダー "${header}"`);
                return colIndex;
            }
        }
    }
    
    return -1; // IDらしき列が見つからない場合
}

// 名前のマスキング判定（改良版）
function shouldMaskName(name) {
    if (!name || typeof name !== 'string') return false;
    
    // 空白を削除して長さをチェック
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 30) return false;
    
    // 名前らしいパターン（より幅広いマッチング）
    // 日本人名（漢字、ひらがな、カタカナ）
    // 英語名（アルファベット）
    // スペースや記号も許容
    const namePattern = /^[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FFa-zA-Z\s\u3000\u2160-\u2188\.\-]+$/;
    
    // IDっぽい形式を除外（数字のみや数字が多いパターン）
    const idPattern = /^\d+$|^\d{3,}/;
    
    return namePattern.test(trimmed) && !idPattern.test(trimmed);
}

// CSVデータを処理し、名前・理解度・コメントの列に絞る（順序変更）
function processCSVData(csvData) {
    if (!csvData || csvData.length < 2) {
        // ヘッダーも新しい順序に合わせる
        return [["名前", "理解度", "コメント"]];
    }

    try {
        // 列のインデックスを特定（変更なし）
        const nameColumnIndex = identifyNameColumn(csvData);
        const idColumnIndex = identifyIDColumn(csvData);
        const commentColumnIndices = identifyCommentColumns(csvData);
        const understandingColumnIndex = identifyUnderstandingColumn(csvData);
        const excludeIndices = identifyExcludeColumns(csvData);
        
        console.log("名前列:", nameColumnIndex, "ID列:", idColumnIndex);
        
        // 処理結果の2次元配列を作成（順序変更）
        const result = [["名前", "理解度", "コメント"]];
        
        // 行データを名前ごとにグループ化するためのマップ（変更なし）
        const studentMap = new Map();
        
        // 各行を処理（ヘッダー行はスキップ）（変更なし）
        for (let i = 1; i < csvData.length; i++) {
            const row = csvData[i];
            if (!row || row.length <= nameColumnIndex || !row[nameColumnIndex]) continue;
            
            const name = row[nameColumnIndex];
            const id = (idColumnIndex >= 0 && row.length > idColumnIndex) ? row[idColumnIndex] : "";
            
            // この名前の学生のデータを取得または作成（変更なし）
            if (!studentMap.has(name)) {
                studentMap.set(name, {
                    name: name,
                    id: id,
                    comments: [],
                    understanding: "",
                });
            }
            
            const student = studentMap.get(name);
            
            // IDがない場合は追加（変更なし）
            if (!student.id && id) {
                student.id = id;
            }
            
            // コメント列の値を追加（変更なし）
            for (const commentIndex of commentColumnIndices) {
                if (excludeIndices.includes(commentIndex)) continue;
                if (commentIndex < row.length && row[commentIndex]) {
                    student.comments.push(row[commentIndex].trim());
                }
            }
            
            // 理解度の値を設定（変更なし）
            if (!student.understanding && 
                understandingColumnIndex >= 0 && 
                understandingColumnIndex < row.length && 
                row[understandingColumnIndex]) {
                student.understanding = row[understandingColumnIndex];
            }
        }
        
        // マップから結果の配列を作成（順序変更）
        studentMap.forEach(student => {
            result.push([
                student.name,
                student.understanding || "",
                student.comments.join(" ") // コメントを空白で連結
            ]);
        });
        
        return result;
    } catch (error) {
        console.error("processCSVData でエラーが発生:", error);
        // エラー時のヘッダーも新しい順序に合わせる
        return [["名前", "理解度", "コメント"]];
    }
}

// CSVの特定列をマスキングする関数
function maskCSV(csvData) {
    if (!csvData || csvData.length < 2) {
        return csvData;
    }
    
    try {
        // マスキングマップをクリア
        window.maskingMap.clear();
        window.maskCounter = 1;
        
        // マッピング情報も保存するための拡張マスキングマップ
        const extendedMaskingMap = new Map();
        
        // 各行をマスキング
        const maskedData = csvData.map((row, rowIndex) => {
            if (rowIndex === 0) return row; // ヘッダー行はそのまま
            
            return row.map((cell, colIndex) => {
                // 名前列の場合はマスキング（変更なし）
                if (colIndex === 0 && shouldMaskName(cell)) {
                    const maskId = `Person_${window.maskCounter++}`;
                    
                    // 通常のマスキングマップに追加（後方互換性）
                    window.maskingMap.set(maskId, cell);
                    
                    // 拡張マスキングマップに追加（名前とIDの情報を保存）
                    extendedMaskingMap.set(maskId, {
                        name: cell,
                        id: ""  // IDは後で必要に応じて設定
                    });
                    
                    return maskId;
                }
                
                // コメント列の場合は名前をマスキング（インデックスを2に変更）
                if (colIndex === 2 && typeof cell === "string") {
                    let maskedCell = cell;
                    
                    // すでにマスキングした名前を置換
                    window.maskingMap.forEach((realName, maskId) => {
                        if (!realName) return;
                        
                        // 名前が単語として含まれる場合のみ置換（単語境界を使用）
                        const escapedName = realName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
                        const namePattern = new RegExp(`\\b${escapedName}\\b`, "g");
                        maskedCell = maskedCell.replace(namePattern, maskId);
                    });
                    
                    return maskedCell;
                }
                
                return cell;
            });
        });

        // 拡張マスキングマップをグローバル変数に保存（必要に応じて）
        window.extendedMaskingMap = extendedMaskingMap;
        
        return maskedData;
    } catch (error) {
        console.error("maskCSV でエラーが発生:", error);
        return csvData; // エラー時は元のデータを返す
    }
}

// マスクボタンのイベントハンドラをセットアップする関数
function setupMaskButton() {
    document.getElementById("maskButton").addEventListener("click", function() {
        console.log("マスクボタンがクリックされました");
        const rawData = document.getElementById("rawData").value;
        
        if (!rawData.trim()) {
            alert("CSVデータを入力してください");
            return;
        }
        
        try {
            console.log("CSVをパースします");
            // CSVをパース
            const parsedData = window.utils.parseCSV(rawData);
            console.log("CSVパース結果:", parsedData);
            
            console.log("CSVデータを処理します");
            // CSV処理
            const processedData = processCSVData(parsedData);
            console.log("CSV処理結果:", processedData);
            
            console.log("マスキング処理を実行します");
            // マスキング処理
            const maskedData = maskCSV(processedData);
            console.log("マスキング結果:", maskedData);
            
            // マスキングされたCSVを表示
            document.getElementById("maskedData").value = window.utils.toCSVString(maskedData);
            console.log("マスキング処理が完了しました");
        } catch (error) {
            console.error("マスキング処理でエラーが発生しました:", error);
            alert("マスキング処理中にエラーが発生しました: " + error.message);
            // フェールソフト: エラーが発生した場合も何らかの出力を行う
            document.getElementById("maskedData").value = "エラー: " + error.message;
        }
    });
}

// 関数をグローバルにエクスポート
window.setupMaskButton = setupMaskButton;