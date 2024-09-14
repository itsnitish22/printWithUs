const slides = document.querySelectorAll(".slide");
let counter = 0;

// Position each slide next to the other
slides.forEach(function(slideimg, index) {
    slideimg.style.left = `${index * 100}%`;
});

const prev=()=>{
    if (counter>0) {
        counter--;
        slideimage(); 
    }
    
    
}
const next=()=>{
    if (counter<2) {
        counter++;
        slideimage();
    }
   

}

const slideimage = () => {
    slides.forEach(function(slide) {
        slide.style.transform = `translateX(${counter * -100}%)`;  // Use parentheses for interpolation
    });
};
