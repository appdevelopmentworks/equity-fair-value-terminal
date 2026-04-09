mod bridge;
mod models;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            bridge::fetch_quote,
            bridge::fetch_chart,
            bridge::search_symbols,
            bridge::fetch_valuations
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
