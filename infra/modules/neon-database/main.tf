# Neon（サーバーレス Postgres）
#
# - Free プランは scale-to-zero が必須（無効化不可）。アイドル 5 分でサスペンドし、接続時に自動復帰する
# - サスペンドを妨げる keep-alive / 定期 ping は実装しない（無料枠の CU 時間を食い潰すため）
# - アプリからの接続は pooled エンドポイント（PgBouncer）を使い、マイグレーションだけ direct を使う
#
# community provider（kislerdm/neon）のため、バージョンは environments 側で完全固定し、
# `terraform init -upgrade` を安易に実行しない（意図しない置換でデータが消える恐れがある）。
resource "neon_project" "this" {
  name       = var.project_name
  org_id     = var.org_id
  region_id  = var.region_id
  pg_version = var.pg_version

  # provider の既定値（86400 秒）は Free プランの上限（21600 秒）を超えて 400 になるため明示する
  history_retention_seconds = var.history_retention_seconds

  branch {
    name          = var.branch_name
    database_name = var.database_name
    role_name     = var.role_name
  }

  # v0.15.0 では default_endpoint ブロック未対応のため default_endpoint_settings を使う
  default_endpoint_settings {
    autoscaling_limit_min_cu = var.autoscaling_min_cu
    autoscaling_limit_max_cu = var.autoscaling_max_cu
  }

  lifecycle {
    # plan で置換（-/+）が出た場合に apply を止め、DB の消失を防ぐ
    prevent_destroy = true
  }
}
