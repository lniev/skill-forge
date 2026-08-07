// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod skills;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            skills::commands::install_skill_file,
            skills::commands::link_skill,
            skills::commands::uninstall_skill,
            skills::commands::list_installed_skills,
            skills::commands::write_skill_meta,
            skills::commands::get_skill_dir,
            skills::commands::open_skill_dir,
            skills::commands::detect_installed_agents,
            skills::commands::get_skill_repos,
            skills::commands::save_skill_repos,
            skills::commands::add_skill_repo,
            skills::commands::remove_skill_repo,
            skills::commands::discover_skills,
            skills::commands::search_skills_sh,
            skills::commands::read_skill_readme,
            skills::commands::open_external_url,
            skills::commands::install_discovered_skill,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust.", name)
}
