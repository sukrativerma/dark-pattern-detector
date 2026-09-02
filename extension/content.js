console.log("Dark Pattern Detector is running on this page");

function detectPreCheckedBoxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  let flaggedCount = 0;

  checkboxes.forEach((box) => {
    if (box.checked) {
      box.style.outline = "3px solid red";
      box.title = "⚠️ This box was pre-checked for you — a common dark pattern";
      flaggedCount++;
    }
  });

  if (flaggedCount > 0) {
    console.log(`Dark Pattern Detector: found ${flaggedCount} pre-checked box(es)`);
  }
}

detectPreCheckedBoxes();
setTimeout(detectPreCheckedBoxes, 2000);