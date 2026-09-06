terraform {
  required_version = ">= 1.14.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 8.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
    # community provider のため完全固定。上げるときは CHANGELOG を確認してから
    neon = {
      source  = "kislerdm/neon"
      version = "= 0.15.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.15"
    }
    # DB ロールと権限の管理（Neon の API で作るロールは権限が広すぎるため SQL で作る）
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.27"
    }
  }

  # state バケットは Terraform 管理外（infra/README.md 参照）
  backend "gcs" {
    bucket = "veganbite-terraform-state"
    prefix = "dev"
  }
}
