# --- Neon: サーバーレス Postgres ---
# API キーは環境変数 NEON_API_KEY から読む（provider の既定動作）
provider "neon" {}

module "db" {
  source = "../../modules/neon-database"

  project_name  = local.name_prefix
  org_id        = var.neon_org_id
  database_name = "veganbite"
  role_name     = "veganbite"
}

# pooled 接続文字列を Secret Manager に流し込み、Cloud Run へ DATABASE_URL として注入する
resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.app["database_url"].id
  secret_data = module.db.pooled_connection_uri
}
