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

        const dx = e.clientX - this.#currentX;
        const dy = e.clientY - this.#currentY;

        this.#elements.body.style.width = `${this.#initialWidth + dx}px`;
        this.#elements.body.style.height = `${this.#initialHeight + dy}px`;
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
    new ChatApp();
    new FontSizeController();
});
