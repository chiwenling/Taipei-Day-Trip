document.addEventListener("DOMContentLoaded", async () => {

    // 避免一直重複
    window.AppState = {
        alreadySignin: false,
        userData: null
    }; 

    await checkAuth();  
    checkSignin(); 
    let book = document.querySelector(".book");
    let signBtn = document.querySelector(".sign");
    let closeBtn = document.querySelectorAll(".close");
    let changeBox = document.getElementById("signupLink");
    let returnBox = document.getElementById("signinLink");
    let signinForm = document.querySelector(".signin_form");
    let signupForm = document.querySelector(".signup_form");
    
    book.addEventListener("click",function(){
        if(window.AppState.alreadySignin) {
            document.querySelector(".signin").style.display = "none";
            window.location.href = "http://52.12.29.58:8000/booking";
        }else{
            document.querySelector(".signin").style.display = "block";
        }
    });
    
    signBtn.addEventListener("click", function() {
    if (window.AppState.alreadySignin) {
        document.querySelector(".signin").style.display = "none"; 
        localStorage.removeItem("token");
        window.AppState.alreadySignin = false;
        clearFormValue();
        clearFormAlerts();
        this.textContent = "登入/註冊";
        window.location.reload();
    } else {
        document.querySelector(".signin").style.display = "block";
    }
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
    let token = localStorage.getItem("token");
    function headers() {
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        } else {
            headers["Authorization"] = undefined;
        }
    }

    // 確認是否登入
    function checkSignin() {
        let signBtn = document.querySelector(".sign");
        if (window.AppState.alreadySignin) {
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
                let signinResponse = await fetch("http://52.12.29.58:8000/api/user/auth", {
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
                let signupResponse = await fetch("http://52.12.29.58:8000/api/user", {
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

    // 檢查是否登入
    async function checkAuth() {
        let url = "http://52.12.29.58:8000/api/user/auth";
        let token = localStorage.getItem("token");
        if (!token) {
            window.AppState.alreadySignin = false;
            // return null;
        }
    
        try {
            let response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            let userData = await response.json();
            if (userData && userData.data) {
                // console.log("有登入狀態", userData);
                window.AppState.alreadySignin = true;
                window.AppState.userData=userData;
                return userData; 
            } else {
                console.log("未登入狀態");
                window.AppState.alreadySignin = false;
                return null; 
            }
        } catch (error) {
            console.error("錯誤", error);
            window.AppState.alreadySignin = false;
            return null;  
        }
    }

    // API景點
    let apiURL = "http://52.12.29.58:8000/api/attractions";
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
        
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return error;
            }
        })
        .then(travelData => {
            let attractions = travelData.data;
            if (page === 0) container.innerHTML = "";

            attractions.forEach(attraction => {
                let attractionItem = document.createElement("div");
                attractionItem.className = "attraction_item";
                attractionItem.innerHTML = `
                    <div class="image-container">
                        <a href="http://52.12.29.58:8000/attraction/${attraction.id}">
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

    function scroll() {
        let rect = loading.getBoundingClientRect();
        let isEnd = rect.top <= window.innerHeight && rect.bottom >= 0;

        if (isEnd && nextPage !== null) {
            loadAttractions(nextPage, searchInput.value);
        }
    }

    // API mrt
    function fetchMRT() {
        fetch("http://52.12.29.58:8000/api/mrts", {
            method: "GET",
            headers: headers()
        })
        .then(function(response) {
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject("Error"); 
            }
        })
        
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

    //進入各別景點頁 
    async function attractionPage() {
        let morning = document.querySelector(".morning_option");
        let afternoon = document.querySelector(".afternoon_option");
        let costTotal = document.querySelector(".total");
        let images = document.querySelector(".attraction_pic");
        let pic_scrollLeft = document.querySelector(".pic_scroll_left");
        let pic_scrollRight = document.querySelector(".pic_scroll_right");
        let dots = document.querySelector(".dots");
        let attractionId = window.location.pathname.split("/").pop();    
        let attractionUrl = `http://52.12.29.58:8000/api/attraction/${attractionId}`;
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
    
        if (attractionId > 0) { 
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
    
                    function showImage(x) {
                        let imageLists = images.querySelectorAll(".pic");
                        imageLists.forEach((img, i) => {
                            img.classList.remove("active");
                            if (i === x) {
                                img.classList.add("active");
                            }
                        });
    
                        let dotLists = dots.querySelectorAll(".dot");
                        dotLists.forEach((dot, i) => {
                            dot.classList.remove("active");
                            if (i === x) {
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
        }
    }
    
    //景點分頁「開始預定行程」訂購
    async function booking() {
        let bookBtn = document.querySelector(".btn");
    
        if (bookBtn) {
            bookBtn.addEventListener("click", async function() {
                let userData = await checkAuth();
                if (userData) {
                    await submitBooking(); 
                } else {
                    document.querySelector(".signin").style.display = "block";
                }
            });
    
            async function submitBooking() {
                let attractionId = window.location.pathname.split('/').pop(); 
                let period = document.querySelector('input[name="time"]:checked').value;
                let price = document.querySelector(".total").textContent;
                let date = document.getElementById("date").value;

    
                let bookingData = {
                    attractionId: attractionId,
                    date: date,
                    time: period,
                    price: price
                };
                console.log("bookingData", bookingData);

                try {
                    let response = await fetch("http://52.12.29.58:8000/api/booking", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify(bookingData)
                    });
    
                    let data = await response.json(); 
                    if (response.ok) {
                        console.log(data)
                        if (data.message === "請先選擇日期") {
                            alert("請選擇日期");
                        } else {
                            console.log("預定結果:", data);
                            alert("完成訂購");
                            window.location.href = "http://52.12.29.58:8000/booking";
                        }
                    } else {
                        console.log("test")
                    }
                } catch (error) {
                    console.error("預定錯誤:", error);
                }
            }
        }
    }
    // 訂購頁要抓取資料庫有的資料
    async function bookingPage(){
        let memberGreeting = document.getElementById("memberGreeting");
        let userData=window.AppState.userData;
        let period="";
        if(window.AppState.alreadySignin) {
            memberGreeting.textContent = `您好，${userData.data.name}，待預定的行程如下：`;
            try{
                let response = await fetch("http://52.12.29.58:8000/api/booking", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                let bookingDetail = await response.json();
                let pic = document.querySelector(".pic");
                let title = document.querySelector(".productTitle");
                let date = document.querySelector(".date");
                let time = document.querySelector(".time");
                let price = document.querySelector(".price");
                let address = document.querySelector(".address");
                let total_cost = document.querySelector(".total_cost");
                let product = document.querySelector(".product")

                if (bookingDetail && bookingDetail.data){
                    if (bookingDetail.data.time="morning"){
                        period="早上八點到十二點";
                    }else{
                        period="下午一點到五點";
                    }
                    console.log("有訂購資料",bookingDetail);
                    // console.log("訂購頁會員資料",userData);
                    document.getElementById("memberName").value=userData.data.name;
                    document.getElementById("memberEmail").value=userData.data.email;
                    pic.src=bookingDetail.data.attraction.image;
                    title.textContent = bookingDetail.data.attraction.name;
                    date.textContent = bookingDetail.data.date;
                    time.textContent = period;
                    price.textContent = bookingDetail.data.price;
                    address.textContent = bookingDetail.data.attraction.address;
                    total_cost.textContent = bookingDetail.data.price;
                    finaldata = bookingDetail;
                }else{
                    product.innerHTML="";
                    let new_product = document.createElement("div");
                    let newInfo =document.createElement("div");
                    let footer = document.querySelector("footer");
                    newInfo.className="note";
                    new_product.className = "c1";
                    new_product.id="memberGreeting";
                    new_product.textContent = `您好，${userData.data.name}，待預定的行程如下：`;
                    newInfo.textContent="目前沒有任何待預訂的行程";
                    product.appendChild(new_product);
                    product.appendChild(newInfo);
                    footer.style.height = "500px";
                    console.log("沒有訂購資料");
                }
            }catch (error) {
                console.error("錯了", error);
            }
        }else{
            window.location.href = "http://52.12.29.58:8000/";
            console.log("要回到主頁");
        };
    };


    // 刪除景點的垃圾桶
    async function cancelBook(){
        let deleteBtn = document.querySelector(".delete");
        deleteBtn.addEventListener("click", async function(){
            try {
                let response = await fetch("http://52.12.29.58:8000/api/booking", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                let data = await response.json(); 
                if (response.ok) {
                    console.log("已刪除景點")
                    bookingPage();
                    window.location.reload()
                }else{
                }
            }catch (error) {
                    console.error("刪除失敗:", error);
            }
        });
    }

    attractionPage();
    booking();

    if (document.querySelector(".getMore")) {   
        loadAttractions(nextPage);
        fetchMRT();
        window.addEventListener("scroll", scroll);
    };

    if(scrollLeft&&scrollRight&&searchButton){
        scrollLeft.addEventListener("click", () => mrtName.scrollBy({ left: -100 }));
        scrollRight.addEventListener("click", () => mrtName.scrollBy({ left: 100 }));
        searchButton.addEventListener("click", () => {
            nextPage = 0;
            loadAttractions(nextPage, searchInput.value);
        });
    };
    
    if(window.location.pathname === "/booking"){
        await bookingPage();
    };

    if(document.querySelector(".delete")){
        cancelBook();
    };
   

    // 以下是金流
    let payBtn =document.querySelector(".paybtn");
    let fields ={
                number: {
                    element:"#card-number",
                    placeholder: "**** **** **** ****"
                },
                expirationDate: {
                    element: document.getElementById("card-expiration-date"),
                    placeholder: "MM / YY"
                },
                ccv: {
                    element: "#card-ccv",
                    placeholder: "ccv"
                }
            };

    if (payBtn){
        TPDirect.card.setup({
                fields: fields,
                styles: {
                    "input": {
                        "color": "gray",
                        "font-size":"16px"
                    },
                    ".valid": {
                        "color": "green"
                    },
                    ".invalid": {
                        "color": "red"
                    },
                    "@media screen and (max-width: 400px)": {
                        "input": {
                            "color": "orange"
                        }
                    }
                },
                isMaskCreditCardNumber: false,
            });

        TPDirect.card.onUpdate(function (update) {
            if (update.canGetPrime) {
                payBtn.removeAttribute("disabled");
            } else {
                payBtn.setAttribute("disabled", true); 
            };

            if (update.cardType === "visa") {
            };

            // 信用卡號碼錯誤
            if (update.status.number === 2) {
            } else if (update.status.number === 0) {
            } else { 
            };

            if (update.status.expiry === 2) {
            } else if (update.status.expiry === 0) {
            } else {    
            };

            if (update.status.ccv === 2) {  
            } else if (update.status.ccv === 0) {
            } else {
            };
        });

        // 這要再研究一下
        async function onSubmit() {
            return new Promise(function (resolve){
                let tappayStatus = TPDirect.card.getTappayFieldsStatus();
                if (tappayStatus.canGetPrime === false) {
                    alert("can not get prime");
                } else {
                    TPDirect.card.getPrime((result) => {
                        if (result.status !== 0) {
                            alert("get prime error " + result.msg);
                        } else {
                            let prime = result.card.prime;
                            // console.log("Prime:", prime);
                            resolve(prime);
                        }
                    });
                }
            });
        };

        //  把後端回傳的訂購資訊還有prime拿出來
        async function getproductInfo(finaldata,prime){ 
            console.log("有東西");
            let price = finaldata.data.price.match(/\d+/)[0];
            let name = document.querySelector(".memberName").value;
            let email= document.querySelector(".memberEmail").value;
            let phone = document.querySelector(".memberPhone").value;
            orderData={
                "prime": prime,
                "order": {
                  "price": price,
                  "trip": {
                    "attraction":finaldata.data.attraction,
                    "date": finaldata.data.date,
                    "time": finaldata.data.time
                  },
                  "contact": {
                    "name": name,
                    "email": email,
                    "phone": phone
                  }
                }
            };
            console.log("要給後端的",orderData);

            // 建立新訂單
            try {
                let response = await fetch("http://52.12.29.58:8000/api/orders", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(orderData)
                });

                let getBookdata = await response.json();
                console.log("檢查收到的東西",getBookdata)
                order_number= getBookdata["data"]["number"];
                console.log("後端回傳資料",order_number);
                window.location.href = `/thankyou?number=${order_number}`;
            }catch (error) {
                console.error("錯了", error);
            }
        }; 
        
        document.querySelector(".payForm").addEventListener("submit", async function(event) {
            event.preventDefault(); 
            let prime = await onSubmit();
            alert("訂購完成");
            await getproductInfo(finaldata, prime);
            console.log("最後一步ok了"); 
        });
        
    };

    async function getOrderDetail() {
        let url = new URLSearchParams(window.location.search);
        let orderNumber = url.get("number");

        if (window.AppState.alreadySignin && orderNumber) {
            try {
                let response = await fetch(`http://52.12.29.58:8000/api/order/${orderNumber}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                let result = await response.json();
                console.log("訂單資訊:", result);
                document.querySelector(".result").textContent = ` ${result["data"]["contact"]["name"]}，您已完成訂單！`;
                document.querySelector(".yournumber").textContent = `你的訂單編號是 ${orderNumber}`;
            } catch (error) {
                console.log("有錯", error);
            }
        } else {
            window.location.href = "http://52.12.29.58:8000/";
        }
    };

    // 訂單完成的話，刪除預定清單
    async function clear() {
        try {
            let response = await fetch("http://52.12.29.58:8000/api/booking", {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
    
            if (response.ok) {
                console.log("已刪除");
            } 
        } catch (error) {
            console.log("有問題", error);
        }
    }

    let result =document.querySelector(".result");
    if(result){
        await getOrderDetail();
        await clear();
    };
});

