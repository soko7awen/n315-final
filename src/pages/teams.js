import $ from "jquery";

export const meta = {
  order: 3,
  id: "teams",
  label: "Teams",
  parent: "about",
};

export function render() {
  return `<h1>Welcome to the Teams Page</h1>;
<div id="clickMe" class="btn">Click Me</div>`;
}

export function init() {
  console.log("contact function called");

  $("#clickMe").on("click", function () {
    alert("You clicked the button on the Teams Page!");
  });
}
