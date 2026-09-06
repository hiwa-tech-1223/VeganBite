# --- Cloud Run: Go API ---
module "api" {
  source = "../../modules/cloudrun-service"

  name                  = "${local.name_prefix}-api"
  project_id            = var.project_id
  region                = var.region
  service_account_email = google_service_account.run.email
  image                 = var.api_image
  max_instances         = 2

  # 秘密でない設定は平文の環境変数で渡す。FRONTEND_URL は Vercel の URL 確定後に設定する
  env = merge(
    {
      GOOGLE_CLIENT_ID = var.google_client_id
    },
    var.frontend_url == "" ? {} : {
      FRONTEND_URL             = var.frontend_url
      OAUTH_REDIRECT_URL       = "${var.frontend_url}/api/auth/google/callback"
      OAUTH_ADMIN_REDIRECT_URL = "${var.frontend_url}/api/auth/admin/google/callback"
    },
  )

  # 秘密は Secret Manager から注入（実行用 SA に secret 単位の参照権限を付与済み）
  secret_env = {
    DATABASE_URL         = google_secret_manager_secret.app["database_url"].secret_id
    JWT_SECRET           = google_secret_manager_secret.app["jwt_secret"].secret_id
    GOOGLE_CLIENT_SECRET = google_secret_manager_secret.app["google_client_secret"].secret_id
  }

  # 公開 API。認証はアプリ層の JWT で行う
  allow_unauthenticated = true

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_iam_member.run_accessor,
    google_secret_manager_secret_version.database_url,
    google_secret_manager_secret_version.jwt_secret,
    google_secret_manager_secret_version.google_client_secret,
  ]
}
