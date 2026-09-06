package server

import (
	"time"

	"backend/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// コネクションプール設定
// Neon（サーバーレス Postgres）はアイドル時にサスペンドするため、
// アイドル接続を短めに破棄して死んだコネクションを掴み続けないようにする。
const (
	dbMaxOpenConns    = 5
	dbMaxIdleConns    = 2
	dbConnMaxIdleTime = 1 * time.Minute
	dbConnMaxLifetime = 30 * time.Minute
)

// openDB - DB に接続し、コネクションプールを設定して返す
func openDB(cfg *config.Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(dbMaxOpenConns)
	sqlDB.SetMaxIdleConns(dbMaxIdleConns)
	sqlDB.SetConnMaxIdleTime(dbConnMaxIdleTime)
	sqlDB.SetConnMaxLifetime(dbConnMaxLifetime)

	return db, nil
}
