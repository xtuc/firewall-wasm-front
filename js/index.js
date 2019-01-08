import { decode } from "@webassemblyjs/wasm-parser";
import { print } from "@webassemblyjs/wast-printer"

const HEAP_OBJECT_HEADER_SIZE = 1;

const source = document.getElementById("source");
const requestElement = document.getElementById("request");
const wast = document.getElementById("wast");
const run = document.getElementById("run");

const request = {
  "http.host": "sauleau.com",
  "http.uri": window.location.pathname
};

requestElement.innerHTML = JSON.stringify(request, null, 4);

function downloadModule(m) {
  const blob = new Blob([m], {
    type: "application/wasm"
  });
  const objectUrl = URL.createObjectURL(blob);

  downloadURL(objectUrl, "module.wasm", "application/wasm");

  window.URL.revokeObjectURL(objectUrl);

  function downloadURL(data, fileName) {
    const a = document.createElement("a");
    a.href = data;
    a.download = fileName;
    document.body.appendChild(a);
    a.style = "display: none";
    a.click();
    a.remove();
  }
}


function log(msg) {
  const log = document.getElementById("log");
  log.innerHTML += msg;
}

function clear() {
  const log = document.getElementById("log");
  log.innerHTML = "";
}

function writeString(value, { alloc_string, put_char_code_at }) {
  const ptr = alloc_string(value.length);

  for (var i = 0, len = value.length; i < len; i++) {
    put_char_code_at(ptr, i, value.charCodeAt(i));
  }

  return ptr;
}

function init(runtime) {
  const requestObjectKeys = Object.keys(request);

  for (var i = 0, len = requestObjectKeys.length; i < len; i++) {
    const k = requestObjectKeys[i];
    runtime.table_set(i, writeString(request[k], runtime));
  }
}

function instantiate(bytes) {
  const m = new WebAssembly.Module(bytes);
  const i = new WebAssembly.Instance(m);

  return i;
}

function compile(compiler, source) {
  clear();

  log(Date() + "\n");

  log("generating rule: ");
  const out = compiler.create_rule(source + " ");

  if (out === null) {
    log("Failed\n");
    return;
  } else {
    window._downloadModule = () => downloadModule(Uint8Array.from(out));
    log('OK (<a href="javascript:_downloadModule()">download module.wasm</a>)\n');
  }

  wast.innerHTML = printModule(out);

  log("run and init rule: ");

  const instance = instantiate(Uint8Array.from(out));
  init(instance.exports);

  log("OK\n");

  log("\"" + source + "\": ");
  if (instance.exports.apply()) {
    log("matches\n");
  } else {
    log("does not match\n");
  }
}

function printModule(binary) {
  const decoderOpts = {};
  const ast = decode(binary, decoderOpts);
  return print(ast);
}

import("../crate/pkg").then(module => {
  module.run();

  run.onclick = function () {
    compile(module, source.value);
  }
  compile(module, source.value);
});
