# infra

Terraform によるインフラ定義。構成の方針（Cloud Run + Neon + Vercel、常時課金リソースを置かない）は設計書に従う。

```
infra/
  modules/            # 共通モジュール
  environments/
    dev/              # dev 環境（現在はこれのみ）
```

## 前提

- Terraform 1.14 以上
- `gcloud auth application-default login` 済み（google provider の認証）
- Terraform state 用の GCS バケットは Terraform 管理外。以下で作成済み:

```bash
gcloud storage buckets create gs://veganbite-terraform-state \
  --project=veganbite --location=asia-southeast1 \
  --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets update gs://veganbite-terraform-state --versioning
```

## 使い方

```bash
cd infra/environments/dev
terraform init
terraform plan
terraform apply
```

秘密の値は環境変数か gitignore 対象の `terraform.tfvars` で渡す。秘密でない値は `variables.tf` の既定値を使う。

| 値 | 渡し方 |
|---|---|
| Neon API キー | 環境変数 `NEON_API_KEY` |
| Vercel API トークン | 環境変数 `VERCEL_API_TOKEN` |
| Google OAuth クライアントシークレット | `environments/dev/terraform.tfvars` の `google_client_secret` |

## Terraform 管理外の手作業

- GCS の state バケット作成（上記）
- Google Cloud Console の OAuth クライアントに、承認済みリダイレクト URI として `https://veganbite-dev.vercel.app/api/auth/google/callback` と `.../api/auth/admin/google/callback` を登録
- Vercel アカウントに GitHub App をインストール（`vercel_project` の Git 連携に必要）
- GitHub リポジトリの Secret `NEON_DATABASE_URL_DIRECT` に `terraform output -raw neon_direct_connection_uri` の値を登録（deploy.yml のマイグレーションで使用）

## 運用上の注意

- `min_instance_count` を 1 以上にしない、`cpu_idle` を false にしない（常時課金になる）
- Cloud Run のイメージ更新は CI/CD（`gcloud run deploy`）の責務。Terraform は `image` の差分を無視する
- neon provider は community 製のためバージョンを完全固定している。`terraform init -upgrade` は CHANGELOG を確認してから実行する。`neon_project` には `prevent_destroy` を付けている

## 構成図（docs/architecture.png）の再生成

`docs/architecture.mmd` を編集したら、Mermaid で描画して PNG に書き出す。GitHub の Mermaid 描画に頼らず PNG にしているのは、README 以外（提出資料など）でも同じ図を使えるようにするため。

1. [Mermaid Live Editor](https://mermaid.live/) に `docs/architecture.mmd` の内容を貼り付けて描画を確認する
2. PNG としてエクスポートし（背景は白、拡大率 2 倍程度）、`docs/architecture.png` を置き換える

mermaid-cli（`minlag/mermaid-cli` の Docker イメージ）でも生成できるが、日本語フォントが含まれないため文字が欠けることがある。
