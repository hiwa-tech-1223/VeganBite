# --- Cloud Run 実行用サービスアカウント ---
# デフォルトの Compute SA（Editor 権限）は使わず、最小権限の専用 SA を作る。
# コンテナの stdout/stderr は Cloud Run 側が収集するため、ログ書き込み権限は不要。
# Secret Manager の参照権限は手順 4 で secret 単位に付与する。
resource "google_service_account" "run" {
  project      = var.project_id
  account_id   = "${local.name_prefix}-run"
  display_name = "Cloud Run runtime SA (${var.env})"

  depends_on = [google_project_service.apis]
}
