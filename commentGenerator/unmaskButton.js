// マスキング解除ボタンの処理

// マスキングを解除する関数 - 改良版
function unmaskCSV(maskedData) {
    if (!maskedData || maskedData.length === 0) {
        return [];
    }
    
    console.log("マスキング解除を開始します");
    
    // マスキングマップからマスクIDと実名のペアを配列で取得
    const maskPairs = [];
    
    // マスキングマップの取得（window.maskingMapを直接使用）
    window.maskingMap.forEach((realName, maskId) => {
        if (!realName || !maskId) return;
        
        maskPairs.push({
            maskId: maskId,
            realName: realName,
            // 正規表現用にエスケープが必要な文字をエスケープ
            escapedMaskId: maskId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        });
    });
    
    console.log(`マスキングマップからの項目数: ${maskPairs.length}`);
    
    // マスクIDの長さでソート（長い順）- これが重要！
    // これにより Person_10 が Person_1 よりも先に処理される
    maskPairs.sort((a, b) => b.maskId.length - a.maskId.length);
    
    // マスキング解除処理（改良版）
    const unmaskedData = maskedData.map((row, rowIndex) => {
        if (rowIndex === 0) return row; // ヘッダー行はそのまま
        
        return row.map(cell => {
            if (typeof cell !== 'string') return cell;
            
            let unmaskedCell = cell;
            
            // すべてのマスクIDを実名に置換（長い順に処理）
            maskPairs.forEach(pair => {
                // 完全一致の場合
                if (unmaskedCell === pair.maskId) {
                    unmaskedCell = pair.realName;
                } else {
                    // 部分一致（コメント内のマスクIDなど）の場合
                    // 単語境界を使って正確に置換
                    const regex = new RegExp(`\\b${pair.escapedMaskId}\\b`, 'g');
                    unmaskedCell = unmaskedCell.replace(regex, pair.realName);
                }
            });
            
            return unmaskedCell;
        });
    });
    
    console.log("マスキング解除が完了しました");
    return unmaskedData;
}

// コメント内の名前参照のみを解除する機能（新機能）
function unmaskNamesInComments(commentText) {
    if (!commentText || typeof commentText !== 'string') {
        return commentText;
    }
    
    let unmaskedText = commentText;
    
    // マスキングマップからマスクIDと実名のペアを配列で取得
    const maskPairs = [];
    window.maskingMap.forEach((realName, maskId) => {
        if (!realName || !maskId) return;
        
        maskPairs.push({
            maskId: maskId,
            realName: realName,
            escapedMaskId: maskId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        });
    });
    
    // マスクIDの長さでソート（長い順）
    maskPairs.sort((a, b) => b.maskId.length - a.maskId.length);
    
    // すべてのマスクIDを実名に置換（長い順に処理）
    maskPairs.forEach(pair => {
        // コメント内の参照を置換
        const regex = new RegExp(`\\b${pair.escapedMaskId}\\b`, 'g');
        unmaskedText = unmaskedText.replace(regex, pair.realName);
    });
    
    return unmaskedText;
}

// マスク解除ボタンのイベントハンドラをセットアップする関数
function setupUnmaskButton() {
    document.getElementById('unmaskButton').addEventListener('click', function() {
        const generatedComment = document.getElementById('generatedComment').value;
        
        try {
            console.log("マスキング解除ボタンがクリックされました");
            
            // エッジケース: 入力が空の場合
            if (!generatedComment.trim()) {
                alert('マスキング解除する内容がありません。');
                return;
            }
            
            // 生成されたコメントをパース
            console.log("生成コメントをパースします");
            const parsedData = window.utils.parseCSV(generatedComment);
            console.log("パース結果:", parsedData);
            
            if (!parsedData || parsedData.length === 0) {
                throw new Error('有効なCSVデータがありません');
            }
            
            // マスキングを解除
            console.log("マスキング解除を実行します");
            const unmaskedData = unmaskCSV(parsedData);
            console.log("マスキング解除結果:", unmaskedData);
            
            // 結果を表示
            document.getElementById('shareContent').value = window.utils.toCSVString(unmaskedData);
            console.log("マスキング解除結果を表示しました");
        } catch (error) {
            console.error('マスキング解除でエラーが発生しました:', error);
            alert('マスキング解除中にエラーが発生しました: ' + error.message);
            
            // フェールソフト: エラーが発生した場合はテキスト形式で処理を試みる
            try {
                const unmaskedText = unmaskNamesInComments(generatedComment);
                document.getElementById('shareContent').value = unmaskedText;
                console.log("フェールソフト: テキスト形式での解除を適用しました");
            } catch (fallbackError) {
                // 最終的なフォールバック: マスキングされたままの内容を表示
                document.getElementById('shareContent').value = generatedComment;
                console.error('フェールバック処理にも失敗しました:', fallbackError);
            }
        }
    });
}

// 関数をグローバルにエクスポート
window.setupUnmaskButton = setupUnmaskButton;
window.unmaskCSV = unmaskCSV;
window.unmaskNamesInComments = unmaskNamesInComments;