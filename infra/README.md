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

秘密の値（API キー等）は環境変数か gitignore 対象の `terraform.tfvars` で渡す。秘密でない値は `variables.tf` の既定値を使う。
