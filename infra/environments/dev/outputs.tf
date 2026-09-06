output "artifact_registry_repository" {
  description = "docker push 先のリポジトリパス"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}"
}

output "run_service_account_email" {
  description = "Cloud Run 実行用サービスアカウント"
  value       = google_service_account.run.email
}

output "api_url" {
  description = "Go API（Cloud Run）の公開 URL"
  value       = module.api.uri
}

output "neon_direct_connection_uri" {
  description = "マイグレーション用（オーナーロール）の direct 接続文字列。GitHub Secret NEON_DATABASE_URL_DIRECT に登録する"
  value       = replace(module.db.direct_connection_uri, "sslmode=require", "sslmode=verify-full")
  sensitive   = true
}

output "frontend_url" {
  description = "フロントエンド（Vercel）の既定ドメイン"
  value       = local.frontend_url
}

output "workload_identity_provider" {
  description = "GitHub Actions の google-github-actions/auth に渡す provider 名"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deployer_service_account_email" {
  description = "GitHub Actions がなりすますデプロイ用 SA"
  value       = google_service_account.deployer.email
}
