/**
 * ゲーム内日付処理
 */
const __timer = () => {
    if (Params.day == 31) {
        Params.day = 0;

        if (Params.month == 12) {
            Params.month = 0;

            Params.year++;
        }
        Params.month++;

    }
    Params.day++;

    // 日付を画面に反映
    // 【TODO】画面に表示させる場合は、以下を必要な場所にコピペしていい感じにやってください
    Params_ids.year.innerHTML = Params.year;
    Params_ids.month.innerHTML = Params.month;
    Params_ids.day.innerHTML = Params.day;
}

const __produce = () => {
    Params.cookie = Params.cookie + Params.people;
    Params_ids.cookie.innerHTML = Params.cookie;
}

/**
 * システム関連を定義
 */
const Modules = {
    id: (id) => document.getElementById(id),
    day: __timer,
    cookie: __produce,
},
    // マジックナンバーなど
    System = {
        time_step: -1,
        max_time_step: 3,
        time_sec: 100,
    },
    // 出力以外のイベントハンドラを含む要素
    System_ids = {
        add_cookie: "add_cookie",
        add_people: "add_people",
        add_10people: "add_10people",
        message: "message",
        start: "start",
        stop: "stop",
        boost: "boost",
        debug: "debug",
    },
    // 画面に出力するものをHTMLとJSの紐づけ。後でオブジェクト化するのでここではID名のみで良い
    Params_ids = {
        year: "year",
        month: "month",
        day: "day",
        cookie: "cookie",
        people: "people",
    },
    // keysと同じキーを持つパラメータ管理オブジェクト 
    //            
    Params = {}
    ;

/**
 * 初期化
 */
// params_idsをすべてオブジェクトに変換
Object.entries(System_ids).forEach((i) => System_ids[i[0]] = Modules.id(i[1]));
Object.entries(Params_ids).forEach((i) => Params_ids[i[0]] = Modules.id(i[1]));

// リセットボタンなど後で使う可能性があるものを集約
const Initialize = () => {
    Object.keys(Params_ids).forEach((id) => Params[id] =
        (Modules.id(id))
            // innerHTMLで取得した場合は文字列として処理されるため、parseIntで数値にする
            ? parseInt(Modules.id(id).innerHTML)
            : 0
    );
    System_ids.add_cookie.disabled = "";
    System_ids.add_people.disabled = "";
    System_ids.add_10people.disabled = "";
}

/**
 * ボタン設定
 */
System_ids.debug.addEventListener("click", () => {
    // 【TODO】機能が正しく動くまではここに機能を追加していくとデバッグしやすいです
    // うまく動いたら必要な部分に組み込んで次の開発を進めていきましょう。
    console.log("デバッグ");
});

System_ids.add_cookie.addEventListener("click", () => {
    console.log("クッキー")

    Params.cookie++;
    // 出力
    Params_ids.cookie.innerHTML = Params.cookie;
});

System_ids.add_people.addEventListener("click", () => {
    console.log("人を雇う")
    let need = 10;

    if (Params.cookie < need) return __message("クッキーが足りない！");

    Params.people++;
    Params.cookie -= need;

    // 出力
    Params_ids.people.innerHTML = Params.people;
    Params_ids.cookie.innerHTML = Params.cookie;
});

System_ids.add_10people.addEventListener("click", () => {
    console.log("10人雇う")
    let need = 100;

    if (Params.cookie < need) return __message("クッキーが足りない！");

    Params.people += 10;
    Params.cookie -= need;

    // 出力
    Params_ids.people.innerHTML = Params.people;
    Params_ids.cookie.innerHTML = Params.cookie;
});

// サンプル：スタートボタンの実装
System_ids.start.addEventListener("click", () => {
    // 前回押したボタンがスタートボタンの時は処理しない
    if (System.time_step == 1) return;

    // 一番最初のスタートボタンの時だけ実行
    if (System.time_step == -1) Initialize();

    __timer_common("スタート", 1);
    System_ids.start.innerHTML = "＞";  // これは意味ないです。趣味

});

// サンプル：ストップボタンの実装
System_ids.stop.addEventListener("click", () => __timer_common("一時停止", 0));

// サンプル：ブーストボタンの実装
System_ids.boost.addEventListener("click", () => {
    // 間違えてブーストすると制御不能なぐらい早くなるので、一応上限を設定しておきます
    if (System.time_step > System.max_time_step) return;

    __timer_common("ブースト", (System.time_step == 0) ? 3 : System.time_step + 2);
});

let __timer_common = (log, time_step) => {
    console.log(log);

    // 進行速度を更新
    System.time_step = time_step;

    // ブースト状態を初期化するため、開始時もいったんストップして再開するように実行
    clearInterval(System.timer);

    // スタートボタン・ブーストボタンの時だけゲームを進行する
    if (0 < time_step)
        System.timer = setInterval(interval_1s, System.time_sec / time_step);
}

let __message = (message) => System_ids.message.innerHTML = message;
/**
 * ゲームロジック
 */
let interval_1s = () => {
    Modules.day();
    Modules.cookie();
}

