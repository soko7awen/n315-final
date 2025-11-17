import $ from "jquery";

export const meta = {
  order: 4,
  id: "products",
  label: "Products",
};

export function render() {
  return `<h1>Welcome to the Products Page</h1>
<div id="clickMe" class="btn">Click Me</div>`;
}

export function init() {
  console.log("products function called");

  $("#clickMe").on("click", function () {
    alert("You clicked the button on the Products Page!");
  });
}
