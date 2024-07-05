// 登入登出跳出視窗
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

// 依照不同選項得不同價格
document.addEventListener("DOMContentLoaded", function () {
    let morning = document.querySelector(".morning_option");
    let afternoon = document.querySelector(".afternoon_option");
    let costTotal = document.querySelector(".total");

    morning.addEventListener("change", function () {
        if (morning.checked) {
            costTotal.textContent = "新台幣 2000元";
        }
    });

    afternoon.addEventListener("change", function () {
        if (afternoon.checked) {
            costTotal.textContent = "新台幣 2500元"; 
        }
    });
});

document.addEventListener("DOMContentLoaded",function(){
    
    let images = document.querySelector(".attraction_pic")
    let scrollLeft = document.querySelector(".scroll_left")
    let scrollRight = document.querySelector(".scroll_right")
    let dots = document.querySelector(".dots")
    
    // 取出網址的id
    let link = window.location.pathname;
    let attractionId = link.split("/").pop();    
    let url= `http://52.37.77.90:8000/api/attraction/${attractionId}`;
    // let url= `http://52.37.77.90:8000/api/attraction/${attractionId}`;
    let index=0;

    fetch(url)
        .then(function(response){
            return response.json();
        })

        .then(function(data){
            let attraction = data.data;
            console.log(attraction);
            // attraction是object
            let imagesAll = attraction.images;
            console.log(imagesAll);
            // imagesAll是array

            document.querySelector(".name").textContent=attraction.name;
            document.querySelector(".cat").textContent= `${attraction.category} at ${attraction.MRT}`;
            document.querySelector(".description").textContent=attraction.description;
            document.querySelector(".address").textContent=attraction.address;
            document.querySelector(".trans").textContent=attraction.transport;

            
            let imageLists = images.querySelectorAll(".pic");
            imageLists.forEach(function(img){
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
                if(i === 0){ 
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

            images.appendChild(scrollLeft);
            images.appendChild(scrollRight);

            function showImage(idx){
                let imageLists =images.querySelectorAll(".pic");
                imageLists.forEach((img,i)=> {
                img.classList.remove("active");
                if (i === idx){
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
                scrollButton();
            }

    
            function scrollButton(){
                if (index == 0){
                    scrollLeft.style.pointerEvents="none";
                    scrollLeft.style.opacity="0.5";
                } else{
                    scrollLeft.style.pointerEvents="auto";
                    scrollLeft.style.opacity="1";
                }
                if (customElements === imagesAll.length -1){
                    scrollRight.style.pointerEvents = "none";
                    scrollRight.style.opacity = "0.5";

                }else{
                    scrollRight.style.pointerEvents = "auto";
                    scrollRight.style.opacity = "1";
                }
            };

            scrollButton();
            scrollLeft.addEventListener("click", function() {
                if (index > 0) { 
                    let nextIndex = index - 1;
                    showImage(nextIndex); 
                    index = nextIndex; 
                }
            });

            scrollRight.addEventListener("click", function() {
                if (index< imagesAll.length -1) { 
                    let nextIndex = index + 1;
                    showImage(nextIndex); 
                    index = nextIndex;
                }
            });
        })
        .catch(function(error) {
            console.error("error:", error); 
        });
    });

// 備用js
// function headers() {
    //     let token = localStorage.getItem("token");
    //     let headers = { "Content-Type": "application/json"};
    //     if (checkSignin()){ 
    //         headers = { 
    //             "Content-Type": "application/json",
    //             "Authorization": `Bearer ${token}` 
    //         };
    //     }
    //     return headers;
    // }

     // let bookbtn = document.querySelector(".book") 
    // bookbtn.addEventListener("click", async function() {
    //     if (checkSignin()) {
    //         console.log("看預定行程");
    //         try {
    //             let bookResponse = await fetch("http://127.0.0.1:8000/api/booking", {
    //                 method: "GET",
    //                 headers: headers()
    //             });
    //             if (bookResponse.ok) {
    //                 let bookData = await bookResponse.json(); 
    //                 console.log(bookData); 
    //             } else {
    //                 console.log("wrong");
    //             }
    //         } catch (error) {
    //             console.error(error);
    //         }
    //     } else {
    //         alert("你還沒有登入");
    //     }
    // });

    // 確認是否登入
    // async function checkSignin() {
    //     let signBtn = document.querySelector(".sign");
    
    //     signBtn.addEventListener("click", function() {
    //         if (this.textContent === "登出") {
    //             localStorage.removeItem("token");
    //             clearFormValue();
    //             clearFormAlerts();
    //             this.textContent = "登入/註冊";
    //             document.querySelector(".signin").style.display = "none";
    //             window.location.reload();
    //         }
    //     });
    
    //     let authResult = await checkAuth(); 
    //     if (authResult) {
    //         signBtn.textContent = "登出";
    //     } else {
    //         signBtn.textContent = "登入/註冊";
    //     }
    // }

    // async function checkAuth() {
    //     let url = "http://127.0.0.1:8000/api/user/auth";
    //     let token = localStorage.getItem("token");
    //     function headers() {
    //         return {
    //             "Authorization": `Bearer ${token}`,
    //             "Content-Type": "application/json"
    //         };
    //     }

    //     if (!token) {
    //         return null;
    //     }
    
    //     try {
    //         let response = await fetch(url, {
    //             method: "GET",
    //             headers: headers()
    //         });

    //         let data = await response.json();
    //         if (data && data.data) {
    //             console.log("成功登入", data);
    //             return data; 
    //         } else {
    //             console.log("還未登入");
    //             return null; 
    //         }
    //     } catch (error) {
    //         console.error("錯誤", error);
    //         return null;  
    //     }
    // }