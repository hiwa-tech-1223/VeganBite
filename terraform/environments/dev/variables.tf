variable "aws_region" {
  default = "ap-northeast-1"
}

variable "project" {
  default = "veganbite"
}

variable "env" {
  default = "dev"
}

# --- Database ---
variable "db_name" {
  default = "veganbite"
}

variable "db_username" {
  sensitive = true
}

variable "db_password" {
  sensitive = true
}

# --- Auth ---
variable "jwt_secret" {
  sensitive = true
}

variable "google_client_id" {
  sensitive = true
}

variable "google_client_secret" {
  sensitive = true
}

# --- Frontend ---
variable "frontend_url" {
  default = ""
}
