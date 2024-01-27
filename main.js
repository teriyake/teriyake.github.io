function unhideWindow() {
  var w = document.getElementById("real-window");
  w.style.visibility = "visible";
}

function hideWindow() {
  var w = document.getElementById("real-window");
  w.style.visibility = "hidden";
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("curtain").style.display = "block";
  document.getElementById("about-min").addEventListener("click", function (e) {
    e.preventDefault();
    var ele = document.getElementById("about-body");
    ele.style.display = ele.style.display == "block" ? "none" : "block";
  });
  document
    .getElementById("about-cancel")
    .addEventListener("click", function (e) {
      e.preventDefault();
      document.getElementById("are-u-sure").style.display = "block";
      document.getElementById("about-title-bar").classList.add("inactive");
    });
  document.getElementById("window-ok").addEventListener("click", function (e) {
    e.preventDefault();
    document.getElementById("real-window").style.display = "block";
  });
  setTimeout(() => {
    const win = document.getElementById("window-window");
    win.style.visibility = "hidden";
  }, 1000);

  const pause = (_) => new Promise((resolve) => setTimeout(resolve, _));
  async function openingWindows() {
    const win = document.getElementById("window-window");
    const maxX = window.screen.width - win.getBoundingClientRect().width;
    const maxY = window.screen.height - win.getBoundingClientRect().height;
    newX = Math.random() * maxX;
    newY = Math.random() * maxY;
    win.style.left = newX + "px";
    win.style.top = newY + "px";
    const t1 = (Math.random() * (12 - 0 + 1) + 0) * 1000;
    await pause(t1);
    win.style.visibility = "visible";

    const t2 = (Math.random() * (5 - 0 + 1) + 0) * 1000;
    await pause(t2);
    win.style.visibility = "hidden";
  }
  async function waitingToOpenWindows() {
    while (true) {
      await openingWindows();
    }
  }
  waitingToOpenWindows();
});
