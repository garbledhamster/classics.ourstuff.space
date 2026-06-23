import {
  registerLibraryIdeaNavigator,
  registerLibraryWorkNavigator,
  registerRenderApp,
  registerViewNavigator
} from "./foundation.js";
import {
  filteredLibrary,
  renderLibrary
} from "./library-shelf.js";
import {
  loadPlan as loadReadingPlan,
  renderPlan
} from "./reading-plan.js";
import {
  gotoLibraryGreatIdea,
  gotoLibraryWork,
  gotoPlanWorkKey,
  renderAll,
  setView
} from "./reader-routes.js";

let readingWorldBridgeRegistered = false;

function registerReadingWorldBridge(){
  if (readingWorldBridgeRegistered) return;

  registerRenderApp(renderAll);
  registerViewNavigator(setView);
  registerLibraryWorkNavigator(gotoLibraryWork);
  registerLibraryIdeaNavigator(gotoLibraryGreatIdea);

  readingWorldBridgeRegistered = true;
}

function loadPlan(...args){
  registerReadingWorldBridge();
  return loadReadingPlan(...args);
}

export {
  filteredLibrary,
  gotoLibraryGreatIdea,
  gotoLibraryWork,
  gotoPlanWorkKey,
  loadPlan,
  registerReadingWorldBridge,
  renderAll,
  renderLibrary,
  renderPlan,
  setView
};
