package config

import "testing"

func TestGetDSN_PrefersDatabaseURL(t *testing.T) {
	cfg := &Config{
		DatabaseURL: "postgres://app:secret@example.neon.tech/veganbite?sslmode=require",
		DBHost:      "ignored",
		DBUser:      "ignored",
		DBPassword:  "ignored",
		DBName:      "ignored",
		DBPort:      "1",
		DBSSLMode:   "disable",
	}

	got := cfg.GetDSN()
	want := "postgres://app:secret@example.neon.tech/veganbite?sslmode=require"
	if got != want {
		t.Errorf("GetDSN() = %q, want %q", got, want)
	}
}

func TestGetDSN_BuildsFromParts(t *testing.T) {
	cfg := &Config{
		DBHost:     "db",
		DBUser:     "postgres",
		DBPassword: "postgres",
		DBName:     "veganbite",
		DBPort:     "5432",
		DBSSLMode:  "disable",
	}

	got := cfg.GetDSN()
	want := "host=db user=postgres password=postgres dbname=veganbite port=5432 sslmode=disable"
	if got != want {
		t.Errorf("GetDSN() = %q, want %q", got, want)
	}
}

func TestLoad_ReadsDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://u:p@h/d")

	cfg := Load()
	if cfg.DatabaseURL != "postgres://u:p@h/d" {
		t.Errorf("DatabaseURL = %q, want %q", cfg.DatabaseURL, "postgres://u:p@h/d")
	}
	if cfg.GetDSN() != "postgres://u:p@h/d" {
		t.Errorf("GetDSN() = %q, want DATABASE_URL to take precedence", cfg.GetDSN())
	}
}

func TestLoad_DefaultsWithoutDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("DB_HOST", "")
	t.Setenv("DB_PORT", "")
	t.Setenv("DB_USER", "")
	t.Setenv("DB_PASSWORD", "")
	t.Setenv("DB_NAME", "")
	t.Setenv("DB_SSLMODE", "")

	cfg := Load()
	want := "host=localhost user=postgres password=postgres dbname=veganbite port=5432 sslmode=disable"
	if got := cfg.GetDSN(); got != want {
		t.Errorf("GetDSN() = %q, want %q", got, want)
	}
}

func TestLoad_PortDefaultsTo8080(t *testing.T) {
	t.Setenv("PORT", "")

	if got := Load().Port; got != "8080" {
		t.Errorf("Port = %q, want %q", got, "8080")
	}
}

func TestLoad_ReadsPort(t *testing.T) {
	t.Setenv("PORT", "9090")

	if got := Load().Port; got != "9090" {
		t.Errorf("Port = %q, want %q", got, "9090")
	}
}
