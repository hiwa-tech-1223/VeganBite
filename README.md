# VeganBite - Vegan Food Review Website

ビーガン食品に特化した口コミ・レビューサイトです。ユーザーが商品を評価・レビューし、お気に入りを管理できます。

## 💡 About

- **目的**: ビーガン食品の情報を集約し、消費者の商品選びをサポート
- **収益モデル**: アフィリエイト広告（Amazon、楽天、Yahoo!ショッピング）による収益化
- **ターゲット**: ビーガン・ベジタリアン、健康志向の消費者

## 🌐 Live Site

- **サイト**: https://veganbite-dev.vercel.app
- **管理画面**: https://veganbite-dev.vercel.app/admin

アクセスがほぼ無い前提の構成のため、アイドル後の初回アクセスは Cloud Run と Neon の復帰で数秒かかることがあります。

## 🎬 Demo

### 管理画面：商品作成
![商品作成](docs/商品作成.gif)

### 管理画面：カテゴリー追加
![カテゴリー追加](docs/カテゴリー追加.gif)

### 管理画面：レビュー管理
![レビュー管理](docs/レビュー管理.gif)

### 管理画面：カスタマー管理
![カスタマー管理](docs/カスタマー管理.gif)

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19 + TypeScript 5.9
- Tailwind CSS v4
- Jest + Testing Library

### Backend
- Go 1.25
- Echo framework
- GORM
- PostgreSQL 18
- Google OAuth 2.0 + JWT

### Infrastructure
- Vercel (Next.js SSR、Hobby プラン)
- Google Cloud Run (Go API、scale-to-zero)
- Neon (サーバーレス PostgreSQL、scale-to-zero)
- Google Secret Manager / Artifact Registry
- Terraform (google / neon / vercel の 3 プロバイダをまとめて管理)
- GitHub Actions (CI/CD、Workload Identity Federation による鍵レス認証)
- Docker & Docker Compose (ローカル開発)

## Infrastructure Architecture

月額ほぼ $0 を最優先に、「常時課金されるリソースを置かない」ことを原則にしたマルチクラウド構成です。
すべてのコンピュートと DB がアイドル時にゼロまでスケールダウンし、リクエストが来たときだけ動きます。

![Infrastructure Architecture](docs/architecture.png)

（図のソースは [docs/architecture.mmd](docs/architecture.mmd)。再生成の手順は [infra/README.md](infra/README.md)）

Terraform の定義は [infra/](infra/) にあります。Vercel のプロジェクト、Cloud Run、Secret Manager、Neon のプロジェクトまでを 1 つの state で管理しています。

### 設計上のポイント

- **アイドル時はゼロまで縮む**: Cloud Run は待機インスタンスを置かず（`min_instance_count = 0`）、CPU もリクエスト処理中だけ割り当てる。Neon は Free プランで自動サスペンドする。DB を定期的に叩いて起こす処理は入れない
- **ブラウザからは Vercel の中継ルート経由で API を呼ぶ**: 同一オリジンの `/api/*` に投げ、Next.js の Route Handler が Cloud Run に転送する。CORS の設定が不要で、バックエンドの URL もブラウザに出ない
- **ページのデータは ISR でキャッシュする**: トップと商品詳細は 60 秒キャッシュし、その間の表示では Cloud Run を呼ばない。キャッシュが切れた最初のアクセスでだけ呼ぶ
- **秘密情報は Secret Manager から注入する**: クライアント ID やフロントの URL など秘密でない値は、平文の環境変数で渡す
- **マイグレーションだけ direct 接続を使う**: アプリは pooled（PgBouncer）接続を使うが、golang-migrate は advisory lock を使うため direct 接続が要る
- **使わないもの**: Cloud SQL / VPC / NAT / Load Balancer。どれも置くだけで固定費がかかる

