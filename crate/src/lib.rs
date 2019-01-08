#[macro_use]
extern crate cfg_if;
extern crate web_sys;
extern crate wasm_bindgen;
extern crate compiler;
extern crate serde_derive;
extern crate serde_json;

use compiler::parsing;
use compiler::compiler::compile;

use wasm_bindgen::prelude::*;

cfg_if! {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function to get better error messages if we ever panic.
    if #[cfg(feature = "console_error_panic_hook")] {
        extern crate console_error_panic_hook;
        use console_error_panic_hook::set_once as set_panic_hook;
    } else {
        #[inline]
        fn set_panic_hook() {}
    }
}

cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

#[wasm_bindgen]
pub fn create_rule(source: String) -> JsValue {
    let rule = parsing::rule(&source);

    match rule {
        Ok((_, r)) => {
            println!("rule: {:?}", r);
            let module = compile(r, false);
            let bytes = module.to_bytes();

            return JsValue::from_serde(&bytes).unwrap();
        },
        _ =>{
            // Err("parsing failed"),
            return JsValue::NULL
        }
    };
}

#[wasm_bindgen]
pub fn run() -> Result<(), JsValue> {
    set_panic_hook();

    Ok(())
}
