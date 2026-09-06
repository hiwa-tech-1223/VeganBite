output "project_id" {
  value = neon_project.this.id
}

output "pooled_connection_uri" {
  description = "アプリ用（pooled / PgBouncer 経由）の接続文字列。認証情報を含む"
  value       = neon_project.this.connection_uri_pooler
  sensitive   = true
}

output "direct_connection_uri" {
  description = "マイグレーション用（direct）の接続文字列。advisory lock を使う golang-migrate は pooled では動かない"
  value       = neon_project.this.connection_uri
  sensitive   = true
}

output "pooled_host" {
  value = neon_project.this.database_host_pooler
}

output "database_name" {
  value = neon_project.this.database_name
}

output "role_name" {
  value = neon_project.this.database_user
}

output "direct_host" {
  description = "direct エンドポイントのホスト名（DB ロール管理など、pooled を使えない用途向け）"
  value       = neon_project.this.database_host
}

output "role_password" {
  description = "オーナーロールのパスワード"
  value       = neon_project.this.database_password
  sensitive   = true
}
