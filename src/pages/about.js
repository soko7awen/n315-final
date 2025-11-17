import $ from "jquery";

export const meta = {
  order: 2,
  id: "about",
  label: "About",
};

export function render() {
  return `<h1>Welcome to the About Page</h1>
<div id="learn" class="btn">Learn More</div>`;
}

export function init() {
  console.log("about function called");

  $("#learn").on("click", function () {
    alert("You clicked the button on the About Page!");
  });
}
