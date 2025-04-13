// コピーボタンの処理

document.getElementById('copyButton').addEventListener('click', function() {
    const shareContent = document.getElementById('shareContent');
    
    try {
        shareContent.select();
        document.execCommand('copy');
        alert('クリップボードにコピーしました');
    } catch (error) {
        console.error('コピー処理でエラーが発生しました:', error);
        alert('クリップボードへのコピーに失敗しました。手動でコピーしてください。');
    }
});