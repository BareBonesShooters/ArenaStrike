// Boot loader (an ES module). Current Three.js ships only as a module, so this file imports the vendored copy and the post-processing
// add-ons, exposes them as the global THREE (the game's classic scripts read it as T), and then loads those classic scripts in the
// order they are listed in index.html (script tags with data-src). No build step: the import map in index.html points "three" at vendor/.
// Current Three.js needs WebGL 2, so devices without it get a clear message instead of a blank page.
import * as THREE_NS from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { SAOPass } from "three/addons/postprocessing/SAOPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { CopyShader } from "three/addons/shaders/CopyShader.js";

function noWebGL2() {
  try { const c = document.createElement("canvas"); return !c.getContext("webgl2"); } catch (e) { return true; }
}
function showMessage(text) {
  const d = document.createElement("div");
  d.id = "nogl";
  d.setAttribute("role", "alert");
  d.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:#0a1020;color:#e8eef8;font:16px/1.5 system-ui,sans-serif;text-align:center";
  d.innerHTML = "<div style='max-width:420px'><h2 style='margin:0 0 12px;font-size:22px'>This device can't run Arena Strike 3D</h2><p style='margin:0'>" + text + "</p></div>";
  document.body.appendChild(d);
}

if (noWebGL2()) {
  showMessage("The game needs WebGL 2, which this browser or graphics chip doesn't support. Try an up-to-date Chrome, Edge, Firefox or Safari, or another device.");
} else {
  // every canvas the game paints holds colours, so canvas textures default to sRGB (the renderer converts them to linear light);
  // a texture that holds data instead (the grass detail multiplier) sets NoColorSpace itself
  class CanvasTexture extends THREE_NS.CanvasTexture { constructor(...a) { super(...a); this.colorSpace = THREE_NS.SRGBColorSpace; } }
  // the module namespace is frozen, so the game gets a plain object it can extend
  const T = Object.assign({}, THREE_NS, { CanvasTexture, EffectComposer, Pass, FullScreenQuad, RenderPass, ShaderPass, UnrealBloomPass, SAOPass, SMAAPass, OutputPass, FXAAShader, CopyShader });
  window.THREE = T;
  // classic scripts inserted with async=false run one after another in insertion order, like the plain script tags they replace
  for (const tag of document.querySelectorAll("script[data-src]")) {
    const s = document.createElement("script");
    s.src = tag.dataset.src;
    s.async = false;
    s.onerror = () => console.error("failed to load " + s.src);
    document.body.appendChild(s);
  }
}
