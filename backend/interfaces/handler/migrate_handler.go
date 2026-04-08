package handler

import (
	"net/http"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/labstack/echo/v4"
)

// MigrateHandler - マイグレーション実行ハンドラー（AWSコンソールから手動実行専用）
func MigrateHandler() echo.HandlerFunc {
	return func(c echo.Context) error {
		dbURL := "postgres://" + os.Getenv("DB_USER") + ":" + os.Getenv("DB_PASSWORD") +
			"@" + os.Getenv("DB_HOST") + ":5432/" + os.Getenv("DB_NAME") + "?sslmode=require"

		m, err := migrate.New("file://migrations", dbURL)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"status":  "error",
				"message": "Failed to initialize migrate: " + err.Error(),
			})
		}
		defer m.Close()

		err = m.Up()
		if err != nil && err != migrate.ErrNoChange {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"status":  "error",
				"message": "Migration failed: " + err.Error(),
			})
		}

		if err == migrate.ErrNoChange {
			return c.JSON(http.StatusOK, map[string]string{
				"status":  "success",
				"message": "No new migrations to apply",
			})
		}

		return c.JSON(http.StatusOK, map[string]string{
			"status":  "success",
			"message": "Migrations applied successfully",
		})
	}
}
