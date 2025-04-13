// コメント生成ボタンの処理

// テスト用：1件のみ処理する関数
async function processOneStudent(parsedData, index) {
    if (!parsedData || parsedData.length < 2 || index < 1 || index >= parsedData.length) {
        throw new Error('有効なデータが見つかりません');
    }
    
    // ヘッダー行の取得
    const headers = parsedData[0];
    
    // 結果用の配列（ヘッダー行を設定）
    const resultData = [["名前", "AIコメント"]];
    
    // 各行の処理（厳密に行数をチェック）
    for (let i = 1; i < parsedData.length; i++) {
        const currentRow = parsedData[i];
        
        // 名前列のチェック（空でない場合のみ処理）
        if (!currentRow || !currentRow[0]) continue;
        
        // 行データを明示的に取り出す
        const name = currentRow[0] || "";
        
        if (i === index) {
            // 選択行の場合：API呼び出し
            const studentData = {
                name: name,
                comment: currentRow[2] || '', // コメント列
                understanding: currentRow[1] || '' // 理解度列
            };
            
            try {
                // API呼び出し（studentDataを直接渡す）
                const generatedComment = await window.aiService.callAPI(studentData);
                
                // 結果に追加
                resultData.push([name, generatedComment]);
            } catch (error) {
                console.error(`${name} さんのコメント生成でエラー:`, error);
                // エラーメッセージを結果に追加
                resultData.push([name, `${window.appConfig.errorMessages.parseError} (${name})`]);
            }
        } else {
            // 選択行以外は「未実施」を追加
            resultData.push([name, "未実施"]);
        }
    }
    
    return resultData;
}

// すべての学生を処理する関数
async function processAllStudents(parsedData) {
    if (!parsedData || parsedData.length < 2) {
        throw new Error('有効なCSVデータが見つかりません');
    }
    
    // 結果用の配列（ヘッダー行を設定）
    const resultData = [["名前", "AIコメント"]];
    
    // 各学生のデータに対してAPI呼び出し
    for (let i = 1; i < parsedData.length; i++) {
        const row = parsedData[i];
        if (!row[0]) continue; // 名前が空の行はスキップ
        
        // 学生データの準備
        const studentData = {
            name: row[0],
            comment: row[2] || '', // コメント列
            understanding: row[1] || '' // 理解度列
        };
        
        try {
            // API呼び出し（studentDataを直接渡す）
            const generatedComment = await window.aiService.callAPI(studentData);
            
            // 結果に追加
            resultData.push([row[0], generatedComment]);
        } catch (error) {
            console.error(`学生 ${row[0]} のコメント生成でエラー:`, error);
            // エラーメッセージを結果に追加
            resultData.push([row[0], `${window.appConfig.errorMessages.parseError} (${row[0]})`]);
        }
    }
    
    return resultData;
}

// コメント生成ボタンのイベントハンドラをセットアップする関数
function setupGenerateCommentButton() {
    document.getElementById('generateCommentButton').addEventListener('click', async function() {
        const maskedData = document.getElementById('maskedData').value;
        
        try {
            // マスキングされたCSVをパース
            const parsedData = window.utils.parseCSV(maskedData);
            
            if (!parsedData || parsedData.length < 2) {
                throw new Error('有効なCSVデータが見つかりません');
            }
            
            // 選択：1件のみ処理するか全件処理するか
            const processAll = false; // falseで1件のみ、trueで全件処理
            let resultData;
            
            if (processAll) {
                // すべての学生を処理する場合
                resultData = await processAllStudents(parsedData);
            } else {
                // テスト用：最初の学生（インデックス1）のみ処理する場合
                const processIndex = 1; // 処理する学生のインデックス（1から始まる）
                resultData = await processOneStudent(parsedData, processIndex);
            }
    
            // 結果を表示
            document.getElementById('generatedComment').value = window.utils.toCSVString(resultData);
            
            // 共有コンテンツにも同じものをコピー
            document.getElementById('shareContent').value = window.utils.toCSVString(resultData);
        } catch (error) {
            console.error('コメント生成でエラーが発生しました:', error);
            alert('コメント生成中にエラーが発生しました。データ形式を確認してください。');
            // フェールソフト: エラーが発生した場合も何らかの出力を行う
            document.getElementById('generatedComment').value = window.appConfig.errorMessages.parseError;
            document.getElementById('shareContent').value = window.appConfig.errorMessages.parseError;
        }
    });
}

// 関数をグローバルにエクスポート
window.setupGenerateCommentButton = setupGenerateCommentButton;