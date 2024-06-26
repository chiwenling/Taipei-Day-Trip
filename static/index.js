document.addEventListener("DOMContentLoaded", function() {
    
    let signBtn = document.querySelector(".sign");
    let closeBtn = document.querySelectorAll(".close");
    let changeBox = document.getElementById("signupLink");
    let returnBox = document.getElementById("signinLink");


    signBtn.addEventListener("click", function() {
        signin.style.display = "block";
    });

    changeBox.addEventListener("click", function() {
        signin.style.display = "none";
        signup.style.display = "block";
    });

    returnBox.addEventListener("click", function() {
        signin.style.display = "block";
        signup.style.display = "none";
    });

    closeBtn.forEach(function(btn) {
        btn.addEventListener("click", function() {
            signin.style.display = "none";
            signup.style.display = "none";
        });
    });
});

document.addEventListener("DOMContentLoaded", function(){
    let apiURL = "http://52.37.77.90:8000/api/attractions";
    
    // let apiURL = "http://127.0.0.1:8000/api/attractions";
    let container = document.querySelector(".attractionAll");
    let nextPage = 0;
    let loadingData = false;
    let searchInput = document.querySelector(".search_input");
    let searchButton = document.querySelector(".search_button");
    let mrtName = document.querySelector(".mrt_name");
    let scrollLeft = document.querySelector(".scroll_left");
    let scrollRight = document.querySelector(".scroll_right");
    let loading = document.querySelector(".getMore");

    loadAttractions(nextPage);

    function loadAttractions(page, keyword){
        if (loadingData || nextPage === null) {
            return; 
        }loadingData = true;

        let url=apiURL+"?page="+page;
        if (keyword) {
            url=url+"&keyword="+encodeURIComponent(keyword);
        }

        fetch(url)
            .then(function(response){
                if (!response.ok) {
                    console.log("error");
                }
                return response.json();
            })

            .then(function(data){
                let attractions = data.data; 
                if (page === 0) {
                    container.innerHTML = "";
                }
               
                attractions.forEach(function(attraction) {
                    let attractionItem = document.createElement("div");
                    attractionItem.className = "attraction_item";
                    attractionItem.innerHTML = `
                        <div class="image-container">
                            <a href="http://52.37.77.90:8000/attraction/${attraction.id}">
                                <img src="${attraction.images.length > 0 ? attraction.images[0] : "default.jpg"}" alt="${attraction.name}">
                            </a>
                            <div class="attraction_title">
                                <div class="attraction_title_font">${attraction.name}</div>   
                            </div>
                        </div>
                        <div class="info">
                            <span>${attraction.mrt}</span>
                            <span>${attraction.category}</span>
                        </div>
                    `;
                    container.appendChild(attractionItem);
                });

                nextPage = data.nextPage; 
                loadingData = false;

                if (nextPage === null) {
                    loading.style.display = "none"; 
                }
            })

            .catch(function(error) {
                console.error("Error fetching data:", error);
                loadingData = false;
            });
    };

    function scroll(){
        let rect = loading.getBoundingClientRect();
        let isTop = rect.top <= window.innerHeight;
        let isBottom = rect.bottom >= 0;
        let end = isTop && isBottom;

        if (end && nextPage !== null) {
            loadAttractions(nextPage, searchInput.value);
        }
    };

    window.addEventListener("scroll", scroll);

    function fetchMRT() {
        fetch("http://52.37.77.90:8000/api/mrts")
        // fetch("http://127.0.0.1:8000/api/mrts")
            .then(function(response) {
                if (!response.ok) {
                    console.log("Error");
                }
                return response.json();
            })
            .then(function(data) {
                let stations = data.data; 
                mrtName.innerHTML = "";
                stations.forEach(function(station) {
                    let button = document.createElement("div");
                    button.className = "station_button";
                    button.textContent = station; 
                    button.addEventListener("click", function() {
                        nextPage = 0;
                        searchInput.value = station; 
                        loadAttractions(nextPage, searchInput.value);
                    });
                    mrtName.appendChild(button);
                });
                mrtName.scrollLeft = 0;
                console.log("finished"); 
            })
            .catch(function(error) {
                console.error("Error fetch", error);
            });
    }
    
    fetchMRT();
   

    scrollLeft.addEventListener("click", function() {
        mrtName.scrollBy({ left: -100});
    });

    scrollRight.addEventListener("click", function() {
        mrtName.scrollBy({ left: 100});
    });

    searchButton.addEventListener("click", function() {
        nextPage = 0; 
        loadAttractions(nextPage, searchInput.value);
    });
});
