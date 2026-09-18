---
name: review-check
description: レビュー観点で develop との差分と未コミット差分を確認
disable-model-invocation: true
---
## 変更ファイル（未追跡を含む）
!`git status --short`

## 差分（develop からのコミット済み分）
!`git diff develop...HEAD --stat -- frontend/src backend infra .github docker-compose.yml README.md && git diff develop...HEAD -- frontend/src backend infra .github docker-compose.yml README.md`

## 差分（未コミット分）
!`git diff HEAD --stat -- frontend/src backend infra .github docker-compose.yml README.md && git diff HEAD -- frontend/src backend infra .github docker-compose.yml README.md`

## 指示
- 差分も未追跡ファイルも無ければ「差分なし」とだけ答えて止める。未追跡ファイルがあれば中身を読んで対象に含める。
- CLAUDE.md の「レビュー観点」の番号順（＝重要度順）で確認する。
- 指摘は重要度順に、観点番号・ファイル名・行番号・理由を1件ずつ示す。
- 問題のない観点は列挙しない。
- ファイルは変更しない。
