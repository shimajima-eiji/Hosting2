/**
 * メモアプリケーションのメイン機能を制御するスクリプト
 * @module ChatMemoApp
 */

class ChatApp {
    /** @type {Array<{text: string, timestamp: number}>} */
    #messages = [];
    #elements = {};

    constructor() {
        this.initializeElements();
        this.loadMessages();
        this.attachEventListeners();
    }

    /**
     * DOM要素の初期化
     */
    initializeElements() {
        this.#elements = {
            chatContainer: document.getElementById('chat-container'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button')
        };
    }

    /**
     * メッセージの読み込み
     */
    async loadMessages() {
        const result = await chrome.storage.local.get(['messages']);
        if (result.messages) {
            this.#messages = result.messages;
            this.renderMessages();
        }
    }

    /**
     * イベントリスナーの設定
     */
    attachEventListeners() {
        this.#elements.sendButton.addEventListener('click', () => this.handleSend());
        this.#elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
        this.#elements.chatContainer.addEventListener('click', (e) => this.handleMessageActions(e));
    }

    /**
     * 送信処理
     */
    handleSend() {
        const text = this.#elements.messageInput.value.trim();
        if (text) {
            this.addMessage(text);
            this.#elements.messageInput.value = '';
        }
    }

    /**
     * メッセージアクションの処理
     * @param {Event} e - イベントオブジェクト
     */
    handleMessageActions(e) {
        const target = e.target;
        if (!target.classList.contains('edit') && !target.classList.contains('delete')) return;

        e.stopPropagation(); // イベントの伝播を停止
        const id = target.getAttribute('data-id');
        if (target.classList.contains('edit')) {
            this.editMessage(id);
        } else {
            this.deleteMessage(id);
        }
    }

    /**
     * メッセージの編集
     * @param {string} id - メッセージID
     */
    editMessage(id) {
        const newText = prompt('メッセージを編集', this.#messages[id].text);
        if (newText !== null) {
            this.#messages[id].text = newText;
            this.saveAndRender();
        }
    }

    /**
     * メッセージの削除
     * @param {string} id - メッセージID
     */
    deleteMessage(id) {
        if (confirm('このメッセージを削除しますか？')) {
            this.#messages.splice(id, 1);
            this.saveAndRender();
        }
    }

    /**
     * メッセージの保存と再描画
     */
    saveAndRender() {
        this.saveMessages();
        this.renderMessages();
    }

    /**
     * メッセージの保存
     */
    async saveMessages() {
        await chrome.storage.local.set({ messages: this.#messages });
    }

    /**
     * メッセージの追加
     * @param {string} text - メッセージテキスト
     */
    addMessage(text) {
        this.#messages.push({
            text,
            timestamp: Date.now()
        });
        this.saveAndRender();
    }

    /**
     * メッセージの描画
     */
    renderMessages() {
        const messageElements = this.#messages.map((msg, id) => this.createMessageElement(msg, id));
        this.#elements.chatContainer.innerHTML = messageElements.join('');
        this.renderQRCodes();
    }

    /**
     * メッセージ要素の作成
     * @param {Object} msg - メッセージオブジェクト
     * @param {number} id - メッセージID
     * @returns {string} HTML文字列
     */
    createMessageElement(msg, id) {
        const urls = this.extractUrls(msg.text);
        let messageHtml = `
            <div class="message">
                <div>${msg.text}</div>
                ${this.createQRCodeElements(urls)}
                <div class="actions">
                    <span class="edit" data-id="${id}">編集</span> |
                    <span class="delete" data-id="${id}">削除</span>
                </div>
            </div>
        `;
        return messageHtml;
    }

    /**
     * URLからQRコード要素を作成
     * @param {string[]} urls - URL配列
     * @returns {string} HTML文字列
     */
    createQRCodeElements(urls) {
        if (urls.length === 0) return '';

        return `
            <div class="qr-codes">
                ${urls.map(url => `
                    <div class="qr-wrapper">
                        <div class="url-text">${url}</div>
                        <div class="qr-code" data-url="${url}"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * テキストからURLを抽出
     * @param {string} text - 対象テキスト
     * @returns {string[]} URL配列
     */
    extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    /**
     * QRコードの描画
     */
    renderQRCodes() {
        const qrElements = document.querySelectorAll('.qr-code');
        qrElements.forEach(element => {
            new QRCode(element, {
                text: element.dataset.url,
                width: 128,
                height: 128
            });
        });
    }
}

/**
 * フォントサイズ制御クラス
 */
class FontSizeController {
    #elements = {};
    #isResizing = false;
    #currentX = 0;
    #currentY = 0;
    #initialWidth = 0;
    #initialHeight = 0;

    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadFontSize();
    }

    /**
     * DOM要素の初期化
     */
    initializeElements() {
        this.#elements = {
            body: document.body,
            fontDecrease: document.getElementById('font-decrease'),
            fontIncrease: document.getElementById('font-increase'),
            fontSizeDisplay: document.getElementById('font-size-display'),
            resizeHandle: document.getElementById('resize-handle')
        };
    }

