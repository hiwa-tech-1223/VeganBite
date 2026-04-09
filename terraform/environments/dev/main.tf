terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "veganbite-terraform-state"
    key    = "dev/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# --- VPC ---
module "vpc" {
  source = "../../modules/vpc"

  project = var.project
  env     = var.env
}

# --- RDS ---
module "rds" {
  source = "../../modules/rds"

  project            = var.project
  env                = var.env
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  lambda_sg_id       = module.lambda_backend.lambda_sg_id
}

# --- Lambda (Go API) — 内部通信専用 ---
module "lambda_backend" {
  source = "../../modules/lambda-backend"

  project            = var.project
  env                = var.env
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_host            = module.rds.db_endpoint
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  jwt_secret         = var.jwt_secret
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  frontend_url       = var.frontend_url
}

# --- Lambda (Next.js) + S3 — 唯一の外部窓口 ---
module "lambda_frontend" {
  source = "../../modules/lambda-frontend"

  project              = var.project
  env                  = var.env
  backend_function_url  = module.lambda_backend.function_url
  backend_lambda_arn    = module.lambda_backend.lambda_arn
  backend_function_name = module.lambda_backend.function_name
}

# --- CloudFront — S3とNext.js Lambdaのみ ---
module "cloudfront" {
  source = "../../modules/cloudfront"

  project               = var.project
  env                   = var.env
  s3_bucket_domain_name = module.lambda_frontend.s3_bucket_domain_name
  s3_bucket_id          = module.lambda_frontend.s3_bucket_id
  frontend_function_url = module.lambda_frontend.function_url
  image_optimization_url = module.lambda_frontend.image_optimization_url
}
