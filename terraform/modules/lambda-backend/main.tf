variable "project" {}
variable "env" {}
variable "vpc_id" {}
variable "private_subnet_ids" { type = list(string) }
variable "db_host" {}
variable "db_name" {}
variable "db_username" {}
variable "db_password" { sensitive = true }
variable "jwt_secret" { sensitive = true }
variable "google_client_id" {}
variable "google_client_secret" { sensitive = true }
variable "frontend_url" {}

# Lambda用セキュリティグループ
resource "aws_security_group" "lambda" {
  name_prefix = "${var.project}-${var.env}-lambda-"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-${var.env}-lambda-sg"
  }
}

# Lambda実行用IAMロール
resource "aws_iam_role" "lambda" {
  name = "${var.project}-${var.env}-backend-lambda-role"

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

# VPC内Lambda用ポリシー
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda関数
resource "aws_lambda_function" "backend" {
  function_name = "${var.project}-${var.env}-backend"
  role          = aws_iam_role.lambda.arn
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = 256

  # デプロイ時にCI/CDから更新される（初回はダミー）
  filename = "${path.module}/dummy.zip"

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_HOST                  = var.db_host
      DB_NAME                  = var.db_name
      DB_USER                  = var.db_username
      DB_PASSWORD              = var.db_password
      JWT_SECRET               = var.jwt_secret
      GOOGLE_CLIENT_ID         = var.google_client_id
      GOOGLE_CLIENT_SECRET     = var.google_client_secret
      FRONTEND_URL             = var.frontend_url
      OAUTH_REDIRECT_URL       = "${var.frontend_url}/auth/callback"
      OAUTH_ADMIN_REDIRECT_URL = "${var.frontend_url}/admin/auth/callback"
    }
  }
}

# Lambda Function URL（API Gateway の代わりにシンプルに公開）
resource "aws_lambda_function_url" "backend" {
  function_name      = aws_lambda_function.backend.function_name
  authorization_type = "NONE"
}

# ダミーZIP（初回デプロイ用）
resource "local_file" "dummy" {
  content  = "placeholder"
  filename = "${path.module}/dummy.zip"
}

# Outputs
output "function_url" {
  value = aws_lambda_function_url.backend.function_url
}

output "lambda_sg_id" {
  value = aws_security_group.lambda.id
}

output "function_name" {
  value = aws_lambda_function.backend.function_name
}
