variable "project" {}
variable "env" {}
variable "s3_bucket_domain_name" {}
variable "s3_bucket_id" {}
variable "frontend_function_url" {}
variable "image_optimization_url" {}

# CloudFront用のOAC（S3アクセス制御）
resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${var.project}-${var.env}-s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Lambda Function URLからホスト名を抽出
locals {
  frontend_origin        = replace(replace(var.frontend_function_url, "https://", ""), "/", "")
  image_optimization_origin = replace(replace(var.image_optimization_url, "https://", ""), "/", "")
}

# CloudFrontディストリビューション
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = ""
  price_class         = "PriceClass_200"

  # オリジン1: S3（静的アセット）
  origin {
    domain_name              = var.s3_bucket_domain_name
    origin_id                = "s3-assets"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  # オリジン2: Lambda Function URL（Next.js SSR — 唯一の外部窓口）
  origin {
    domain_name = local.frontend_origin
    origin_id   = "frontend-lambda"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # オリジン3: Lambda Function URL（画像最適化）
  origin {
    domain_name = local.image_optimization_origin
    origin_id   = "image-optimization-lambda"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # デフォルト: 全リクエストをNext.js Lambda経由
  default_cache_behavior {
    target_origin_id       = "frontend-lambda"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # /_next/image* → 画像最適化Lambda
  ordered_cache_behavior {
    path_pattern           = "/_next/image*"
    target_origin_id       = "image-optimization-lambda"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400
    default_ttl = 604800
    max_ttl     = 31536000
    compress    = true
  }

  # /_next/static/* → S3（静的アセットはキャッシュ）
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400
    default_ttl = 604800
    max_ttl     = 31536000
    compress    = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project}-${var.env}-cdn"
  }
}

# S3バケットポリシー（CloudFrontからのみアクセス許可）
resource "aws_s3_bucket_policy" "assets" {
  bucket = var.s3_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "arn:aws:s3:::${var.s3_bucket_id}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
        }
      }
    }]
  })
}

# Outputs
output "distribution_url" {
  value = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "distribution_id" {
  value = aws_cloudfront_distribution.main.id
}
