# Claude CodeでKiro-Style Spec-Driven Developmentを実現する

## 背景と動機

AIアシスタントを活用した開発において、「仕様駆動開発」は非常に重要な概念です。[Kiro](https://kiro.dev/)は、AIアシスタントを使った開発に特化したIDEで、その中核となるのが**Spec-Driven Development**です。

Kiroの開発チームは、AIアシスタントとの協働において以下の課題を特定しました：

1. **コンテキストの断絶** - セッション間でのプロジェクト理解の欠如
2. **一貫性の欠如** - 場当たり的な開発によるアーキテクチャの破綻
3. **進捗の不透明性** - 複雑な機能開発の進捗管理の困難

これらの課題を解決するため、Kiroは**3段階のワークフロー**を中心とした仕様駆動開発を提案しました：

1. **Requirements** - ユーザーストーリーと受入基準の定義
2. **Design** - 技術設計とアーキテクチャ図の作成
3. **Implementation** - 実装タスクの分解と進捗管理

## Claude Codeの可能性

[Claude Code](https://claude.ai/code)は、Anthropic社のClaude 4を活用したAIアシスタントCLIツールです。Kiroと同様にAIアシスタントとの協働を支援しますが、以下の独自機能を持っています：

### Hooks System
- **PostToolUse** - ツール実行後の自動化
- **PreToolUse** - ツール実行前の検証
- **PreCompact** - コンテキスト圧縮時の制御
- **Stop** - セッション終了時の処理

### Slash Commands
- **プロジェクト固有コマンド** - `.claude/commands/`での定義
- **動的コンテンツ** - bash実行とファイル参照の組み合わせ
- **引数サポート** - `$ARGUMENTS`での動的値渡し

## 実装アプローチ

### Phase 0: Steering System（基盤システム）

Kiroの核心は、プロジェクトの現状を理解する「Steering」システムです。これをClaude Codeで実現するため、以下を実装しました：

#### Steering Documents
```
.kiro/steering/
├── structure.md  # アーキテクチャとコード構成
├── tech.md       # 技術スタックと制約
└── product.md    # ビジネスコンテキスト
```

#### Steering Commands
- **`/steering-init`** - プロジェクト分析と基盤文書生成
- **`/steering-update`** - 変更に基づく文書更新

### Phase 1: Spec Workflow（仕様ワークフロー）

Kiroの3段階ワークフローを実現するため、以下のスラッシュコマンドを実装：

#### Spec Directory Structure
```
.kiro/specs/[feature-name]/
├── requirements.md  # 要件定義
├── design.md       # 技術設計
├── tasks.md        # 実装タスク
└── spec.json       # メタデータ
```

#### Spec Commands
- **`/spec-init [feature-name]`** - 新仕様の初期化
- **`/spec-requirements [feature-name]`** - 要件定義の生成
- **`/spec-design [feature-name]`** - 技術設計の作成
- **`/spec-tasks [feature-name]`** - 実装タスクの分解
- **`/spec-status [feature-name]`** - 進捗状況の表示

### Phase 2: Automation（自動化）

Claude Code Hooksを活用し、以下の自動化を実装：

#### PostToolUse Hooks
```python
# check-steering-drift.py
# ファイル変更時のsteering整合性チェック
# 重要な変更時にsteering更新を促す

# update-spec-progress.py  
# 仕様書修正時の進捗自動更新
# タスクチェックボックスの状態を監視
```

#### PreCompact Hooks
```python
# preserve-spec-context.py
# コンテキスト圧縮時の重要情報保持
# steering文書と仕様の状態を保護
```

## 技術的詳細

### 1. Slash Commands実装

Claude CodeのSlash Commandsは、Markdownファイルとして定義されます：

```markdown
---
description: Initialize project steering documents
allowed-tools: Bash, Read, Write, Glob, Grep
---

# Steering Initialization

## Project Analysis
- Current files: !`find . -name "*.py" | head -20`
- Documentation: @README.md

## Task
Generate three steering documents...
```

**特徴:**
- `!`prefix - bash実行結果の取り込み
- `@`prefix - ファイル内容の参照
- `$ARGUMENTS` - 動的引数の展開

### 2. Hook System実装

Hooksは、JSON形式で`.claude/settings.json`に定義：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/scripts/check-steering-drift.py",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**特徴:**
- **matcher** - 対象ツールの正規表現
- **timeout** - 実行時間制限
- **JSON I/O** - 構造化された入出力

### 3. Progress Tracking

仕様書の進捗は、以下の方法で自動追跡：

```python
# tasks.mdのチェックボックス監視
total_tasks = len(re.findall(r'- \[[xX ]\]', content))
completed_tasks = len(re.findall(r'- \[[xX]\]', content))

# spec.jsonの自動更新
spec_data['progress'] = {
  'requirements': 100,
  'design': 100, 
  'tasks': int((completed_tasks / total_tasks) * 100)
}
```

## 使用方法とワークフロー

### 1. 初期セットアップ
```bash
# プロジェクトの現状分析
/steering-init

# 基盤文書の生成確認
ls .kiro/steering/
```

### 2. 新機能開発
```bash
# 仕様の初期化
/spec-init user-authentication

# 要件定義の生成
/spec-requirements user-authentication

# 技術設計の作成
/spec-design user-authentication

# 実装タスクの分解
/spec-tasks user-authentication
```

### 3. 進捗管理
```bash
# 進捗状況の確認
/spec-status user-authentication

# Steering文書の更新
/steering-update
```

### 4. 実装フェーズ
- タスクのチェックボックス操作で自動進捗更新
- 重要な変更時にsteering更新の自動アラート
- コンテキスト圧縮時の重要情報保持

## 実装結果と成果

### 達成された機能

1. **Kiro互換の3段階ワークフロー** - Requirements → Design → Tasks → Implementation
2. **自動化された進捗追跡** - チェックボックス監視による自動更新
3. **コンテキスト保持** - セッション間でのプロジェクト理解維持
4. **整合性チェック** - steering文書とコードの自動整合性検証

### パフォーマンス指標

- **コマンド数**: 7つの専用スラッシュコマンド
- **自動化スクリプト**: 3つのPythonフック
- **Hook実行時間**: 平均5-10秒（タイムアウト設定済み）
- **コンテキスト保持率**: 手動テストで100%（steering + spec情報）

## 技術的課題と解決策

### 1. Hook実行のパフォーマンス

**課題**: 毎回のファイル保存でHook実行によるレスポンス遅延

**解決策**:
- タイムアウト設定（5-10秒）
- 重要な変更のみを対象とするフィルタリング
- 並列実行による効率化

### 2. コンテキスト保持の精度

**課題**: 大きなプロジェクトでの重要情報の特定

**解決策**:
- 構造化されたメタデータ（spec.json）
- 段階的なコンテキスト保持（steering → spec → tasks）
- 動的な重要度判定

### 3. ユーザビリティ

**課題**: 複雑なワークフローの学習コスト

**解決策**:
- 直感的なコマンド名（`/steering-init`, `/spec-status`）
- 包括的なCLAUDE.mdドキュメント
- 段階的な機能提供（Phase 0 → Phase 1 → Phase 2）

## 今後の展望

### 1. 機能拡張
- **テンプレート システム** - プロジェクト種別に応じた仕様テンプレート
- **依存関係管理** - 複数仕様間の依存関係追跡
- **メトリクス収集** - 開発効率の定量的分析

### 2. 統合強化
- **Git統合** - コミットメッセージとの仕様連携
- **CI/CD連携** - 自動テストとの仕様同期
- **ドキュメント生成** - 仕様からの自動ドキュメント生成

### 3. コミュニティ
- **オープンソース化** - コミュニティ貢献の促進
- **プラグインシステム** - 拡張可能なアーキテクチャ
- **ベストプラクティス** - 使用例とパターンの共有

## 結論

Claude CodeでKiro-style Spec-Driven Developmentを実現することで、以下の価値を提供できました：

1. **構造化された開発プロセス** - 体系的なAIアシスタント活用
2. **自動化による効率化** - 手動作業の大幅削減
3. **継続的なコンテキスト保持** - セッション間での一貫性維持
4. **拡張可能なアーキテクチャ** - 将来的な機能拡張への対応

この実装により、Claude CodeユーザーもKiroと同等の高度なSpec-Driven Developmentを活用できるようになりました。AIアシスタントとの協働において、仕様駆動開発は必須の手法となるでしょう。

---

*この実装はClaude Code v1.0時点での機能を基に開発されています。将来のバージョンでは、より高度な機能統合が期待されます。*