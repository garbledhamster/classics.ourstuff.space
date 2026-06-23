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
  loadPlan,
  renderPlan
} from "./reading-plan.js";
import {
  gotoLibraryGreatIdea,
  gotoLibraryWork,
  gotoPlanWorkKey,
  renderAll,
  setView
} from "./reader-routes.js";

registerRenderApp(renderAll);
registerViewNavigator(setView);
registerLibraryWorkNavigator(gotoLibraryWork);
registerLibraryIdeaNavigator(gotoLibraryGreatIdea);

export {
  filteredLibrary,
  gotoLibraryGreatIdea,
  gotoLibraryWork,
  gotoPlanWorkKey,
  loadPlan,
  renderAll,
  renderLibrary,
  renderPlan,
  setView
};
