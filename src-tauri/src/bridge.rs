use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use tauri::{AppHandle, Manager};
use wait_timeout::ChildExt;

use crate::models::{
    ChartBridgeResponse, QuoteBridgeResponse, SearchBridgeResponse, ValuationsBridgeResponse,
};

const SIDECAR_TIMEOUT_SECONDS: u64 = 15;
const VALID_CHART_RANGES: [&str; 6] = ["1M", "3M", "6M", "1Y", "5Y", "MAX"];
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

enum SidecarTarget {
    Development {
        executable: PathBuf,
        script: PathBuf,
        workdir: PathBuf,
    },
    Packaged {
        executable: PathBuf,
        workdir: PathBuf,
    },
}

struct SidecarProcessError {
    code: &'static str,
    message: String,
    retryable: bool,
}

impl SidecarProcessError {
    fn new(code: &'static str, message: impl Into<String>, retryable: bool) -> Self {
        Self {
            code,
            message: message.into(),
            retryable,
        }
    }

    fn into_quote_response(self) -> QuoteBridgeResponse {
        QuoteBridgeResponse::error(self.code, &self.message, self.retryable)
    }

    fn into_chart_response(self) -> ChartBridgeResponse {
        ChartBridgeResponse::error(self.code, &self.message, self.retryable)
    }

    fn into_search_response(self) -> SearchBridgeResponse {
        SearchBridgeResponse::error(self.code, &self.message, self.retryable)
    }

    fn into_valuations_response(self) -> ValuationsBridgeResponse {
        ValuationsBridgeResponse::error(self.code, &self.message, self.retryable)
    }
}

#[tauri::command]
pub async fn fetch_quote(app: AppHandle, ticker: String) -> QuoteBridgeResponse {
    let normalized_ticker = match normalize_ticker(&ticker) {
        Ok(value) => value,
        Err(error) => return error.into_quote_response(),
    };

    let app_handle = app.clone();

    tauri::async_runtime::spawn_blocking(move || run_quote(&app_handle, &normalized_ticker))
        .await
        .unwrap_or_else(|_| {
            QuoteBridgeResponse::error(
                "INTERNAL_ERROR",
                "Internal processing failed. Please restart the app and try again.",
                true,
            )
        })
}

#[tauri::command]
pub async fn fetch_chart(
    app: AppHandle,
    ticker: String,
    chart_range: String,
) -> ChartBridgeResponse {
    let normalized_ticker = match normalize_ticker(&ticker) {
        Ok(value) => value,
        Err(error) => return error.into_chart_response(),
    };
    let normalized_range = match normalize_chart_range(&chart_range) {
        Ok(value) => value,
        Err(error) => return error.into_chart_response(),
    };

    let app_handle = app.clone();

    tauri::async_runtime::spawn_blocking(move || {
        run_chart(&app_handle, &normalized_ticker, &normalized_range)
    })
    .await
    .unwrap_or_else(|_| {
        ChartBridgeResponse::error(
            "INTERNAL_ERROR",
            "Internal processing failed. Please restart the app and try again.",
            true,
        )
    })
}

#[tauri::command]
pub async fn search_symbols(app: AppHandle, query: String) -> SearchBridgeResponse {
    let normalized_query = match normalize_search_query(&query) {
        Ok(value) => value,
        Err(error) => return error.into_search_response(),
    };

    let app_handle = app.clone();

    tauri::async_runtime::spawn_blocking(move || run_search(&app_handle, &normalized_query))
        .await
        .unwrap_or_else(|_| {
            SearchBridgeResponse::error(
                "INTERNAL_ERROR",
                "Internal processing failed. Please restart the app and try again.",
                true,
            )
        })
}

#[tauri::command]
pub async fn fetch_valuations(app: AppHandle, ticker: String) -> ValuationsBridgeResponse {
    let normalized_ticker = match normalize_ticker(&ticker) {
        Ok(value) => value,
        Err(error) => return error.into_valuations_response(),
    };

    let app_handle = app.clone();

    tauri::async_runtime::spawn_blocking(move || run_valuations(&app_handle, &normalized_ticker))
        .await
        .unwrap_or_else(|_| {
            ValuationsBridgeResponse::error(
                "INTERNAL_ERROR",
                "Internal processing failed. Please restart the app and try again.",
                true,
            )
        })
}

fn run_quote(app: &AppHandle, ticker: &str) -> QuoteBridgeResponse {
    match execute_sidecar(app, "quote", &[ticker.to_string()]) {
        Ok(stdout) => parse_quote_response(&stdout),
        Err(error) => error.into_quote_response(),
    }
}

fn run_chart(app: &AppHandle, ticker: &str, chart_range: &str) -> ChartBridgeResponse {
    match execute_sidecar(app, "chart", &[ticker.to_string(), chart_range.to_string()]) {
        Ok(stdout) => parse_chart_response(&stdout),
        Err(error) => error.into_chart_response(),
    }
}

