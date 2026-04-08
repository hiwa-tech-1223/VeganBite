output "cloudfront_url" {
  value = module.cloudfront.distribution_url
}

output "api_url_internal" {
  value       = module.lambda_backend.function_url
  description = "Go API Function URL（内部通信専用、外部からアクセス不可）"
}

output "rds_endpoint" {
  value = module.rds.db_endpoint
}
