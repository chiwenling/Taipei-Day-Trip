document.addEventListener("DOMContentLoaded", function() {
    function headers() {
        let token = localStorage.getItem("token");
        let headers = { "Content-Type": "application/json"};
        if (checkSignin()){ 
            headers = { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            };
        }
        return headers;
    }

    
    let signBtn = document.querySelector(".sign");
    let closeBtn = document.querySelectorAll(".close");
    let changeBox = document.getElementById("signupLink");
    let returnBox = document.getElementById("signinLink");
    let signinForm = document.querySelector(".signin_form");
    let signupForm = document.querySelector(".signup_form");

    
    signBtn.addEventListener("click", function() {
        document.querySelector(".signin").style.display = "block";
    });

    changeBox.addEventListener("click", function() {
        document.querySelector(".signin").style.display = "none";
        document.querySelector(".signup").style.display = "block";
    });

    returnBox.addEventListener("click", function() {
        document.querySelector(".signin").style.display = "block";
        document.querySelector(".signup").style.display = "none";
    });

    closeBtn.forEach(function(btn) {
        btn.addEventListener("click", function() {
            document.querySelector(".signin").style.display = "none";
            document.querySelector(".signup").style.display = "none";
            clearFormValue();
        });
    });

    let bookbtn = document.querySelector(".book") 
    bookbtn.addEventListener("click", async function() {
        if (checkSignin()) {
            console.log("看預定行程");
            try {
                let bookResponse = await fetch("http://127.0.0.1:8000/api/booking", {
                    method: "GET",
                    headers: headers()
                });
                if (bookResponse.ok) {
                    let bookData = await bookResponse.json(); 
                    console.log(bookData); 
                } else {
                    console.log("wrong");
                }
            } catch (error) {
                console.error(error);
            }
        } else {
            alert("你還沒有登入");
        }
    });

    async function checkSignin() {
        let signBtn = document.querySelector(".sign");
    
        signBtn.addEventListener("click", function() {
            if (this.textContent === "登出") {
                localStorage.removeItem("token");
                clearFormValue();
                clearFormAlerts();
                this.textContent = "登入/註冊";
                window.location.reload();
            }
        });
    
        let authResult = await checkAuth(); 
        if (authResult) {
            signBtn.textContent = "登出";
        } else {
            signBtn.textContent = "登入/註冊";
        }
    }

    // 清空輸入框
    function clearFormValue() {
        document.querySelector(".email").value = "";
        document.querySelector(".password").value = "";
        document.querySelector(".signup_name").value = "";
        document.querySelector(".signup_email").value = "";
        document.querySelector(".signup_password").value = "";
    }

    // 清空提醒
    function clearFormAlerts() {
        document.querySelector(".message1").textContent = "";
        document.querySelector(".message2").textContent = "";
    }
    
    // 是否提交登入
    if (signinForm) {
        signinForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            let email = document.querySelector(".email").value;
            let password = document.querySelector(".password").value;
            let signinData = {
                "email": email,
                "password": password
            };

            try {
                let signinResponse = await fetch("http://127.0.0.1:8000/api/user/auth", {
                    method: "PUT",
                    headers: headers(),
                    body: JSON.stringify(signinData)
                });

                let signinResult = await signinResponse.json();
                console.log("signinResult", signinResult);

                if (signinResponse.ok && signinResult.token) {
                    localStorage.setItem("token", signinResult.token);
                    console.log(localStorage);
                    document.querySelector(".sign").textContent = "登出";                    
                    document.querySelector(".signin").style.display = "none";
                    window.location.reload();
                    // checkAuth(); 
                } else {
                    document.querySelector(".message1").textContent = signinResult.message;
                }
            } catch (error) {
                console.error("錯了", error);
            }
        });
    }

    // 是否提交註冊
    if (signupForm) {
        signupForm.addEventListener("submit", async function(event) {
            event.preventDefault();

            let name = document.querySelector(".signup_name").value;
            let email = document.querySelector(".signup_email").value;
            let password = document.querySelector(".signup_password").value;
            let signupData = {
                "name": name,
                "email": email,
                "password": password
            };
            console.log("front-end",signupData);

            try {
                let signupResponse = await fetch("http://127.0.0.1:8000/api/user", {
                    method: "POST",
                    headers: headers(),
                    body: JSON.stringify(signupData)
                });
                console.log("signupResponse:",signupResponse)

                let signupResult = await signupResponse.json();
                console.log("signupResult", signupResult);
                if (signupResponse.ok && signupResult.ok) {
                    document.querySelector(".message2").textContent = "註冊成功";
                    clearFormValue();
                } else {
                    document.querySelector(".message2").textContent = signupResult.message;
                }
            } catch (error) {
                return {
                    message: "伺服器內部錯誤"
                };
            }
        }
    )}

    async function checkAuth() {
        let url = "http://127.0.0.1:8000/api/user/auth";
        let token = localStorage.getItem("token");
        function headers() {
            return {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            };
        }

        if (!token) {
            return null;
        }
    
        try {
            let response = await fetch(url, {
                method: "GET",
                headers: headers()
            });

            let data = await response.json();
            if (data && data.data) {
                console.log("成功登入", data);
                return data; 
            } else {
                console.log("還未登入");
                return null; 
            }
        } catch (error) {
            console.error("錯誤", error);
            return null;  
        }
    }

 
    let apiURL = "http://127.0.0.1:8000/api/attractions";
    let container = document.querySelector(".attractionAll");
    let searchInput = document.querySelector(".search_input");
    let searchButton = document.querySelector(".search_button");
    let mrtName = document.querySelector(".mrt_name");
    let scrollLeft = document.querySelector(".scroll_left");
    let scrollRight = document.querySelector(".scroll_right");
    let loading = document.querySelector(".getMore");

    let nextPage = 0;
    let loadingData = false;

    function loadAttractions(page, keyword) {
        if (loadingData || nextPage === null) return;
        loadingData = true;

        let url = `${apiURL}?page=${page}`;
        console.log("checkul",url)
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

        fetch(url, {
            method: "GET",
            headers: headers()
        })
        .then(response => response.ok ? response.json() : Promise.reject("error"))
        .then(travelData => {
            let attractions = travelData.data;
            if (page === 0) container.innerHTML = "";

            attractions.forEach(attraction => {
                let attractionItem = document.createElement("div");
                attractionItem.className = "attraction_item";
                attractionItem.innerHTML = `
                    <div class="image-container">
                        <a href="http://127.0.0.1:8000/attraction/${attraction.id}">
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

            nextPage = travelData.nextPage;
            loadingData = false;
            if (nextPage === null) loading.style.display = "none";
        })
        .catch(error => {
            console.error(error);
            loadingData = false;
        });
    }

    function handleScroll() {
        let rect = loading.getBoundingClientRect();
        let isEnd = rect.top <= window.innerHeight && rect.bottom >= 0;

        if (isEnd && nextPage !== null) {
            loadAttractions(nextPage, searchInput.value);
        }
    }

    function fetchMRT() {
        fetch("http://127.0.0.1:8000/api/mrts", {
            method: "GET",
            headers: headers()
        })
        .then(response => response.ok ? response.json() : Promise.reject("Error"))
        .then(mrtData => {
            let stations = mrtData.data;
            mrtName.innerHTML = "";
            stations.forEach(station => {
                let button = document.createElement("div");
                button.className = "station_button";
                button.textContent = station;
                button.addEventListener("click", () => {
                    nextPage = 0;
                    searchInput.value = station;
                    loadAttractions(nextPage, searchInput.value);
                });
                mrtName.appendChild(button);
            });
            mrtName.scrollLeft = 0;
        })
        .catch(error => {
            console.error(error);
        });
    }


    loadAttractions(nextPage);
    fetchMRT();
    if(scrollLeft&&scrollRight&&searchButton){
        scrollLeft.addEventListener("click", () => mrtName.scrollBy({ left: -100 }));
        scrollRight.addEventListener("click", () => mrtName.scrollBy({ left: 100 }));
        searchButton.addEventListener("click", () => {
            nextPage = 0;
            loadAttractions(nextPage, searchInput.value);
    });
    window.addEventListener("scroll", handleScroll);
    }
});


// Attraction 依照不同選項得不同價格
document.addEventListener("DOMContentLoaded", function () {
   
    let morning = document.querySelector(".morning_option");
    let afternoon = document.querySelector(".afternoon_option");
    let costTotal = document.querySelector(".total");
    let images = document.querySelector(".attraction_pic");
    let pic_scrollLeft = document.querySelector(".pic_scroll_left");
    let pic_scrollRight = document.querySelector(".pic_scroll_right");
    let dots = document.querySelector(".dots");
    let link = window.location.pathname;
    let attractionId = link.split("/").pop();    
    let attractionUrl = `http://127.0.0.1:8000/api/attraction/${attractionId}`;
    let index = 0;

    if (afternoon) {
        afternoon.addEventListener("change", function () {
            if (afternoon.checked) {
                costTotal.textContent = "新台幣 2500元"; 
            }
        });
    }

    if (morning) {
        morning.addEventListener("change", function () {
            if (morning.checked) {
                costTotal.textContent = "新台幣 2000元";
            }
        });
    }
    if (attractionId>0){ 
            fetch(attractionUrl)
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    let attraction = data.data;
                    let imagesAll = attraction.images;

                    document.querySelector(".name").textContent = attraction.name;
                    document.querySelector(".cat").textContent = `${attraction.category} at ${attraction.MRT}`;
                    document.querySelector(".description").textContent = attraction.description;
                    document.querySelector(".address").textContent = attraction.address;
                    document.querySelector(".trans").textContent = attraction.transport;

                    let imageLists = images.querySelectorAll(".pic");
                    imageLists.forEach(function(img) {
                        img.remove();
                    });

                    let dotElements = dots.querySelectorAll(".dot");
                    dotElements.forEach(function(dot) {
                        dot.remove();
                    });

                    
                    imagesAll.forEach((imageUrl, i) => {
                        let imgElement = document.createElement("img");
                        imgElement.src = imageUrl;
                        imgElement.classList.add("pic");
                        if (i === 0) { 
                            imgElement.classList.add("active");
                        }
                        images.appendChild(imgElement);

                        let dotElement = document.createElement("div");
                        dotElement.classList.add("dot");
                        if (i === 0) {
                            dotElement.classList.add("active");
                        }
                        dotElement.addEventListener("click", function() {
                            showImage(i);
                            index = i;
                        });
                        dots.appendChild(dotElement);
                    });

                
                    images.appendChild(pic_scrollLeft);
                    images.appendChild(pic_scrollRight);
                    scrollButton();

                    function showImage(idx) {
                        let imageLists = images.querySelectorAll(".pic");
                        imageLists.forEach((img, i) => {
                            img.classList.remove("active");
                            if (i === idx) {
                                img.classList.add("active");
                            }
                        });

                        let dotLists = dots.querySelectorAll(".dot");
                        dotLists.forEach((dot, i) => {
                            dot.classList.remove("active");
                            if (i === idx) {
                                dot.classList.add("active");
                            }
                        });
                    }

                    function scrollButton() {
                        if (index == 0) {
                            pic_scrollLeft.style.pointerEvents = "none";
                            pic_scrollLeft.style.opacity = "0.5";
                        } else {
                            pic_scrollLeft.style.pointerEvents = "auto";
                            pic_scrollLeft.style.opacity = "1";
                        }
                        if (index === imagesAll.length - 1) {
                            pic_scrollRight.style.pointerEvents = "none";
                            pic_scrollRight.style.opacity = "0.5";
                        } else {
                            pic_scrollRight.style.pointerEvents = "auto";
                            pic_scrollRight.style.opacity = "1";
                        }
                    }

                    pic_scrollLeft.addEventListener("click", function() {
                        if (index > 0) {
                            let nextIndex = index - 1;
                            showImage(nextIndex);
                            index = nextIndex;
                        }
                    });

                    pic_scrollRight.addEventListener("click", function() {
                        if (index < imagesAll.length - 1) {
                            let nextIndex = index + 1;
                            showImage(nextIndex);
                            index = nextIndex;
                        }
                    });
                })
                .catch(function(error) {
                    console.error("Error:", error);
                });
        }});