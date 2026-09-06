# --- Vercel: Next.js フロントエンド ---
# API トークンは環境変数 VERCEL_API_TOKEN から読む（provider の既定動作）。
# Hobby プラン（無料、非商用）。Git 連携には Vercel の GitHub App がリポジトリに対して許可されている必要がある。
provider "vercel" {
  team = var.vercel_team
}

resource "vercel_project" "frontend" {
  name           = local.name_prefix
  framework      = "nextjs"
  root_directory = "frontend"
  node_version   = "24.x"

  git_repository = {
    type              = "github"
    repo              = var.github_repository
    production_branch = "main"
  }

  # Function のリージョンを Cloud Run / Neon と同じシンガポールに寄せる（既定は米国東部）
  resource_config = {
    function_default_regions = ["sin1"]
  }

  environment = [
    {
      key       = "API_URL_INTERNAL"
      value     = module.api.uri
      sensitive = false
      target    = ["production", "preview"]
    },
  ]
}

locals {
  # Hobby プランの既定ドメインは "<project name>.vercel.app"。
  # Cloud Run の env（FRONTEND_URL）と Vercel の env（API_URL_INTERNAL）が互いを参照して循環しないよう、
  # リソース属性ではなく名前から決める。名前が取れずサフィックスが付いた場合は var.frontend_url で上書きする。
  frontend_url = var.frontend_url != "" ? var.frontend_url : "https://${local.name_prefix}.vercel.app"
}
