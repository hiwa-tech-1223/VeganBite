# --- Cloud Run: Go API ---
module "api" {
  source = "../../modules/cloudrun-service"

  name                  = "${local.name_prefix}-api"
  project_id            = var.project_id
  region                = var.region
  service_account_email = google_service_account.run.email
  image                 = var.api_image
  max_instances         = 2

  # 公開 API。認証はアプリ層の JWT で行う
  allow_unauthenticated = true

  depends_on = [google_project_service.apis]
}