    /**
     * イベントリスナーの設定
     */
    attachEventListeners() {
        this.#elements.fontDecrease.addEventListener('click', () => this.adjustFontSize(-10));
        this.#elements.fontIncrease.addEventListener('click', () => this.adjustFontSize(10));
        this.#elements.resizeHandle.addEventListener('mousedown', (e) => this.initResize(e));
        document.addEventListener('mousemove', (e) => this.resize(e));
        document.addEventListener('mouseup', () => this.stopResize());
    }

    /**
     * フォントサイズの読み込み
     */
    async loadFontSize() {
        const result = await chrome.storage.local.get(['fontSize']);
        if (result.fontSize) {
            this.updateFontSize(result.fontSize);
        }
    }

    /**
     * フォントサイズの調整
     * @param {number} delta - 変更量
     */
    adjustFontSize(delta) {
        const currentSize = this.getCurrentSize();
        const newSize = Math.max(50, Math.min(200, currentSize + delta));
        this.updateFontSize(newSize);
        this.saveFontSize(newSize);
    }

    /**
     * 現在のフォントサイズを取得
     * @returns {number} フォントサイズ
     */
    getCurrentSize() {
        const currentSize = this.#elements.body.style.fontSize || '100%';
        return parseInt(currentSize);
    }

    /**
     * フォントサイズの更新
     * @param {number} percent - フォントサイズ（%）
     */
    updateFontSize(percent) {
        this.#elements.body.style.fontSize = `${percent}%`;
        this.#elements.fontSizeDisplay.textContent = `${percent}%`;
    }

    /**
     * フォントサイズの保存
     * @param {number} size - フォントサイズ
     */
    async saveFontSize(size) {
        await chrome.storage.local.set({ fontSize: size });
    }

    /**
     * リサイズの開始
     * @param {MouseEvent} e - マウスイベント
     */
    initResize(e) {
        this.#isResizing = true;
        this.#currentX = e.clientX;
        this.#currentY = e.clientY;
        this.#initialWidth = this.#elements.body.offsetWidth;
        this.#initialHeight = this.#elements.body.offsetHeight;
    }

