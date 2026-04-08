variable "project" {}
variable "env" {}
variable "vpc_id" {}
variable "private_subnet_ids" { type = list(string) }
variable "db_name" {}
variable "db_username" {}
variable "db_password" { sensitive = true }
variable "lambda_sg_id" {}

# RDS用サブネットグループ
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.env}-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project}-${var.env}-db-subnet"
  }
}

# RDS用セキュリティグループ
resource "aws_security_group" "rds" {
  name_prefix = "${var.project}-${var.env}-rds-"
  vpc_id      = var.vpc_id

  # Lambda からの PostgreSQL 接続のみ許可
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.lambda_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-${var.env}-rds-sg"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier     = "${var.project}-${var.env}-db"
  engine         = "postgres"
  engine_version = "16.6"
  instance_class = "db.t4g.micro"

  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  skip_final_snapshot = true
  multi_az            = false
  publicly_accessible = false

  tags = {
    Name = "${var.project}-${var.env}-db"
  }
}

# Outputs
output "db_endpoint" {
  value = aws_db_instance.main.endpoint
}
