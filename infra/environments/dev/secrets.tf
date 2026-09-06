# --- Secret Manager ---
# 無料枠は「有効なシークレットバージョン 6 個」まで。レプリカ数で課金が増えるため単一リージョンに置く。
# 秘密でない値（GOOGLE_CLIENT_ID, FRONTEND_URL 等）は Secret にせず Cloud Run の環境変数で渡す。

locals {
  secret_ids = {
    database_url         = "${local.name_prefix}-database-url"
    jwt_secret           = "${local.name_prefix}-jwt-secret"
    google_client_secret = "${local.name_prefix}-google-client-secret"
  }
}

resource "google_secret_manager_secret" "app" {
  for_each = local.secret_ids

  project   = var.project_id
  secret_id = each.value

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  depends_on = [google_project_service.apis]
}

# 実行用 SA に secret 単位で参照権限を付与（プロジェクト全体には付けない）
resource "google_secret_manager_secret_iam_member" "run_accessor" {
  for_each = google_secret_manager_secret.app

  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.run.email}"
}

# --- バージョン（値） ---

# JWT 署名鍵は Terraform で生成する（旧環境のプレースホルダー値は引き継がない）
resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.app["jwt_secret"].id
  secret_data = random_password.jwt_secret.result
}

# Google OAuth のクライアントシークレットは tfvars（gitignore 対象）から受け取る
resource "google_secret_manager_secret_version" "google_client_secret" {
  secret      = google_secret_manager_secret.app["google_client_secret"].id
  secret_data = var.google_client_secret
}

# DATABASE_URL のバージョンは手順 5 で Neon の pooled 接続文字列から作成する