セキュリティ上の設計は [Security](#security) にまとめています。

## Security

ネットワークで隠すのではなく、入口での遮断・暗号化・最小権限を重ねる方針です。「常時課金されるリソースを置かない」制約の中で選べる手段に絞っています。

### 入口（Vercel）

| 対策 | 内容 |
|---|---|
| DDoS 緩和 | Vercel が自動で行う（全プラン、設定不要） |
| レート制限 | 同一 IP から `/api` へ 1 分あたり 100 回まで。超えた分は 429 |
| Bot 対策 | 書き込み系 API（POST / PUT / DELETE）を Vercel BotID（Basic）で検証し、ページを経由しないスクリプトからのリクエストを 403 で拒否する |
| CSRF 対策 | セッション Cookie は `SameSite=Lax`。加えて書き込み系は `Sec-Fetch-Site`（無い場合は `Origin`）で自サイトからのリクエストかを確認する |

### API（Cloud Run）

- **Vercel 経由のリクエストだけを受け付ける**: Vercel だけが知る共有シークレットを `X-Origin-Verify` ヘッダーで照合する（定数時間で比較）。一致しなければ 403 を返すので、入口の防御を迂回した直接アクセスは API として使えない。CloudFront の後ろのオリジンをカスタムヘッダーで守るのと同じ考え方
- **例外は 1 つ**: デプロイ時のスモークテスト用に `/api/health` だけ照合しない。DB には触れず、状態も返さない
- **コンテナ**: distroless イメージを非 root ユーザーで動かす

### 認証・認可

| 項目 | 内容 |
|---|---|
| ログイン | Google OAuth 2.0。開始時にランダムな `state` を httpOnly Cookie に保存し、Google からの戻りで照合する（ログイン CSRF 対策） |
| セッション | JWT（HS256、24 時間）を `HttpOnly` / `Secure` / `SameSite=Lax` の Cookie に保存する。トークンは URL にもブラウザの JavaScript にも出ない。中継ルートが `Authorization` ヘッダーに詰め替えて Cloud Run に渡す |
| ログアウト | サーバー側で Cookie を削除する |
| BAN・一時停止 | ログイン時と、ログイン済みのリクエストごとに状態を確認する。発行済みのトークンでも即座に止まり、一時停止は期限を過ぎると自動で解除される |
| 管理者 | 管理者として登録された Google アカウントだけが管理者としてログインできる |
| 本人確認 | レビューの編集・削除とお気に入りの操作は本人のみ（レビューの削除は管理者も可） |

### データベース（Neon）

- **通信の暗号化**: TLS を必須にし、サーバー証明書も検証する（`sslmode=verify-full`）
- **最小権限**: アプリはデータの読み書きだけができるロールで接続する。テーブルの作成や削除はできない。その権限を持つオーナーロールはマイグレーション専用で、GitHub Actions からしか使わない
- **公開エンドポイントである理由**: DB をプライベートネットワークに閉じ込めるには VPC コネクタや NAT（GCP 側）、IP 制限（Neon の有料プラン）が必要で、どれも「常時課金なし」と両立しない。そのため上の 2 つで守る

### 秘密情報

- DB の接続文字列、JWT の署名鍵、OAuth のクライアントシークレット、共有シークレットは Secret Manager に置く。実行用サービスアカウントには、必要なシークレットだけ参照権限を与える
- JWT の署名鍵と共有シークレットは Terraform が生成する。Vercel 側の共有シークレットは sensitive な環境変数
- リポジトリには秘密情報を置かない（Terraform の `*.tfvars` は gitignore 対象）

### CI/CD・依存関係

- **長期の鍵を持たない**: GitHub Actions は Workload Identity Federation でデプロイ用サービスアカウントになりすます。信頼するのはこのリポジトリから発行された OIDC トークンだけ
- **デプロイ用の権限は最小限**: Artifact Registry への push、対象の Cloud Run サービスの更新、実行用サービスアカウントの指定のみ
- **依存関係**: Dependabot が Go / npm / Docker イメージ / GitHub Actions / Terraform provider を週次で確認する

### 割り切っている点

- **Cloud Run の URL 自体は公開**: 直接のリクエストは 403 で拒否するが、拒否するまでにコンテナは起動する。届く前に弾くには IAM 認証が必要で、Vercel からの OIDC 連携が要るため見送った。インスタンス数を最大 2 に制限しているので、費用の上限は変わらない
- **盗まれたセッションは期限まで有効**: JWT をサーバー側で取り消す仕組みは持たない（BAN したアカウントは即座に止まる）。httpOnly Cookie にしたので、JavaScript からは盗めない
- **高度な Bot は見分けられない**: 本物のブラウザを操作する Bot の判定には、BotID の Deep Analysis（Pro プラン）が要る
- **レート制限は IP 単位**: 同じ IP を共有する利用者（社内ネットワーク、携帯回線など）はまとめて数えられる

## CI/CD・依存関係

- **長期鍵を持たない**: GitHub Actions は Workload Identity Federation でデプロイ用サービスアカウントになりすます。信頼するのはこのリポジトリからの OIDC トークンのみ
- **デプロイ用の最小権限**: Artifact Registry への push、対象の Cloud Run サービスの更新、実行用サービスアカウントの指定だけを許可
- **依存関係の更新**: Dependabot が Go / npm / Docker ベースイメージ / GitHub Actions / Terraform provider を週次で確認する

### 割り切っている点

- **Cloud Run の URL 自体は公開**: 直接のリクエストは 403 で拒否するが、拒否するまでにコンテナは起動する。届く前に弾くには IAM 認証が必要で、Vercel からの OIDC 連携が要るため見送った。Cloud Run は最大 2 インスタンスに制限しており、費用の上限は変わらない
- **盗まれたセッションは期限まで有効**: JWT はサーバー側で取り消す仕組みを持たない（BAN したアカウントは即座に止まる）。httpOnly Cookie にしたことで JavaScript からは盗めない
- **高度な Bot は見分けられない**: 本物のブラウザを操作する Bot の判定には BotID の Deep Analysis（Pro プラン）が必要
- **レート制限は IP 単位**: 同じ IP を共有する利用者（社内ネットワーク、携帯回線など）はまとめて数えられる

## CI/CD

### PRを出したとき（ci.yml）
- フロントエンド: ESLint + TypeScript型チェック + Jest テスト
- バックエンド: golangci-lint + Go テスト

### mainにマージしたとき
- フロントエンド: Vercel の GitHub 連携が自動でビルド・デプロイ（ワークフロー不要）
- バックエンド（deploy.yml）: Docker ビルド → Artifact Registry に push → Neon へマイグレーション → Cloud Run にデプロイ → ヘルスチェック

### 依存関係の更新
- Dependabot が Go / npm / Docker ベースイメージ / GitHub Actions / Terraform provider を週次で確認

## Architecture

バックエンドはクリーンアーキテクチャとドメイン駆動設計（DDD）を採用しています。

- ビジネスロジックをエンティティやバリューオブジェクトに分離し、再利用可能で一貫性のある設計を実現
- ユビキタス言語を導入してドメインエキスパートと共通の言語で要件を整理し、システム全体の設計を効率化
- 依存性の方向を外側から内側へ（Handler → UseCase → Domain）統一し、テスタビリティと柔軟性を確保

```
interfaces/     → usecase/     → domain/
(Handler,DTO)    (Business)     (Entity,ValueObject,Repository)
                      ↓
               infrastructure/
               (DB,OAuth,JWT)
```

## Getting Started

### Prerequisites
- Docker Desktop installed and running
- Git

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd VeganBite
```

2. Copy environment file and configure
```bash
cp .env.example .env
```

Edit `.env` with your Google OAuth credentials:
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
JWT_SECRET=your-jwt-secret-key
DB_SSLMODE=disable
```

3. Build and start containers
```bash
docker compose build
docker compose up -d
```

4. Run migrations
```bash
docker compose exec backend migrate -path ./migrations -database "postgres://postgres:postgres@db:5432/veganbite?sslmode=disable" up
```

5. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Admin: http://localhost:3000/admin/login

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs（Google からのコールバックは Next.js が受け、state の照合とセッション Cookie の発行を行う）:
   - `http://localhost:3000/api/auth/google/callback`
   - `http://localhost:3000/api/auth/admin/google/callback`

## Project Structure

```
VeganBite/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── api/             # API client functions
│   │   │   ├── admin/       # Admin API calls
│   │   │   ├── auth/        # Auth API calls
│   │   │   ├── customer/    # Customer API calls
│   │   │   └── config.ts    # API設定（SSR は Cloud Run 直接、CSR は同一オリジン中継）
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── admin/       # Admin pages
│   │   │   ├── auth/        # Auth callback
│   │   │   ├── api/         # API Route（Go API への中継）
│   │   │   └── ...
│   │   ├── components/      # UI components
│   │   │   ├── admin/       # Admin components
│   │   │   ├── auth/        # Auth guards
│   │   │   ├── common/      # Shared components
│   │   │   └── customer/    # Customer components
│   │   └── contexts/        # React Context
│   ├── Dockerfile           # ローカル開発用
│   └── package.json
├── backend/                  # Go backend (Clean Architecture)
│   ├── cmd/server/          # エントリポイント（PORT 環境変数で待ち受け）
│   ├── server/              # Echo の組み立て（DI・ルーティング・DB 接続）
│   ├── config/              # Configuration
│   ├── domain/              # Entities, Repository interfaces
│   │   ├── admin/
│   │   ├── customer/
│   │   ├── product/
│   │   ├── review/
│   │   └── favorite/
│   ├── usecase/             # Business logic
│   │   ├── admin/
│   │   └── customer/
│   ├── infrastructure/      # DB implementation, external APIs
│   │   ├── auth/            # JWT, OAuth services
│   │   └── persistence/     # Repository implementations
│   ├── interfaces/          # Handlers, DTOs
│   │   ├── dto/
│   │   └── handler/
│   │       ├── admin/
│   │       └── customer/
│   ├── migrations/          # SQL migrations
│   ├── Dockerfile           # 本番用（マルチステージ → distroless）
│   ├── Dockerfile.dev       # ローカル開発用（air ホットリロード）
│   └── go.mod
├── infra/                   # Infrastructure as Code (Terraform)
│   ├── environments/dev/    # dev 環境（Cloud Run, Secret Manager, WIF, Neon, Vercel）
│   └── modules/
│       ├── cloudrun-service/ # Cloud Run サービス（scale-to-zero 固定）
│       └── neon-database/   # Neon プロジェクト・DB・ロール
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           # PR時のテスト
│   │   └── deploy.yml       # mainマージ時の Cloud Run デプロイ
│   └── dependabot.yml       # 依存関係の週次チェック
├── docker-compose.yml
└── README.md
```

## Database

### Current Tables (8)
- `admins` - 管理者
- `admin_roles` - 管理者ロール
- `customers` - 一般ユーザー
- `categories` - カテゴリ
- `products` - 商品
- `product_categories` - 商品とカテゴリの中間テーブル
- `reviews` - レビュー
- `favorites` - お気に入り

## Pages

### Customer Pages
- `/` - Product listing
- `/product/:id` - Product detail with reviews
- `/login` - Customer login
- `/mypage` - Customer profile, reviews, favorites
- `/terms` - Terms of service
- `/privacy` - Privacy policy

### Admin Pages
- `/admin/login` - Admin login
- `/admin/products` - Product management
- `/admin/products/new` - Add new product
- `/admin/products/:id/edit` - Edit product
- `/admin/categories` - Category management
- `/admin/categories/new` - Add new category
- `/admin/categories/:id/edit` - Edit category
- `/admin/reviews` - Review management
- `/admin/customers` - Customer management (BAN/suspend)

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/google | Customer Google OAuth login |
| GET | /api/auth/google/callback | Customer OAuth callback |
| GET | /api/auth/admin/google | Admin Google OAuth login |
| GET | /api/auth/admin/google/callback | Admin OAuth callback |
| GET | /api/auth/me | Get current user (Protected) |
| POST | /api/auth/logout | Logout (Protected) |

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/categories | List categories |
| GET | /api/products | List products |
| GET | /api/products/:id | Get product |
| GET | /api/products/:id/reviews | List product reviews |

### Protected Endpoints (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product |
| POST | /api/categories | Create category |
| PUT | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |
| GET | /api/reviews | List all reviews |
| GET | /api/admin/customers | List all customers |
| POST | /api/admin/customers/:id/ban | Ban customer |
| POST | /api/admin/customers/:id/suspend | Suspend customer |
| POST | /api/admin/customers/:id/unban | Unban customer |

### Protected Endpoints (Customer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/products/:id/reviews | Create review |
| PUT | /api/reviews/:id | Update review |
| DELETE | /api/reviews/:id | Delete review |
| GET | /api/customers/:id/favorites | List customer favorites |
| POST | /api/customers/:id/favorites | Add favorite |
| DELETE | /api/customers/:id/favorites/:productId | Remove favorite |
| GET | /api/customers/:id/reviews | List customer reviews |

## License

MIT