fn run_search(app: &AppHandle, query: &str) -> SearchBridgeResponse {
    match execute_sidecar(app, "search", &[query.to_string()]) {
        Ok(stdout) => parse_search_response(&stdout),
        Err(error) => error.into_search_response(),
    }
}

fn run_valuations(app: &AppHandle, ticker: &str) -> ValuationsBridgeResponse {
    match execute_sidecar(app, "valuations-only", &[ticker.to_string()]) {
        Ok(stdout) => parse_valuations_response(&stdout),
        Err(error) => error.into_valuations_response(),
    }
}

fn execute_sidecar(
    app: &AppHandle,
    subcommand: &str,
    arguments: &[String],
) -> Result<String, SidecarProcessError> {
    let target = resolve_sidecar_target(app)?;

    let mut command = match target {
        SidecarTarget::Development {
            executable,
            script,
            workdir,
        } => {
            let mut command = Command::new(executable);
            command.current_dir(workdir);
            command.arg(script).arg(subcommand);
            command
        }
        SidecarTarget::Packaged {
            executable,
            workdir,
        } => {
            let mut command = Command::new(executable);
            command.current_dir(workdir);
            command.arg(subcommand);
            command
        }
    };

    for argument in arguments {
        command.arg(argument);
    }

    command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);

    let mut child = command.spawn().map_err(|_| {
        SidecarProcessError::new(
            "SIDECAR_EXECUTION_FAILED",
            "Python sidecar could not be started.",
            true,
        )
    })?;

    let mut stdout_pipe = child.stdout.take();
    let mut stderr_pipe = child.stderr.take();

    let status = match child.wait_timeout(Duration::from_secs(SIDECAR_TIMEOUT_SECONDS)) {
        Ok(Some(status)) => status,
        Ok(None) => {
            let _ = child.kill();
            let _ = child.wait();
            return Err(SidecarProcessError::new(
                "SIDECAR_TIMEOUT",
                "Data loading timed out. Please try again in a moment.",
                true,
            ));
        }
        Err(_) => {
            return Err(SidecarProcessError::new(
                "SIDECAR_EXECUTION_FAILED",
                "Python sidecar wait failed.",
                true,
            ));
        }
    };

    let mut stdout = String::new();
    let mut stderr = String::new();

    if let Some(mut pipe) = stdout_pipe.take() {
        let _ = pipe.read_to_string(&mut stdout);
    }
    if let Some(mut pipe) = stderr_pipe.take() {
        let _ = pipe.read_to_string(&mut stderr);
    }

    if !status.success() {
        return Err(SidecarProcessError::new(
            "SIDECAR_EXECUTION_FAILED",
            if stderr.trim().is_empty() {
                "Python sidecar returned a non-zero exit status."
            } else {
                "Python sidecar reported an execution failure."
            },
            true,
        ));
    }

    if stdout.trim().is_empty() {
        return Err(SidecarProcessError::new(
            "SIDECAR_INVALID_RESPONSE",
            "Python sidecar returned an empty response.",
            true,
        ));
    }

    Ok(stdout)
}

fn parse_quote_response(stdout: &str) -> QuoteBridgeResponse {
    match serde_json::from_str::<QuoteBridgeResponse>(stdout) {
        Ok(response) if response.ok && !response.is_valid_success() => QuoteBridgeResponse::error(
            "SIDECAR_INVALID_RESPONSE",
            "Python sidecar returned an incomplete success payload.",
            false,
        ),
        Ok(response) => response,
        Err(_) => QuoteBridgeResponse::error(
            "JSON_PARSE_FAILED",
            "Python sidecar returned malformed JSON.",
            false,
        ),
    }
}

fn parse_chart_response(stdout: &str) -> ChartBridgeResponse {
    match serde_json::from_str::<ChartBridgeResponse>(stdout) {
        Ok(response) if response.ok && !response.is_valid_success() => ChartBridgeResponse::error(
            "SIDECAR_INVALID_RESPONSE",
            "Python sidecar returned an incomplete chart payload.",
            false,
        ),
        Ok(response) => response,
        Err(_) => ChartBridgeResponse::error(
            "JSON_PARSE_FAILED",
            "Python sidecar returned malformed JSON.",
            false,
        ),
    }
}

fn parse_search_response(stdout: &str) -> SearchBridgeResponse {
    match serde_json::from_str::<SearchBridgeResponse>(stdout) {
        Ok(response) if response.ok && !response.is_valid_success() => SearchBridgeResponse::error(
            "SIDECAR_INVALID_RESPONSE",
            "Python sidecar returned an incomplete search payload.",
            false,
        ),
        Ok(response) => response,
        Err(_) => SearchBridgeResponse::error(
            "JSON_PARSE_FAILED",
            "Python sidecar returned malformed JSON.",
            false,
        ),
    }
}

