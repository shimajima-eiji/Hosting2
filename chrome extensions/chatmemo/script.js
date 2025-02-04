/**
 * 会議メモアーカイブ
 * オンラインミーティングのチャットメッセージを管理するアプリケーション
 * 
 * @private {Message[]} #messages - メッセージ配列
 * @private {number|null} #editingIndex - 編集中メッセージのインデックス
 * @private {Object} #elements - DOM要素参照
 * @private {Storage} #storage - ストレージインターフェース
 * 
 * メッセージ型定義:
 * @typedef {Object} Message
 * @property {string} text - メッセージ本文
 * @property {number} timestamp - 作成時のタイムスタンプ
 * 
 * 状態遷移:
 * 1. 通常状態
 *    - メッセージ追加可能
 *    - 任意メッセージの編集開始可能
 *    - 任意メッセージの削除開始可能
 * 2. 編集状態
 *    - 特定メッセージの編集中
 *    - 他メッセージの操作は不可
 *    - ESCで編集キャンセル可能
 * 3. 削除確認状態
 *    - 5秒以内に確定が必要
 *    - タイムアウトで通常状態に戻る
 */
class ChatArchiver {
    /**
     * メッセージ管理の初期化
     * 
     * 初期化シーケンス:
     * 1. プライベート変数の初期化
     * 2. DOM要素の参照取得
     * 3. イベントリスナーの設定
     * 4. 保存データの読み込み
     */
    constructor() {
        /** @type {Array<{text: string, timestamp: number}>} メッセージの配列 */
        this.messages = [];
        /** @type {number|null} 現在編集中のメッセージのインデックス */
        this.editingIndex = null;
        /** @type {Object.<string, HTMLElement>} 主要なDOM要素を保持するオブジェクト */
        this.elements = {};

        this.initializeElements();
        this.attachEventListeners();
        this.loadMessages();
    }

    /**
     * DOM要素の初期化
     * アプリケーションで使用する主要なDOM要素を取得し、this.elementsに格納
     * 
     * 取得する要素：
     * - chatContainer: メッセージを表示するコンテナ
     * - messageInput: メッセージ入力フィールド
     * - sendButton: 送信/更新ボタン
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
     * ユーザーの操作に対する各種イベントハンドラを設定
     * 
     * 設定するイベント：
     * - 送信ボタンのクリック
     * - Enterキーでの送信
     * - ESCキーでの編集キャンセル
     * - メッセージアクション（編集・削除）のクリック
     */
    attachEventListeners() {
        // 送信関連のイベント
        this.elements.sendButton.addEventListener('click', () => this.handleSubmit());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSubmit();
        });

        // 編集キャンセルのイベント
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editingIndex !== null) {
                this.cancelEdit();
            }
        });

        // メッセージアクションのイベント（編集・削除）
        this.elements.chatContainer.addEventListener('click', (e) => this.handleMessageActions(e));
    }

    /**
     * メッセージの読み込み
     * chrome.storage.localから保存済みのメッセージを読み込む
     * 
     * 処理内容：
     * 1. ストレージからメッセージを取得
     * 2. メッセージが存在する場合、this.messagesに設定
     * 3. メッセージを画面に表示
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
     * 現在のメッセージ配列をchrome.storage.localに保存
     * 
     * @returns {Promise<void>} 保存処理の完了を示すPromise
     */
    async saveMessages() {
        await chrome.storage.local.set({ messages: this.messages });
        console.log('Messages saved:', this.messages);
    }

    /**
     * メッセージの送信/更新処理
     * 新規メッセージの送信または既存メッセージの更新を行う
     * 
     * 処理内容：
     * 1. 入力テキストの取得とトリム
     * 2. 編集モードの場合は既存メッセージを更新
     * 3. 新規モードの場合は新しいメッセージを追加
     * 4. 入力フィールドのクリア
     * 5. メッセージの保存と再描画
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
     * 編集モードを解除し、入力フィールドをクリアする
     */
    cancelEdit() {
        this.editingIndex = null;
        this.elements.messageInput.value = '';
        this.elements.sendButton.textContent = '送信';
    }

    /**
     * メッセージアクションの処理
     * 編集ボタンまたは削除ボタンがクリックされた際の処理
     * 
     * @param {MouseEvent} e クリックイベントオブジェクト
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
     * 指定されたインデックスのメッセージを編集モードにする
     * 
     * @param {number} index 編集対象のメッセージインデックス
     */
    startEdit(index) {
        this.editingIndex = index;
        this.elements.messageInput.value = this.messages[index].text;
        this.elements.messageInput.focus();
        this.elements.sendButton.textContent = '更新';
    }

    /**
     * 削除処理
     * メッセージの削除を2段階で確認して実行
     * 
     * @param {HTMLElement} button 削除ボタン要素
     * @param {number} index 削除対象のメッセージインデックス
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
     * テキスト内のURLを正規表現で抽出
     * 
     * @param {string} text 対象テキスト
     * @returns {string[]} 抽出されたURLの配列
     */
    extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    /**
     * QRコード要素の作成
     * 抽出されたURLに対応するQRコード要素のHTML文字列を生成
     * 
     * @param {string[]} urls URL配列
     * @returns {string} QRコード要素のHTML文字列
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
     * QRコードライブラリを使用して各URL要素にQRコードを生成
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
     * 全メッセージをHTML要素として描画し、QRコードを生成
     * 
     * 描画内容：
     * 1. メッセージテキスト
     * 2. URLが含まれる場合はQRコード
     * 3. 編集・削除ボタン
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
 * ウィンドウリサイズ制御クラス
 * 
 * 状態管理:
 * - リサイズ中フラグ
 * - 開始時のウィンドウサイズ
 * - 開始時のマウス座標
 * - 現在のマウス座標
 * 
 * イベントフロー:
 * 1. mousedown: リサイズ開始
 *    - 初期サイズと座標を記録
 *    - リサイズフラグをON
 * 2. mousemove: リサイズ処理
 *    - マウス移動量を計算
 *    - ウィンドウサイズを更新
 * 3. mouseup/mouseleave: リサイズ終了
 *    - リサイズフラグをOFF
 * 
 * 座標計算:
 * - X方向: 現在のX座標 - 開始時のX座標
 * - Y方向: 現在のY座標 - 開始時のY座標
 * - 新しいサイズ = 開始時のサイズ + 移動量
 * 
 * 主な機能：
 * - ドラッグによるウィンドウリサイズ
 * - リサイズ状態の管理
 * - 最小サイズの制限
 * 
 * 制約:
 * - 最小ウィンドウサイズの制限
 * - 画面外へのリサイズ制限
 * - リサイズ中のスムーズな描画
*/
class WindowResizer {
    /**
     * コンストラクタ
     * リサイズ機能の初期化を行う
     * 
     * @param {number} minWidth 最小ウィンドウ幅（px）
     * @param {number} minHeight 最小ウィンドウ高さ（px）
     */
    constructor(minWidth = 300, minHeight = 200) {
        /** @type {boolean} リサイズ中かどうか */
        this.isResizing = false;
        /** @type {number} 現在のX座標 */
        this.currentX = 0;
        /** @type {number} 現在のY座標 */
        this.currentY = 0;
        /** @type {number} 初期ウィンドウ幅 */
        this.initialWidth = 0;
        /** @type {number} 初期ウィンドウ高さ */
        this.initialHeight = 0;
        /** @type {number} 最小ウィンドウ幅 */
        this.minWidth = minWidth;
        /** @type {number} 最小ウィンドウ高さ */
        this.minHeight = minHeight;

        this.initializeResizer();
    }

