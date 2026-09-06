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

variable "google_client_id" {
  description = "Google OAuth クライアント ID（秘密ではない。同一プロジェクト内の OAuth クライアント）"
  type        = string
  default     = "164814249326-u2jud0v1o6323a8n9tuhj4ihqs78m440.apps.googleusercontent.com"
}

variable "google_client_secret" {
  description = "Google OAuth クライアントシークレット。terraform.tfvars（gitignore 対象）で渡す"
  type        = string
  sensitive   = true
}

variable "neon_org_id" {
  description = "Neon の Organization ID（org-...）。アカウントが組織単位のため必須。秘密情報ではない"
  type        = string
  default     = "org-old-grass-21337740"
}

variable "frontend_url" {
  description = "フロントエンド（Vercel）の公開 URL。OAuth のリダイレクト先に使う。未確定の間は空文字"
  type        = string
  default     = ""
}
