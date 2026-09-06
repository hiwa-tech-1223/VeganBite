# --- CI/CD: GitHub Actions からの鍵レス認証（Workload Identity Federation） ---
# 長期のサービスアカウント鍵を GitHub に置かず、GitHub の OIDC トークンを GCP の短期認証情報に交換する。
# 信頼するのは指定リポジトリからのトークンのみ（attribute_condition で制限）。

resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"

  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions"
  display_name                       = "GitHub Actions OIDC"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
  }

  # このリポジトリ以外の OIDC トークンは拒否する
  attribute_condition = "assertion.repository == \"${var.github_repository}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# デプロイ用サービスアカウント（GitHub Actions がなりすます）
resource "google_service_account" "deployer" {
  project      = var.project_id
  account_id   = "${local.name_prefix}-deployer"
  display_name = "GitHub Actions deployer (${var.env})"

  depends_on = [google_project_service.apis]
}

# 指定リポジトリの Workload Identity からのみ、このサービスアカウントになれる
resource "google_service_account_iam_member" "deployer_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

# --- デプロイに必要な最小権限（プロジェクト全体ではなく対象リソース単位で付与） ---

# イメージの push
resource "google_artifact_registry_repository_iam_member" "deployer_writer" {
  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.app.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deployer.email}"
}

# Cloud Run の新リビジョン作成（gcloud run deploy）
resource "google_cloud_run_v2_service_iam_member" "deployer_developer" {
  project  = var.project_id
  location = var.region
  name     = module.api.name
  role     = "roles/run.developer"
  member   = "serviceAccount:${google_service_account.deployer.email}"
}

# デプロイ時に実行用 SA を指定するための actAs 権限
resource "google_service_account_iam_member" "deployer_act_as_run" {
  service_account_id = google_service_account.run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}
