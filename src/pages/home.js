import $ from "jquery";

export const meta = {
  order: 1,
  id: "home",
  label: "Home",
};

export function render() {
  return `<h1>Welcome to the Home Page</h1>
<div id="clickMe" class="btn">Click Me</div>`;
}

export function init() {
  console.log("home function called");

  $("#clickMe").on("click", function () {
    alert("You clicked the button on the Home Page!");
  });
}
