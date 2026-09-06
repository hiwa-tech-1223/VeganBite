# --- コンテナレジストリ ---
# 無料枠はストレージ 0.5GB。古いイメージが蓄積して課金されないよう自動削除ポリシーを設定する
resource "google_artifact_registry_repository" "app" {
  project       = var.project_id
  location      = var.region
  repository_id = local.name_prefix
  description   = "VeganBite ${var.env} のコンテナイメージ"
  format        = "DOCKER"

  # KEEP が DELETE より優先されるため、「直近 3 バージョンは残し、それ以外で 30 日超のものを消す」になる
  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "keep-recent-3"
    action = "KEEP"
    most_recent_versions {
      keep_count = 3
    }
  }

  cleanup_policies {
    id     = "delete-older-than-30d"
    action = "DELETE"
    condition {
      older_than = "2592000s" # 30 日
    }
  }

  depends_on = [google_project_service.apis]
}
