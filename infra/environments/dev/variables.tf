# 秘密でない値はここで既定値を持たせる（*.tfvars は gitignore 対象のため）
variable "project_id" {
  description = "GCP プロジェクト ID"
  type        = string
  default     = "veganbite"
}

variable "region" {
  description = "Cloud Run 等を配置するリージョン。Neon（aws-ap-southeast-1）に近いシンガポールを使う"
  type        = string
  default     = "asia-southeast1"
}

variable "env" {
  description = "環境名。リソース名のプレフィックスに使う"
  type        = string
  default     = "dev"
}

variable "api_image" {
  description = "Cloud Run に初回デプロイするイメージ。実イメージへの差し替え後は CI/CD が更新する"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}
