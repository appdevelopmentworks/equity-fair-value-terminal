use std::env;
use std::path::PathBuf;

fn main() {
    println!("cargo:rerun-if-changed=tauri.conf.json");
    println!("cargo:rerun-if-changed=sidecars/eqfv-python-sidecar.exe");

    let profile = env::var("PROFILE").unwrap_or_default();

    if profile == "release" {
        let manifest_dir =
            PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR is missing"));
        let packaged_sidecar = manifest_dir
            .join("sidecars")
            .join("eqfv-python-sidecar.exe");

        if !packaged_sidecar.exists() {
            panic!(
                "Release sidecar bundle is missing at {}. Run `npm run sidecar:build` before `npm run build`.",
                packaged_sidecar.display()
            );
        }
    }

    tauri_build::build()
}
