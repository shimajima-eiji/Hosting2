# Hosting2
Hostingリポジトリを汚染しすぎたのでクリーンな環境構築。ブランチはルート直下で管理する。GASのコードはGASリポジトリでブランチ管理する

## GitHub PagesのJekyllプレビュー
[公式でサポートしているテーマ: ](https://pages.github.com/themes/)https://pages.github.com/themes/)https://pages.github.com/themes/ を集約

- [no-theme](https://shimajima-eiji.github.io/Hosting2)
- [Architect](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Architect/)
- [Cayman](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Cayman/)
- [Dinky](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Dinky/)
- [Hacker](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Hacker/)
- [Leap day](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Leap-day/)
- [Merlot](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Merlot/)
- [Midnight](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Midnight/)
- [Minima（チートシート有）](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Minima/)
- [Minimal](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Minimal/)
- [Modernist](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Modernist/)
- [Slate](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Slate/)
- [Tactile](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Tactile/)
- [Time machine](https://shimajima-eiji.github.io/Hosting_demo_jekyll_Time-machine/)

# チートシート
GitHubのREADME.mdでのプレビューの結果と異なる点に注目しよう。
<br>
テーブル記法や絵文字表記あたりが怪しい。

## プレビュー

# 見出し１
## 見出し２
### 見出し３
#### 見出し４
##### 見出し５
###### 見出し６
####### 見出し７

### 文字の装飾
- *B*: **太字**
- *I*: *斜体*
- <ins>U:<-ins>: <ins>下線</ins>（コード不明のため、`ins`タグを使用）
- ~~S~~: ~~取り消し線~~
- `コード`

```
コードブロック
```

> 引用

## リスト
1. 番号１
1. 番号１
  1. 番号２
  1. 番号２
1. 番号１

- 箇条書き１
- 箇条書き１
  - 箇条書き２
  - 箇条書き２
- 箇条書き１

- 複合系
  1. 複合系
  1. 複合系
- 複合系
1. 複合系
  - 複合系
  - 複合系
1. 複合系

### その他
X<sub>2</sub>: 下付き文字（コード不明のため、`sub`タグを使用）
<br>
X<sup>2</sup>: 上付き文字（コード不明のため、`sup`タグを使用）

[リンク文字（参考になりそうな外部サイト）](https://jhildenbiddle.github.io/docsify-themeable/#/markdown)
<br>
![画像](https://images.microcms-assets.io/assets/69ca4200121741d4a1cba225a5bba51a/7c522bebaa0e4be7be33b5f12fcc2cc0/blog-template-description1.png)

- [ ] チェックボックス
- [x] チェックボックス

### 水平線
---

### テーブル
| standard | left | center | right |
| --- | :--- | :---: | ---: |
| 標準 | 左寄せ | 中央 | 右 |

\:kissing_closed_eyes: 絵文字

## ソース
```
# 見出し１
## 見出し２
### 見出し３
#### 見出し４
##### 見出し５
###### 見出し６
####### 見出し７

### 文字の装飾
- *B*: **太字**
- *I*: *斜体*
- <ins>U:<-ins>: <ins>下線</ins>（コード不明のため、`ins`タグを使用）
- ~~S~~: ~~取り消し線~~
- `コード`

\`\`\`
コードブロック
\`\`\`

> 引用

## リスト
1. 番号１
1. 番号１
  1. 番号２
  1. 番号２
1. 番号１

- 箇条書き１
- 箇条書き１
  - 箇条書き２
  - 箇条書き２
- 箇条書き１

- 複合系
  1. 複合系
  1. 複合系
- 複合系
1. 複合系
  - 複合系
  - 複合系
1. 複合系

### その他
X<sub>2</sub>: 下付き文字（コード不明のため、`sub`タグを使用）
<br>
X<sup>2</sup>: 上付き文字（コード不明のため、`sup`タグを使用）

[リンク文字（参考になりそうな外部サイト）](https://jhildenbiddle.github.io/docsify-themeable/#/markdown)
<br>
![画像](https://images.microcms-assets.io/assets/69ca4200121741d4a1cba225a5bba51a/7c522bebaa0e4be7be33b5f12fcc2cc0/blog-template-description1.png)

- [ ] チェックボックス
- [x] チェックボックス

### 水平線
---

### テーブル
| standard | left | center | right |
| --- | :--- | :---: | ---: |
| 標準 | 左寄せ | 中央 | 右 |

\:kissing_closed_eyes: 絵文字
```
