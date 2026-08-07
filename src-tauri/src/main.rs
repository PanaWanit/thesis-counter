use tauri_plugin_sql::{Migration, MigrationKind};

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_semesters_table",
            sql: "CREATE TABLE IF NOT EXISTS semesters (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                name TEXT NOT NULL,\n                start_date TEXT NOT NULL,\n                end_date TEXT NOT NULL,\n                credits INTEGER NOT NULL,\n                created_at TEXT NOT NULL\n            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_categories_table",
            sql: "CREATE TABLE IF NOT EXISTS categories (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                name TEXT NOT NULL UNIQUE,\n                color TEXT NOT NULL,\n                created_at TEXT NOT NULL\n            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_sessions_table",
            sql: "CREATE TABLE IF NOT EXISTS sessions (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                semester_id INTEGER NOT NULL,\n                category_id INTEGER NOT NULL,\n                started_at TEXT NOT NULL,\n                ended_at TEXT NOT NULL,\n                duration_minutes INTEGER NOT NULL,\n                note TEXT NOT NULL DEFAULT '',\n                manual INTEGER NOT NULL DEFAULT 0,\n                created_at TEXT NOT NULL,\n                FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,\n                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT\n            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "seed_default_categories",
            sql: "INSERT OR IGNORE INTO categories (name, color, created_at) VALUES\n                ('Reading', '#3b82f6', datetime('now')),\n                ('Writing', '#22c55e', datetime('now')),\n                ('Experiments', '#a855f7', datetime('now')),\n                ('Meeting', '#f59e0b', datetime('now')),\n                ('Other', '#6b7280', datetime('now'));",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "convert_category_created_at_to_iso",
            sql: "UPDATE categories SET created_at = strftime('%Y-%m-%dT%H:%M:%SZ', created_at) WHERE created_at NOT LIKE '%T%';",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:thesis.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