    /**
     * リサイズ機能の初期化
     * リサイズハンドラの作成とイベントリスナーの設定を行う
     */
    initializeResizer() {
        // リサイズハンドラの作成
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        document.body.appendChild(resizer);

        // マウスダウンイベント
        resizer.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            this.currentX = e.clientX;
            this.currentY = e.clientY;
            this.initialWidth = window.innerWidth;
            this.initialHeight = window.innerHeight;
        });

        // マウスムーブイベント
        document.addEventListener('mousemove', (e) => {
            if (!this.isResizing) return;

            const deltaX = e.clientX - this.currentX;
            const deltaY = e.clientY - this.currentY;

            const newWidth = Math.max(this.initialWidth + deltaX, this.minWidth);
            const newHeight = Math.max(this.initialHeight + deltaY, this.minHeight);

            this.resizeWindow(newWidth, newHeight);
        });

        // マウスアップイベント
        document.addEventListener('mouseup', () => {
            this.isResizing = false;
        });

        // マウスリーブイベント
        document.addEventListener('mouseleave', () => {
            if (this.isResizing) {
                this.isResizing = false;
            }
        });
    }

    /**
     * ウィンドウのリサイズ
     * 指定されたサイズにウィンドウをリサイズする
     * 
     * @param {number} width 新しい幅（px）
     * @param {number} height 新しい高さ（px）
     */
    resizeWindow(width, height) {
        window.resizeTo(width, height);
    }
}

/**
 * フォントサイズ制御クラス
 * 
 * 状態管理:
 * - 現在のフォントサイズ（%）
 * - DOM要素参照（ボタン、表示）
 * - 前回保存値
 * 
 * サイズ制御:
 * - 有効範囲: 50%～200%
 * - 増減単位: 10%
 * - 即時反映: body要素のfont-size
 * 
 * イベントフロー:
 * 1. 増加ボタンクリック
 *    - 現在値+10%（最大200%まで）
 *    - UI更新と永続化
 * 2. 減少ボタンクリック
 *    - 現在値-10%（最小50%まで）
 *    - UI更新と永続化
 * 
 * 永続化処理:
 * - 保存: chrome.storage.local
 * - キー: fontSize
 * - 値: サイズのパーセント値
 * 
 * UI更新:
 * - フォントサイズの実際の適用
 * - 現在値の表示更新
 * - ボタンの有効/無効制御
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
    new WindowResizer();
});
