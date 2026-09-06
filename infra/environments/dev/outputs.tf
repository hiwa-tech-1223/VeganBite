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
  description = "マイグレーション用の direct 接続文字列（terraform output -raw で取得）"
  value       = module.db.direct_connection_uri
  sensitive   = true
}
