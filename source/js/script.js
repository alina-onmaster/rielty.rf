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


var complexesSlider = null;
var mediaQuerySize = 768;

function complexesSliderInit () {
  if (!complexesSlider) {
    complexesSlider = new Swiper('.complexes__swiper-container', {
      slidesPerView: 1.08,
      spaceBetween: 10,
    });
  }
}

(function() {

  'use strict';

  // breakpoint where swiper will be destroyed
  // and switches to a dual-column layout
  const breakpoint = window.matchMedia( '(min-width:992px)' );

  // keep track of swiper instances to destroy later
  let complexesSlider;

  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////

  const breakpointChecker = function() {

    // if larger viewport and multi-row layout needed
    if ( breakpoint.matches === true ) {

      // clean up old instances and inline styles when available
      if ( complexesSlider !== undefined ) complexesSlider.destroy( true, true );

      // or/and do nothing
      return;

      // else if a small viewport and single column layout needed
    } else if ( breakpoint.matches === false ) {

      // fire small viewport version of swiper
      return enableSwiper();

    }

  };

  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////

  const enableSwiper = function() {

    complexesSlider = new Swiper ('.complexes__swiper-container', {


      breakpoints: {
        // when window width is >= 320px
        320: {
          slidesPerView: 1.08,
          spaceBetween: 10,
        },
        // when window width is >= 768px
        768: {
          slidesPerView: 1.08,
          spaceBetween: 30,
        },
      }
    });

  };

  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////

  // keep an eye on viewport size changes
  breakpoint.addListener(breakpointChecker);

  // kickstart
  breakpointChecker();



})(); /* IIFE end */