    /**
     * リサイズの実行
     * @param {MouseEvent} e - マウスイベント
     */
    resize(e) {
        if (!this.#isResizing) return;

        e.preventDefault(); // デフォルトの動作を防止
        const dx = e.clientX - this.#currentX;
        const dy = e.clientY - this.#currentY;

        // 最小サイズを設定
        const minWidth = 300;
        const minHeight = 400;

        const newWidth = Math.max(minWidth, this.#initialWidth + dx);
        const newHeight = Math.max(minHeight, this.#initialHeight + dy);

        this.#elements.body.style.width = `${newWidth}px`;
        this.#elements.body.style.height = `${newHeight}px`;
    }

    /**
     * リサイズの終了
     */
    stopResize() {
        this.#isResizing = false;
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    // メッセージ配列と編集状態の初期化
    let messages = [];
    let editingIndex = null;

    // 保存されたメッセージの読み込み
    chrome.storage.local.get(['messages'], (result) => {
        if (result.messages) {
            messages = result.messages;
            renderMessages();
        }
    });

    // メッセージの保存
    function saveMessages() {
        chrome.storage.local.set({ messages: messages }, () => {
            console.log('Messages saved:', messages);
        });
    }

    // URLの抽出
    function extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    // QRコード要素の作成
    function createQRCodeElements(urls) {
        if (urls.length === 0) return '';

        return `
            <div class="qr-codes">
                ${urls.map(url => `
                    <div class="qr-wrapper">
                        <div class="url-text">${url}</div>
                        <div class="qr-code" data-url="${url}"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // QRコードの描画
    function renderQRCodes() {
        const qrElements = document.querySelectorAll('.qr-code');
        qrElements.forEach(element => {
            // 既に描画済みの場合はスキップ
            if (element.children.length > 0) return;

            new QRCode(element, {
                text: element.dataset.url,
                width: 128,
                height: 128
            });
        });
    }

    // メッセージの表示
    function renderMessages() {
        console.log('Rendering messages:', messages);
        chatContainer.innerHTML = messages.map((msg, index) => {
            const urls = extractUrls(msg.text);
            return `
                <div class="message">
                    <div class="message-content">${msg.text}</div>
                    ${createQRCodeElements(urls)}
                    <div class="actions">
                        <button class="edit-btn" data-index="${index}">編集</button>
                        <button class="delete-btn" data-index="${index}">削除</button>
                    </div>
                </div>
            `;
        }).join('');

        // メッセージ描画後にQRコードを生成
        renderQRCodes();
    }

    // メッセージの送信/更新処理
    function handleSubmit() {
        const text = messageInput.value.trim();
        console.log('Submitting text:', text);

        if (text) {
            if (editingIndex !== null) {
                // 編集モード
                messages[editingIndex].text = text;
                editingIndex = null;
                sendButton.textContent = '送信';
            } else {
                // 新規送信
                messages.push({
                    text: text,
                    timestamp: Date.now()
                });
            }
            messageInput.value = '';
            saveMessages();
            renderMessages();
        }
    }

    // 送信ボタンのクリックイベント
    sendButton.addEventListener('click', () => {
        console.log('Send button clicked');
        handleSubmit();
    });

    // Enterキーでの送信
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed');
            handleSubmit();
        }
    });

    // 編集・削除ボタンのイベント処理
    chatContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.dataset.index) return;

        const index = parseInt(target.dataset.index);

        if (target.classList.contains('edit-btn')) {
            // 編集モード開始
            console.log('Edit button clicked for index:', index);
            editingIndex = index;
            messageInput.value = messages[index].text;
            messageInput.focus();
            sendButton.textContent = '更新';
        }
        else if (target.classList.contains('delete-btn')) {
            if (target.classList.contains('delete-confirm')) {
                // 削除実行
                console.log('Deleting message at index:', index);
                messages.splice(index, 1);
                saveMessages();
                renderMessages();
            } else {
                // 削除確認状態
                console.log('Delete confirmation for index:', index);
                target.classList.add('delete-confirm');
                target.textContent = '削除を確定';

                setTimeout(() => {
                    if (target.classList.contains('delete-confirm')) {
                        target.classList.remove('delete-confirm');
                        target.textContent = '削除';
                    }
                }, 5000);
            }
        }
    });

    // ESCキーでの編集キャンセル
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editingIndex !== null) {
            console.log('Edit cancelled');
            editingIndex = null;
            messageInput.value = '';
            sendButton.textContent = '送信';
        }
    });

    new ChatApp();
    new FontSizeController();
});
