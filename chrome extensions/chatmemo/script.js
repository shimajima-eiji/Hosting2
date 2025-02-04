/**
 * 会議メモアーカイブ
 * オンラインミーティングのチャットメッセージを管理するアプリケーション
 */
class ChatArchiver {
    constructor() {
        this.messages = [];
        this.editingIndex = null;
        this.elements = {};
        this.initializeElements();
        this.attachEventListeners();
        this.loadMessages();
    }

    /**
     * DOM要素の初期化
     */
    initializeElements() {
        this.elements = {
            chatContainer: document.getElementById('chat-container'),
            messageInput: document.getElementById('message-input'),
            sendButton: document.getElementById('send-button')
        };
    }

    /**
     * イベントリスナーの設定
     */
    attachEventListeners() {
        // 送信関連
        this.elements.sendButton.addEventListener('click', () => this.handleSubmit());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSubmit();
        });

        // 編集キャンセル
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editingIndex !== null) {
                this.cancelEdit();
            }
        });

        // メッセージアクション（編集・削除）
        this.elements.chatContainer.addEventListener('click', (e) => this.handleMessageActions(e));
    }

    /**
     * メッセージの読み込み
     */
    async loadMessages() {
        const result = await chrome.storage.local.get(['messages']);
        if (result.messages) {
            this.messages = result.messages;
            this.renderMessages();
        }
    }

    /**
     * メッセージの保存
     */
    async saveMessages() {
        await chrome.storage.local.set({ messages: this.messages });
        console.log('Messages saved:', this.messages);
    }

    /**
     * メッセージの送信/更新処理
     */
    async handleSubmit() {
        const text = this.elements.messageInput.value.trim();
        if (!text) return;

        if (this.editingIndex !== null) {
            this.messages[this.editingIndex].text = text;
            this.editingIndex = null;
            this.elements.sendButton.textContent = '送信';
        } else {
            this.messages.push({
                text: text,
                timestamp: Date.now()
            });
        }

        this.elements.messageInput.value = '';
        await this.saveMessages();
        this.renderMessages();
    }

    /**
     * 編集のキャンセル
     */
    cancelEdit() {
        this.editingIndex = null;
        this.elements.messageInput.value = '';
        this.elements.sendButton.textContent = '送信';
    }

    /**
     * メッセージアクションの処理
     */
    handleMessageActions(e) {
        const target = e.target;
        if (!target.dataset.index) return;

        const index = parseInt(target.dataset.index);

        if (target.classList.contains('edit-btn')) {
            this.startEdit(index);
        } else if (target.classList.contains('delete-btn')) {
            this.handleDelete(target, index);
        }
    }

    /**
     * 編集モードの開始
     */
    startEdit(index) {
        this.editingIndex = index;
        this.elements.messageInput.value = this.messages[index].text;
        this.elements.messageInput.focus();
        this.elements.sendButton.textContent = '更新';
    }

    /**
     * 削除処理
     */
    async handleDelete(button, index) {
        if (button.classList.contains('delete-confirm')) {
            this.messages.splice(index, 1);
            await this.saveMessages();
            this.renderMessages();
        } else {
            button.classList.add('delete-confirm');
            button.textContent = '削除を確定';

            setTimeout(() => {
                if (button.classList.contains('delete-confirm')) {
                    button.classList.remove('delete-confirm');
                    button.textContent = '削除';
                }
            }, 5000);
        }
    }

    /**
     * URLの抽出
     */
    extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    /**
     * QRコード要素の作成
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
     * QRコードの描画
     */
    renderQRCodes() {
        const qrElements = document.querySelectorAll('.qr-code');
        qrElements.forEach(element => {
            if (element.children.length > 0) return;

            new QRCode(element, {
                text: element.dataset.url,
                width: 128,
                height: 128
            });
        });
    }

    /**
     * メッセージの描画
     */
    renderMessages() {
        this.elements.chatContainer.innerHTML = this.messages.map((msg, index) => {
            const urls = this.extractUrls(msg.text);
            return `
                <div class="message">
                    <div class="message-content">${msg.text}</div>
                    ${this.createQRCodeElements(urls)}
                    <div class="actions">
                        <button class="edit-btn" data-index="${index}">編集</button>
                        <button class="delete-btn" data-index="${index}">削除</button>
                    </div>
                </div>
            `;
        }).join('');

        this.renderQRCodes();
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
    new ChatArchiver();
    new FontSizeController();
});
