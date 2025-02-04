document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    let messages = [];

    // メッセージを読み込む
    chrome.storage.local.get(['messages'], (result) => {
        if (result.messages) {
            messages = result.messages;
            renderMessages();
        }
    });

    // メッセージを保存する関数
    function saveMessages() {
        chrome.storage.local.set({ messages: messages }, () => {
            console.log('メッセージが保存されました');
        });
    }

    // メッセージを表示する関数
    function renderMessages() {
        chatContainer.innerHTML = '';
        messages.forEach((msg, index) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';

            // メッセージテキストの div
            const textDiv = document.createElement('div');
            textDiv.textContent = msg.text;

            // URL を検出して QR コードを生成
            const urls = extractUrls(msg.text);
            const qrContainer = document.createElement('div');
            qrContainer.className = 'qr-codes';

            if (urls.length > 0) {
                urls.forEach(url => {
                    const qrWrapper = document.createElement('div');
                    qrWrapper.className = 'qr-wrapper';

                    // URL 表示
                    const urlText = document.createElement('div');
                    urlText.className = 'url-text';
                    urlText.textContent = url;
                    qrWrapper.appendChild(urlText);

                    // QR コード生成用の div
                    const qrElement = document.createElement('div');
                    qrElement.className = 'qr-code';
                    qrWrapper.appendChild(qrElement);

                    // QR コード生成
                    new QRCode(qrElement, {
                        text: url,
                        width: 128,
                        height: 128,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });

                    qrContainer.appendChild(qrWrapper);
                });
            }

            // アクション部分
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'actions';
            actionsDiv.innerHTML = `
            <a href="#" class="edit" data-id="${index}">編集</a> | 
            <a href="#" class="delete" data-id="${index}">削除</a>
        `;

            messageElement.appendChild(textDiv);
            messageElement.appendChild(qrContainer);
            messageElement.appendChild(actionsDiv);

            chatContainer.appendChild(messageElement);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // URL 抽出用の新しい関数を追加
    function extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    // メッセージを追加する関数
    function addMessage(text) {
        messages.push({ text: text, timestamp: new Date().getTime() });
        saveMessages();
        renderMessages();
    }

    // 送信ボタンのクリックイベント
    sendButton.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (text) {
            addMessage(text);
            messageInput.value = '';
        }
    });

    // Enterキーでの送信
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // 編集と削除の機能
    chatContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit')) {
            const id = e.target.getAttribute('data-id');
            const newText = prompt('メッセージを編集', messages[id].text);
            if (newText !== null) {
                messages[id].text = newText;
                saveMessages();
                renderMessages();
            }
        } else if (e.target.classList.contains('delete')) {
            const id = e.target.getAttribute('data-id');
            if (confirm('このメッセージを削除しますか？')) {
                messages.splice(id, 1);
                saveMessages();
                renderMessages();
            }
        }
    });
});
