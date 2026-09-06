# Cloud Run サービス（scale-to-zero 前提）
#
# コスト原則（設計書 2-1 / 2-4）:
# - min_instance_count = 0 を必ず維持する（1 以上にすると常時課金）
# - cpu_idle = true（リクエスト処理中のみ CPU 割り当て）を必ず維持する
# - max_instance_count は暴発課金の上限として小さく保つ
resource "google_cloud_run_v2_service" "this" {
  name     = var.name
  project  = var.project_id
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  # dev 環境のため誤削除防止は無効（provider 既定は true）
  deletion_protection = false

  template {
    service_account = var.service_account_email

    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image

      ports {
        container_port = var.container_port
      }

      resources {
        cpu_idle          = true
        startup_cpu_boost = true # 起動時のみ CPU を増やしコールドスタートを短縮（追加課金なし）
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      dynamic "env" {
        for_each = var.env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secret_env
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
    }
  }

  lifecycle {
    # イメージの更新は CI/CD（gcloud run deploy）が行うため、Terraform 側では差分として扱わない
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.this.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
