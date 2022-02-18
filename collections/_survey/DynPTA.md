---
title: DynPTA[SP'21]
date: 2021-12-06
---

# DynPTA: Combining Static and Dynamic Analysis for Practical Selective Data Protection [SP'21]

github: <https://github.com/taptipalit/dynpta>

## 調査の目的

- 選択的データ保護のやり方

## 概要

- 問題
  - データ漏洩，Transient Execution Attack(Spectre攻撃など)の脅威は強まっている．
  - 既存の保護手法は
    - コードを大きく変更する必要がある
    - 大きなアプリに対してスケールしない
- 困難: scalability + データ漏洩への保護の両立
- 提案手法
  - ポインタ解析と動的data-flow tracking(DFT)を組み合わせてsensitiveデータを推論
  - sensitiveデータの暗号化によってデータ漏洩の被害を抑える
- 実験結果
  - リアル検体に対して
    - Heartbleedによるデータ漏洩を検知
    - Spectre攻撃によるデータ漏洩を検知
  - Runtime overhead: <= 19.2%

## 背景: Pointer Analysis

- 有名なポインタ解析
  - Andersen: O(n^3)
  - Steengard: O(n)
- 巨大なプログラムに対して，Andersenですら適用できない場合がある．
  - Nginx: 11 hours
  - Chromium browser: ran out of memory after running four days
- Andersen vs. Steengard
  - Andersen: inclusion-based
    - 要素を一個一個追加していく
  - Steengard: unification-based
    - 集合の和を取る  

![](img/andersen_vs_steengard.drawio.svg)

## 手法

- 静的解析
  - sensitiveデータの特定
    - Annotation
  - sensitiveデータへのアクセス命令の特定
    - Steengardポインタ解析
    - Value-Flow解析
  - <details>
      <summary>malloc-wrapper関数の特定</summary>
        <ul>
          <li>`return ptr`である関数に対して，mallocなどで新しく確保されるobjectが返されているのかを判定</li>
          <li>context-sensitive heap modelingと謳っているが，Summaryを使った部分的context-sensitivity</li>
          <li>`1: a = mem_alloc();`と`2: b = mem_alloc();`をSummaryから別々のobjectが確保されたと判別できる</li>
        </ul>
      </details>
  - scalableだが，coarseな解析
- 動的解析
  - sensitiveデータの暗号化・復号
    - 静的解析でsensitiveデータへアクセスするかもしれない命令に対して
      - 書き込み: 暗号化して書き込み
      - 読み込み: 復号して読み込み
  - coarseな静的解析によって絞られた一部の(scoped)命令に対してのみ，確認・暗号処理を行う

以下のコードにおいて，`priv_key`を保護する流れを追う．
```c
char* ptr;

char* priv_key = malloc_wrapper(8);
// calculate priv_key
ptr = priv_key;
...

char* pub_key = malloc_wrapper(8);
// calculate pub_key
ptr = pub_key;
...
```

### 静的解析

1. プログラマがsensitiveデータにannotationをつける
    - `priv_key`にannotate
2. malloc-wrapper関数の候補を見つけ，Intra-proceduralポインタ解析により特定する
    - `malloc_wrapper()`
3. Steengardポインタ解析により，sensitiveデータを指しうるポインタを求める
    - malloc-wrapper関数においては，異なる呼び出しでは異なるobjectを確保すると解析する(context-sensitive heap modeling)
    - 例では，{`ptr`, `priv_key`, `pub_key`}がsensitiveデータ`o1`を指す
```c
char* ptr;

char* priv_key = malloc_wrapper(8); // o1
mark_sensitive(priv_key);
// calculate priv_key
ptr = priv_key;
...

char* pub_key = malloc_wrapper(8);  // o2
// calculate pub_key
ptr = pub_key;
...
```
4. Value-Flow解析により，sensitiveデータに関するValue-Flowをsoundに求める
5. Potential sensitive instruction(sensitiveデータにアクセスしうる命令)にメタデータを付け，実行時の目印とする
    - 例では，全命令が該当

まとめ: 
- sensitiveデータを特定
- Potential sensitive instructionsを特定

### 動的解析部分 Dynamic Flow Tracking(DFT)

6. Shadow memoryを用意し，annotationの付いたsensitiveデータに対してShadow memoryの該当箇所に印(taint)をつける

![](img/taint_priv_key.drawio.svg)

7. Potential sensitive instructionに対して，以下の処理を行う:
    - Load: Shadow memoryにtaintが付いている場合，読み込むデータにtaintを付け，**復号**
      - データの復号
    - Store: taintが付いているデータを書き込む場合，Shadow memoryにtaintを付け，**暗号化**して書き込む
      - データの暗号化
    - Others: (top-variableに対して) taintの伝播処理を行う
      - テイントの伝搬

例では，
- `o1`はテイントされ，暗号化される
- `o2`はテイントされず，保護されない
```c
char* ptr;

char* priv_key = malloc_wrapper(8); // o1
mark_sensitive(priv_key);
// calculate priv_key
ptr = priv_key;
...

char* pub_key = malloc_wrapper(8);  // o2
// calculate pub_key
ptr = pub_key;
...
```

まとめ:
- Potential sensitive instructionが本当にsensitiveデータにアクセスするかをチェック
- sensitiveデータは**暗号化**してメモリに置く

## 実験結果

<!-- 
- 静的解析
  - 解析・計装時間
    - Nginx + OpenSSL: 50.6 min (Andersen: 11 hours)
    - OpenVPN: 59.1 min
  - scoped DFTによって新たに追加された命令数
    - <= 9.88%
  - 保護されているメモリアクセス命令
    - <= 16.62%
- 動的解析
  - メモリアクセスの割合
    - Nginx
      - Shadow memoryのlabel lookupなし: 76%
      - label lookupあり: 24%
        - 実際にAES operationが実行された: 4%
  - Runtime overhead
    - Nginx: + 17.92%
    - Httpd: + 1.86%
    - Lighttpd: + 1.87%
  - Sensitive Dataの数を増やすと，runtime overheadも大きくなる
-->
- パフォーマンス評価

| Application | Protected Data | KLOC | Bitcode Size | DynPTA Compilation | Runtime Overhead |
| ---         | ---            | ---  | ---          | ---                | ---              |
| Nginx + OpenSSL | Private key | 389 | 8M | 50.6 min | + 17.92% |
| Httpd | Password | 179 | 3.7M | 11.0 min | + 1.86% |
| Lighttpd + ModAuth | Password | 83 | 1.9M | 2.8 min | + 1.87% | 
| MbedTLS server | Private Key | 54 | 726K | 1.3 min | + 4.08% |
| OpenVPN | Private Key | 329 | 3.5M | 59.1 min | + 9.81% |
| Memcached + Auth | Password | 71 | 1.1M | 1.0 min | + 0.32% |
| ssh-agent | Private Key | 52 | 640K | 1.3 min | + 3.15% |
| Minisign | Private Key | 45 | 1.2M | 37 sec | + 22.02% |

- 保護能力評価
  - Heartbleed: data leakageを全て防げた
  - Spectre: data leakageを全て防げた

## 自分の研究との関連

- 選択的データ保護
  - 保護すべきデータは異なる
    - データ漏洩: データがどこへ流れるか(テイント解析)
    - integrity: データへ影響を与えるか(制御/データ依存解析)
  - 動的テイント解析により，本当に保護すべきデータかどうかを判定するやり方は参考になる
- 暗号化によるデータ保護
  - Transient execution attack(Spectre攻撃)に対する保護として有効

<!--
## 議論

- Annotationベースでの保護手法において考慮すべき点が明確化
- 暗号化部分を置き換えることで，様々なデータ保護に応用できそう
  - フローチェックに置き換えれば統合可能（？）

- sensitiveデータの特定
  - Pros: Annotationを付ければ自由に保護対象を選べる，簡単
  - Cons: 自動で保護対象を求められない
- 保護手法
  - Pros: メモリ上に置く場合，暗号化するためdata leakageに強い
  - Cons: data integrity(上書きの検知)ができない，modularityがなくsensitiveデータを他のライブラリに渡す場合，事前に復号して渡さなければならないためそこのメモリがリークしたら無力
- HMAC(Hash-based Message Authentication Code)などの別の暗号方式を用いてdata integrityも保証できそう（？）
-->