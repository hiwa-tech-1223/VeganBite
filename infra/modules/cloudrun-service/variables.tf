variable "name" {
  description = "Cloud Run サービス名"
  type        = string
}

variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "service_account_email" {
  description = "実行用サービスアカウント"
  type        = string
}

variable "image" {
  description = "初回デプロイ時のコンテナイメージ。以降の更新は CI/CD が行うため Terraform は差分を無視する"
  type        = string
}

variable "container_port" {
  type    = number
  default = 8080
}

variable "max_instances" {
  description = "暴発課金の上限。設計方針により小さく保つ"
  type        = number
  default     = 2
}

variable "cpu" {
  type    = string
  default = "1"
}

variable "memory" {
  type    = string
  default = "512Mi"
}

variable "env" {
  description = "平文で渡す環境変数"
  type        = map(string)
  default     = {}
}

variable "secret_env" {
  description = "Secret Manager から注入する環境変数。キーが環境変数名、値が secret_id"
  type        = map(string)
  default     = {}
}

variable "allow_unauthenticated" {
  description = "allUsers に roles/run.invoker を付与して公開する"
  type        = bool
  default     = true
}
