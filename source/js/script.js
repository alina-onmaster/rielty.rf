let openMenuBtn = document.querySelector(".burger");
let closeMenuBtn = document.querySelector(".main-nav__close-btn");
let menu = document.querySelector(".main-nav");
let windowWidth = document.documentElement.clientWidth;


openMenuBtn.onclick = function () {
  if (windowWidth < 992) {
    menu.classList.add("main-nav--opened");
  };
};

closeMenuBtn.onclick = function () {
  if (windowWidth < 992) {
    menu.classList.remove("main-nav--opened");
  };
};