fn parse_valuations_response(stdout: &str) -> ValuationsBridgeResponse {
    match serde_json::from_str::<ValuationsBridgeResponse>(stdout) {
        Ok(response) if response.ok && !response.is_valid_success() => {
            ValuationsBridgeResponse::error(
                "SIDECAR_INVALID_RESPONSE",
                "Python sidecar returned an incomplete valuation payload.",
                false,
            )
        }
        Ok(response) => response,
        Err(_) => ValuationsBridgeResponse::error(
            "JSON_PARSE_FAILED",
            "Python sidecar returned malformed JSON.",
            false,
        ),
    }
}

fn normalize_ticker(input: &str) -> Result<String, SidecarProcessError> {
    let trimmed = input.trim().to_uppercase();

    if trimmed.is_empty()
        || trimmed.len() > 24
        || !trimmed
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || ".-^=".contains(character))
    {
        return Err(SidecarProcessError::new(
            "INVALID_SYMBOL_FORMAT",
            "Ticker not found.",
            false,
        ));
    }

    Ok(normalize_tse_short_code(trimmed))
}

fn normalize_tse_short_code(ticker: String) -> String {
    if ticker.len() == 4 && ticker.chars().all(|character| character.is_ascii_digit()) {
        return format!("{ticker}.T");
    }

    ticker
}

fn normalize_chart_range(input: &str) -> Result<String, SidecarProcessError> {
    let trimmed = input.trim().to_uppercase();

    if VALID_CHART_RANGES.contains(&trimmed.as_str()) {
        return Ok(trimmed);
    }

    Err(SidecarProcessError::new(
        "HISTORICAL_DATA_FETCH_FAILED",
        "Chart range is not supported.",
        false,
    ))
}

fn normalize_search_query(input: &str) -> Result<String, SidecarProcessError> {
    let trimmed = input.trim();

    if trimmed.is_empty() || trimmed.chars().count() > 80 {
        return Err(SidecarProcessError::new(
            "INVALID_SYMBOL_FORMAT",
            "Search query is not valid.",
            false,
        ));
    }

    Ok(trimmed.to_string())
}

fn resolve_sidecar_target(app: &AppHandle) -> Result<SidecarTarget, SidecarProcessError> {
    if let Ok(override_path) = std::env::var("EQFV_SIDECAR_BIN") {
        let path = PathBuf::from(override_path);
        if path.exists() {
            let workdir = path
                .parent()
                .map(Path::to_path_buf)
                .unwrap_or_else(|| PathBuf::from("."));
            return Ok(SidecarTarget::Packaged {
                executable: path,
                workdir,
            });
        }
    }

    if cfg!(debug_assertions) {
        let workspace_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .map(Path::to_path_buf)
            .ok_or_else(|| {
                SidecarProcessError::new(
                    "SIDECAR_EXECUTION_FAILED",
                    "Workspace root could not be resolved.",
                    false,
                )
            })?;

        let python_executable = std::env::var("EQFV_PYTHON_EXECUTABLE")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                workspace_root
                    .join("python-sidecar")
                    .join(".venv")
                    .join("Scripts")
                    .join("python.exe")
            });

        let script_path = workspace_root
            .join("python-sidecar")
            .join("src")
            .join("main.py");
        let workdir = workspace_root.join("python-sidecar");

        if python_executable.exists() && script_path.exists() {
            return Ok(SidecarTarget::Development {
                executable: python_executable,
                script: script_path,
                workdir,
            });
        }

        return Err(SidecarProcessError::new(
            "SIDECAR_EXECUTION_FAILED",
            "Python sidecar is not set up yet. Follow the README setup steps first.",
            false,
        ));
    }

    let resource_dir = app.path().resource_dir().map_err(|_| {
        SidecarProcessError::new(
            "SIDECAR_EXECUTION_FAILED",
            "Packaged sidecar resources could not be resolved.",
            false,
        )
    })?;

    for packaged_sidecar in [
        resource_dir.join("sidecars").join("eqfv-python-sidecar.exe"),
        resource_dir.join("eqfv-python-sidecar.exe"),
    ] {
        if packaged_sidecar.exists() {
            let workdir = packaged_sidecar
                .parent()
                .map(Path::to_path_buf)
                .unwrap_or_else(|| resource_dir.clone());

            return Ok(SidecarTarget::Packaged {
                executable: packaged_sidecar,
                workdir,
            });
        }
    }

    Err(SidecarProcessError::new(
        "SIDECAR_EXECUTION_FAILED",
        "Packaged sidecar binary is missing.",
        false,
    ))
}
