variable "project" {}
variable "env" {}
variable "backend_function_url" {}
variable "backend_lambda_arn" {}
variable "backend_function_name" {}

# S3バケット（静的アセット用）
resource "aws_s3_bucket" "assets" {
  bucket = "${var.project}-${var.env}-assets"

  tags = {
    Name = "${var.project}-${var.env}-assets"
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lambda実行用IAMロール
resource "aws_iam_role" "lambda" {
  name = "${var.project}-${var.env}-frontend-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# S3アクセス用ポリシー
resource "aws_iam_role_policy" "s3_access" {
  name = "${var.project}-${var.env}-frontend-s3"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
      ]
      Resource = [
        aws_s3_bucket.assets.arn,
        "${aws_s3_bucket.assets.arn}/*",
      ]
    }]
  })
}

# Go Lambdaの呼び出し権限（内部通信用）
resource "aws_iam_role_policy" "invoke_backend" {
  name = "${var.project}-${var.env}-invoke-backend"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "lambda:InvokeFunction",
        "lambda:InvokeFunctionUrl",
      ]
      Resource = var.backend_lambda_arn
    }]
  })
}

# Go Lambda側にNext.js LambdaのIAMロールからの呼び出しを許可
resource "aws_lambda_permission" "backend_from_frontend" {
  statement_id           = "AllowFrontendLambdaInvoke"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = var.backend_lambda_arn
  principal              = aws_iam_role.lambda.arn
  function_url_auth_type = "AWS_IAM"
}

# Lambda関数（Next.js SSR — 唯一の外部窓口）
resource "aws_lambda_function" "frontend" {
  function_name = "${var.project}-${var.env}-frontend"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = 512

  filename         = data.archive_file.dummy.output_path
  source_code_hash = data.archive_file.dummy.output_base64sha256

  environment {
    variables = {
      API_URL_INTERNAL       = var.backend_function_url
      BACKEND_FUNCTION_NAME  = var.backend_function_name
      AWS_REGION_NAME        = "ap-northeast-1"
    }
  }
}

# Lambda Function URL（CloudFrontからアクセス）
resource "aws_lambda_function_url" "frontend" {
  function_name      = aws_lambda_function.frontend.function_name
  authorization_type = "NONE"
}

# Function URLのパブリックアクセス許可（InvokeFunctionUrlとInvokeFunctionの両方が必要）
resource "aws_lambda_permission" "frontend_public_url" {
  statement_id  = "AllowPublicInvokeFunctionUrl"
  action        = "lambda:InvokeFunctionUrl"
  function_name = aws_lambda_function.frontend.function_name
  principal     = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "frontend_public_invoke" {
  statement_id  = "AllowPublicInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.frontend.function_name
  principal     = "*"
}

# ダミーZIP（初回デプロイ用）
data "archive_file" "dummy" {
  type        = "zip"
  output_path = "${path.module}/dummy.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'placeholder' });"
    filename = "index.js"
  }
}

# 画像最適化用Lambda
resource "aws_lambda_function" "image_optimization" {
  function_name = "${var.project}-${var.env}-image-optimization"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = 512

  filename         = data.archive_file.dummy.output_path
  source_code_hash = data.archive_file.dummy.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.assets.id
    }
  }
}

resource "aws_lambda_function_url" "image_optimization" {
  function_name      = aws_lambda_function.image_optimization.function_name
  authorization_type = "NONE"
}

# Outputs
output "function_url" {
  value = aws_lambda_function_url.frontend.function_url
}

output "image_optimization_url" {
  value = aws_lambda_function_url.image_optimization.function_url
}

output "s3_bucket_domain_name" {
  value = aws_s3_bucket.assets.bucket_regional_domain_name
}

output "s3_bucket_id" {
  value = aws_s3_bucket.assets.id
}

output "function_name" {
  value = aws_lambda_function.frontend.function_name
}
