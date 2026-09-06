variable "project_name" {
  description = "Neon プロジェクト名"
  type        = string
}

variable "org_id" {
  description = "Neon の Organization ID（org-...）。組織配下に作る場合に指定"
  type        = string
  default     = null
}

variable "region_id" {
  description = "Neon のリージョン ID。Cloud Run（asia-southeast1）に最も近いシンガポール"
  type        = string
  default     = "aws-ap-southeast-1"
}

variable "pg_version" {
  description = "PostgreSQL メジャーバージョン。ローカル開発（postgres:18）と揃える"
  type        = number
  default     = 18
}

variable "branch_name" {
  type    = string
  default = "main"
}

variable "database_name" {
  type = string
}

variable "role_name" {
  type = string
}

variable "autoscaling_min_cu" {
  description = "最小コンピュートユニット。Free プランの下限は 0.25"
  type        = number
  default     = 0.25
}

variable "autoscaling_max_cu" {
  description = "最大コンピュートユニット。無料枠の CU 時間を温存するため小さく保つ"
  type        = number
  default     = 1
}

variable "history_retention_seconds" {
  description = "PITR 用の履歴保持秒数。Free プランの上限は 21600（6 時間）"
  type        = number
  default     = 21600
}
