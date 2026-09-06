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
  }

  # state バケットは Terraform 管理外（infra/README.md 参照）
  backend "gcs" {
    bucket = "veganbite-terraform-state"
    prefix = "dev"
  }
}
