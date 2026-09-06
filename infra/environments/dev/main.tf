locals {
  name_prefix = "veganbite-${var.env}"
}

# --- 必要な API の有効化 ---
# 有効化自体に課金はない。destroy 時に無効化すると他リソースに影響しうるため disable_on_destroy = false
resource "google_project_service" "apis" {
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "iamcredentials.googleapis.com", # Workload Identity Federation（GitHub Actions からの鍵レス認証）
    "sts.googleapis.com",            # 同上
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}
