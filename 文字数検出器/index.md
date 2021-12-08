# 文字数検出器
システムが検出している文字数チェックロジックとは異なるので、多くても1900文字ぐらいを目安に使ってください。
<br />このプログラムはデータを取ってどこかに送っていません。
<br />[ソースコード](https://github.com/shimajima-eiji/Hosting2/blob/main/%E6%96%87%E5%AD%97%E6%95%B0%E6%A4%9C%E5%87%BA%E5%99%A8/index.md)

入力した文字数：<input id="view" disabled="disabled" />

## ここに文字を貼ってください
<textarea id="words" onkeydown="count()" onkeyup="count()" rows="20" cols="100"></textarea>

<script>
  const view = document.getElementById( "view" );
  const obj = document.getElementById( "words" );

  let count = () =>
  {
    view.value = obj.value.length;
  }
</script>
