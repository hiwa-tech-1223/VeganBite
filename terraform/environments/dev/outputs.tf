output "cloudfront_url" {
  value = module.cloudfront.distribution_url
}

output "api_url" {
  value = module.lambda_backend.function_url
}

output "rds_endpoint" {
  value = module.rds.db_endpoint
}
