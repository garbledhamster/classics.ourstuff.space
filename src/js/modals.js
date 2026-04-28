/* modals.js — showAlert(), showConfirm(), _showPrompt(): promise-based modal dialogs */
/* =========================================================
   MODAL
   ========================================================= */
// Generic modal helpers for alert, confirm, and prompt
function showAlert(message, title = "Alert"){
  return new Promise((resolve) => {
    const modal = $("#alertModal");
    const overlay = $("#overlay");
    
    $("#alertModalTitle").textContent = title;
    $("#alertModalMessage").textContent = message;
    
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    
    const okBtn = $("#alertModalOkBtn");
    
    function handleOk(){
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      okBtn.removeEventListener("click", handleOk);
      resolve();
    }
    
    okBtn.addEventListener("click", handleOk);
    setTimeout(() => okBtn.focus(), 100);
  });
}

function showConfirm(message, title = "Confirm"){
  return new Promise((resolve) => {
    const modal = $("#confirmModal");
    const overlay = $("#overlay");
    
    $("#confirmModalTitle").textContent = title;
    $("#confirmModalMessage").textContent = message;
    
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    
    const okBtn = $("#confirmModalOkBtn");
    const cancelBtn = $("#confirmModalCancelBtn");
    
    function handleOk(){
      cleanup();
      resolve(true);
    }
    
    function handleCancel(){
      cleanup();
      resolve(false);
    }
    
    function cleanup(){
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
    }
    
    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
    setTimeout(() => cancelBtn.focus(), 100);
  });
}

function _showPrompt(message, defaultValue = "", title = "Input Required"){
  return new Promise((resolve) => {
    const modal = $("#promptModal");
    const overlay = $("#overlay");
    const input = $("#promptModalInput");
    
    $("#promptModalTitle").textContent = title;
    $("#promptModalMessage").textContent = message;
    input.value = defaultValue;
    
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    
    const okBtn = $("#promptModalOkBtn");
    const cancelBtn = $("#promptModalCancelBtn");
    
    function handleOk(){
      const value = input.value;
      cleanup();
      resolve(value);
    }
    
    function handleCancel(){
      cleanup();
      resolve(null);
    }
    
    function handleEnter(e){
      if (e.key === "Enter"){
        handleOk();
      }
    }
    
    function cleanup(){
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      input.removeEventListener("keydown", handleEnter);
    }
    
    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
    input.addEventListener("keydown", handleEnter);
    setTimeout(() => input.focus(), 100);
  });
}

