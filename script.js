// ============================================================
// 1. SELECT THE ELEMENTS FROM THE PAGE
// ============================================================
const display = document.querySelector("#display");
const numberButtons = document.querySelectorAll(".number");
const operatorButtons = document.querySelectorAll(".operator");
const clearButton = document.querySelector("#clear");
const deleteButton = document.querySelector("#delete");
const decimalButton = document.querySelector("#decimal");
const equalsButton = document.querySelector("#equals");

// ============================================================
// 2. THE CALCULATOR'S MEMORY (its "state")
// ============================================================
const MAX_DIGITS = 12; // longest number the user can type

let currentInput = "0";         // what is shown on the display (always text)
let previousValue = null;       // the first number of a calculation
let pendingOperator = null;     // the operator waiting to be used (+, -, *, /)
let waitingForNewNumber = false; // true = the next digit starts a brand-new number
let operatorJustPressed = false; // true = the last button pressed was an operator

// ============================================================
// 3. HELPER FUNCTIONS
// ============================================================

// Show the current input on the screen
function updateDisplay() {
  display.textContent = currentInput;
}

// Put everything back to the starting state (doesn't touch the screen)
function resetCalculator() {
  currentInput = "0";
  previousValue = null;
  pendingOperator = null;
  waitingForNewNumber = false;
  operatorJustPressed = false;
}

// Reset everything and show "Error"
function showError() {
  resetCalculator();
  currentInput = "Error";
  updateDisplay();
}

// Do the math for two numbers. Returns null if the result is not valid.
// (We use a switch instead of eval() because it is safer and easier to follow.)
function calculate(a, b, operator) {
  let result;

  switch (operator) {
    case "+":
      result = a + b;
      break;
    case "-":
      result = a - b;
      break;
    case "*":
      result = a * b;
      break;
    case "/":
      if (b === 0) return null; // division by zero -> error
      result = a / b;
      break;
    default:
      return null;
  }

  // Catches anything weird like Infinity or NaN
  if (!isFinite(result)) return null;
  return result;
}

// Turn a number into neat text for the display
function formatResult(number) {
  if (!isFinite(number)) return "Error";

  // Rounds away tiny errors, so 0.1 + 0.2 shows 0.3 instead of 0.30000000000000004
  const rounded = parseFloat(number.toPrecision(12));
  let text = String(rounded);

  // Very long numbers switch to scientific notation (e.g. 1.2e+14)
  if (text.length > MAX_DIGITS) {
    text = rounded.toExponential(5).replace(/\.?0+e/, "e");
  }
  return text;
}

// ============================================================
// 4. BUTTON ACTIONS
// ============================================================

// A number button was pressed
function inputNumber(digit) {
  if (currentInput === "Error") resetCalculator();

  if (waitingForNewNumber) {
    currentInput = digit;          // start a new number
    waitingForNewNumber = false;
  } else if (currentInput === "0") {
    currentInput = digit;          // replace the starting 0
  } else {
    if (currentInput.length >= MAX_DIGITS) return; // too long, ignore
    currentInput += digit;         // 7 -> 75 -> 753
  }

  operatorJustPressed = false;
  updateDisplay();
}

// The decimal button was pressed
function inputDecimal() {
  if (currentInput === "Error") resetCalculator();

  if (waitingForNewNumber) {
    currentInput = "0.";           // "." at the start of a number becomes "0."
    waitingForNewNumber = false;
  } else if (!currentInput.includes(".")) {
    if (currentInput.length >= MAX_DIGITS) return;
    currentInput += ".";           // only add a "." if there isn't one already
  }

  operatorJustPressed = false;
  updateDisplay();
}

// An operator (+, -, *, /) was pressed
function handleOperator(operator) {
  if (currentInput === "Error") return;

  // Pressed two operators in a row (like 5 + × 3)? Just swap the operator.
  if (operatorJustPressed) {
    pendingOperator = operator;
    return;
  }

  const inputValue = parseFloat(currentInput);

  if (pendingOperator !== null) {
    // Chained calculation: finish the previous step first (5 + 3 × ... -> 8 × ...)
    const result = calculate(previousValue, inputValue, pendingOperator);
    if (result === null) {
      showError();
      return;
    }
    currentInput = formatResult(result);
    previousValue = parseFloat(currentInput);
  } else {
    previousValue = inputValue;
  }

  pendingOperator = operator;
  waitingForNewNumber = true;
  operatorJustPressed = true;
  updateDisplay();
}

// The % button was pressed
function handlePercent() {
  if (currentInput === "Error") return;

  const inputValue = parseFloat(currentInput);
  let result;

  if (pendingOperator === "+" || pendingOperator === "-") {
    // 200 + 10%  ->  10% of 200 = 20
    result = (previousValue * inputValue) / 100;
  } else {
    // 50%  ->  0.5      50 × 10%  ->  50 × 0.1
    result = inputValue / 100;
  }

  currentInput = formatResult(result);
  waitingForNewNumber = true;
  operatorJustPressed = false;
  updateDisplay();
}

// The = button was pressed
function handleEquals() {
  if (currentInput === "Error") return;
  if (pendingOperator === null) return; // nothing to calculate

  const result = calculate(previousValue, parseFloat(currentInput), pendingOperator);
  if (result === null) {
    showError();
    return;
  }

  currentInput = formatResult(result);
  previousValue = null;
  pendingOperator = null;
  waitingForNewNumber = true;  // typing a number now starts a new calculation
  operatorJustPressed = false;
  updateDisplay();
}

// The C button was pressed
function handleClear() {
  resetCalculator();
  updateDisplay();
}

// The delete (⌫) button was pressed
function handleDelete() {
  if (currentInput === "Error") {
    handleClear();
    return;
  }
  if (waitingForNewNumber) return; // don't chop up a finished result

  currentInput = currentInput.slice(0, -1); // remove the last character
  if (currentInput === "" || currentInput === "-") {
    currentInput = "0";            // nothing left -> show 0
  }
  updateDisplay();
}

// ============================================================
// 5. CONNECT THE BUTTONS TO THE ACTIONS
// ============================================================

// Loop through every number button and listen for clicks
numberButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    inputNumber(button.dataset.number);
  });
});

// Operator buttons (the % button shares this class, so we check for it)
operatorButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const operator = button.dataset.operator;

    if (operator === "%") {
      handlePercent();
    } else {
      handleOperator(operator);
    }
  });
});

decimalButton.addEventListener("click", inputDecimal);
equalsButton.addEventListener("click", handleEquals);
clearButton.addEventListener("click", handleClear);
deleteButton.addEventListener("click", handleDelete);

// Show the starting 0
updateDisplay();