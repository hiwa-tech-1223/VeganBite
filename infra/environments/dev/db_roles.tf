# --- DB ロールの分離（最小権限） ---
# Neon の API / コンソールで作ったロールは neon_superuser 相当の権限を持つため、
# アプリ用の制限付きロールは SQL（postgresql provider）で作る。
#
# - veganbite      : DB オーナー。マイグレーション専用（GitHub Actions から direct 接続）
# - veganbite_app  : アプリ用。public スキーマのデータ読み書きのみ（DDL 不可）→ Cloud Run へ渡す

provider "postgresql" {
  host            = module.db.direct_host
  port            = 5432
  database        = module.db.database_name
  username        = module.db.role_name
  password        = module.db.role_password
  sslmode         = "require"
  superuser       = false
  connect_timeout = 30
}

resource "random_password" "app_db" {
  length  = 48
  special = false # URL エンコード不要にする
}

resource "postgresql_role" "app" {
  name     = "${module.db.role_name}_app"
  login    = true
  password = random_password.app_db.result

  # Neon の pooled 接続（PgBouncer）経由でも使えるよう、接続数の上限は付けない
}

resource "postgresql_grant" "app_schema_usage" {
  database    = module.db.database_name
  role        = postgresql_role.app.name
  schema      = "public"
  object_type = "schema"
  privileges  = ["USAGE"]
}

# 既存テーブル・シーケンスへの DML 権限
resource "postgresql_grant" "app_tables" {
  database    = module.db.database_name
  role        = postgresql_role.app.name
  schema      = "public"
  object_type = "table"
  privileges  = ["SELECT", "INSERT", "UPDATE", "DELETE"]
}

resource "postgresql_grant" "app_sequences" {
  database    = module.db.database_name
  role        = postgresql_role.app.name
  schema      = "public"
  object_type = "sequence"
  privileges  = ["USAGE", "SELECT", "UPDATE"]
}

# 今後マイグレーション（オーナーが実行）で作られるテーブル・シーケンスにも同じ権限を自動付与
resource "postgresql_default_privileges" "app_tables" {
  database    = module.db.database_name
  role        = postgresql_role.app.name
  schema      = "public"
  owner       = module.db.role_name
  object_type = "table"
  privileges  = ["SELECT", "INSERT", "UPDATE", "DELETE"]
}

resource "postgresql_default_privileges" "app_sequences" {
  database    = module.db.database_name
  role        = postgresql_role.app.name
  schema      = "public"
  owner       = module.db.role_name
  object_type = "sequence"
  privileges  = ["USAGE", "SELECT", "UPDATE"]
}

locals {
  # Cloud Run に渡す接続文字列: アプリ用ロール、pooled エンドポイント、サーバー証明書を検証する verify-full
  app_database_url = "postgres://${postgresql_role.app.name}:${random_password.app_db.result}@${module.db.pooled_host}/${module.db.database_name}?sslmode=verify-full"
}
