# --- Cloud Logging ---
# 既定の保持期間（30 日）を短くし、ログの蓄積によるじわじわした課金を防ぐ。
# 無料枠は月 50GiB の取り込みで、ポートフォリオ用途では十分だが、保持を短くしておく。
resource "google_logging_project_bucket_config" "default" {
  project        = var.project_id
  location       = "global"
  bucket_id      = "_Default"
  retention_days = 14
}
