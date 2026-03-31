mod mips_engine;

use lazy_static::lazy_static;
use std::sync::Mutex;
use mips_engine::{MipsEngine, SimulatorState};

lazy_static! {
    static ref ENGINE: Mutex<MipsEngine> = Mutex::new(MipsEngine::new());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![run_mips_code, step_mips_code, reset_simulator])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn run_mips_code(code: String) -> Result<SimulatorState, String> {
    let mut engine = ENGINE.lock().map_err(|e| format!("Mutex error: {}", e))?;
    
    if let Err(e) = engine.load_program(&code) {
        return Ok(engine.get_state(format!("Load Error: {}", e)));
    }

    match engine.run_all() {
        Ok(msg) => Ok(engine.get_state(msg)),
        Err(e) => Ok(engine.get_state(format!("Runtime Error: {}", e))),
    }
}

#[tauri::command]
fn step_mips_code(code: String) -> SimulatorState {
    let mut engine = ENGINE.lock().unwrap();
    
    // Check if we need to load (simplified: if pc is 0)
    if engine.get_pc() == 0 {
        if let Err(e) = engine.load_program(&code) {
            return engine.get_state(format!("Load Error: {}", e));
        }
    }

    match engine.step() {
        Ok(true) => engine.get_state("Step executed.".into()),
        Ok(false) => engine.get_state("End of program.".into()),
        Err(e) => engine.get_state(format!("Error: {}", e)),
    }
}

#[tauri::command]
fn reset_simulator() -> SimulatorState {
    let mut engine = ENGINE.lock().unwrap();
    engine.reset();
    engine.get_state("Engine reset.".to_string())
}
